import { useSyncExternalStore } from 'react';
import { slides as DEFS, type SlideDef } from '../config/slides';
import { applyContent, applyVideos } from './content';
import { blobGet, blobSet, idbGet, idbSet } from './idb';
import { uid, type Asset, type OverlayEl, type Project, type SlideInst } from './types';

/* ───────── исходный HTML (для экспорта) — снимается до запуска React ───────── */
export const PRISTINE_HTML = (() => {
  // копия документа без встроенного проекта (ищем элемент в DOM, а не текстом — строка встречается и в коде)
  const c = document.documentElement.cloneNode(true) as HTMLElement;
  c.querySelector('#ashyq-project')?.remove();
  return '<!doctype html>\n' + c.outerHTML;
})();

export type Mode = 'view' | 'edit';
export type Sel = { kind: 'ov'; id: string } | { kind: 'el'; path: string };

export interface UI {
  mode: Mode;
  /** выбранный в редакторе слайд */
  cur: string;
  sel: Sel | null;
  zoom: number | 'fit';
  /** «режим урока» внутри редактора: клики уходят в сам слайд (открыть ответ, нажать игру) */
  interact: boolean;
  /** растёт при изменении данных заданий → слайды перерисовываются */
  ver: number;
  status: 'saved' | 'saving' | 'dirty' | 'error';
  toast: { id: number; text: string } | null;
}

const defsById = Object.fromEntries(DEFS.map((d) => [d.id, d])) as Record<string, SlideDef>;
export const slideDef = (inst: SlideInst | undefined) => (inst?.base ? defsById[inst.base] : undefined);

/** Данные слайда для навигации: этап урока, цвета фона, «голый» экран */
export function slideMeta(inst: SlideInst, list: SlideInst[]) {
  const def = slideDef(inst);
  let group = def?.group;
  if (!group) {
    const i = list.indexOf(inst);
    for (let k = i - 1; k >= 0 && !group; k--) group = slideDef(list[k])?.group;
  }
  return {
    title: inst.title,
    group: group ?? DEFS[0].group,
    palette: inst.bg?.palette ?? def?.palette ?? DEFS[0].palette,
    bare: def?.bare ?? false,
  };
}

export function defaultProject(): Project {
  return {
    v: 1,
    pid: 'default',
    name: 'HTML-де кесте құру',
    updated: 0,
    slides: DEFS.map((d) => ({ id: d.id, base: d.id, title: d.title, over: {}, texts: {}, overlay: [] })),
    content: {},
    videos: {},
    assets: {},
  };
}

/* ───────── состояние ───────── */
let project: Project = defaultProject();
let ui: UI = { mode: 'view', cur: DEFS[0].id, sel: null, zoom: 'fit', interact: false, ver: 0, status: 'saved', toast: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/* ───────── ассеты ───────── */
const objectUrls: Record<string, string> = {};
export function assetUrl(id?: string): string | undefined {
  if (!id) return undefined;
  const a = project.assets[id];
  if (!a) return undefined;
  return a.data ?? objectUrls[id] ?? a.path;
}
export const hasAssetBytes = (id: string) => !!(project.assets[id]?.data || objectUrls[id]);
export function assetBlobUrl(id: string) {
  return objectUrls[id];
}

/** Добавить файл: картинки — внутрь проекта (data:URL, при необходимости уменьшаются), видео — в IndexedDB */
export async function addAssetFile(file: File): Promise<string> {
  const id = uid('a');
  const isVideo = file.type.startsWith('video/');
  const safe = file.name.replace(/[^\w.-]+/g, '_').slice(-60) || 'file';
  if (isVideo) {
    await blobSet(id, file);
    objectUrls[id] = URL.createObjectURL(file);
    const asset: Asset = { id, name: file.name, mime: file.type, kind: 'video', path: `media/${id}-${safe}`, size: file.size };
    commit((p) => {
      p.assets[id] = asset;
    }, { history: false });
  } else {
    const data = await imageToDataUrl(file);
    commit((p) => {
      p.assets[id] = { id, name: file.name, mime: file.type, kind: 'image', data, size: data.length };
    }, { history: false });
  }
  return id;
}

/** Подключить уже существующий файл (импорт ZIP / выбор папки media) */
export async function attachAssetBlob(id: string, blob: Blob) {
  await blobSet(id, blob);
  if (objectUrls[id]) URL.revokeObjectURL(objectUrls[id]);
  objectUrls[id] = URL.createObjectURL(blob);
}

async function imageToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  if (file.size < 1_500_000 || file.type === 'image/svg+xml' || file.type === 'image/gif') return raw;
  // большие фото уменьшаем, чтобы файл презентации оставался лёгким
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = raw;
  });
  const k = Math.min(1, 2400 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
}

/* ───────── история (отмена/повтор) ───────── */
const past: string[] = [];
const future: string[] = [];
let lastMerge: { key: string; t: number } | null = null;
const snap = () => JSON.stringify({ ...project, assets: undefined });
function restore(s: string) {
  const p = JSON.parse(s) as Project;
  project = { ...p, assets: project.assets };
  afterProjectChange(true);
}

function afterProjectChange(contentChanged: boolean) {
  if (contentChanged) {
    applyContent(project.content);
    applyVideos(project.videos, assetUrl);
  }
  if (!project.slides.some((s) => s.id === ui.cur)) ui = { ...ui, cur: project.slides[0]?.id ?? '' };
  ui = { ...ui, ver: contentChanged ? ui.ver + 1 : ui.ver, status: 'dirty' };
  scheduleSave();
  emit();
}

/**
 * Изменить проект. mutate получает копию проекта.
 * merge — ключ для склейки быстрых правок (набор текста, ползунки) в один шаг отмены.
 */
export function commit(mutate: (p: Project) => void, opts: { merge?: string; history?: boolean } = {}) {
  const before = snap();
  const next = structuredClone({ ...project, assets: {} }) as Project;
  next.assets = { ...project.assets };
  mutate(next);
  const contentChanged = JSON.stringify(next.content) !== JSON.stringify(project.content) || JSON.stringify(next.videos) !== JSON.stringify(project.videos);
  if (opts.history !== false) {
    const now = Date.now();
    const merged = opts.merge && lastMerge && lastMerge.key === opts.merge && now - lastMerge.t < 1500;
    if (!merged) {
      past.push(before);
      if (past.length > 80) past.shift();
    }
    lastMerge = opts.merge ? { key: opts.merge, t: now } : null;
    future.length = 0;
  }
  project = next;
  afterProjectChange(contentChanged);
}

/** Временное изменение без записи в историю (во время перетаскивания); потом commit */
let dragBase: string | null = null;
export function preview(mutate: (p: Project) => void) {
  if (!dragBase) dragBase = snap();
  const next = structuredClone({ ...project, assets: {} }) as Project;
  next.assets = project.assets;
  mutate(next);
  project = next;
  emit();
}
export function endPreview(changed: boolean) {
  if (!dragBase) return;
  if (changed) {
    past.push(dragBase);
    future.length = 0;
    lastMerge = null;
    ui = { ...ui, status: 'dirty' };
    scheduleSave();
  }
  dragBase = null;
  emit();
}

export function undo() {
  const s = past.pop();
  if (!s) return;
  future.push(snap());
  restore(s);
  toast('Отменено');
}
export function redo() {
  const s = future.pop();
  if (!s) return;
  past.push(snap());
  restore(s);
  toast('Повторено');
}
export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;

/* ───────── UI ───────── */
export function setUI(patch: Partial<UI>) {
  if (patch.mode && patch.mode !== ui.mode) {
    try {
      sessionStorage.setItem('ashyq-mode', patch.mode);
    } catch {
      /* нет доступа */
    }
  }
  ui = { ...ui, ...patch };
  emit();
}
let toastId = 0;
export function toast(text: string) {
  const id = ++toastId;
  setUI({ toast: { id, text } });
  window.setTimeout(() => {
    if (ui.toast?.id === id) setUI({ toast: null });
  }, 2200);
}

/* ───────── сохранение ───────── */
let saveTimer: number | undefined;
function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void saveNow(), 700);
}
export async function saveNow(showToast = false) {
  window.clearTimeout(saveTimer);
  ui = { ...ui, status: 'saving' };
  emit();
  project = { ...project, updated: Date.now() };
  const ok = await idbSet(`project:${project.pid}`, project);
  ui = { ...ui, status: ok ? 'saved' : 'error' };
  emit();
  if (showToast) toast(ok ? 'Сохранено' : 'Не удалось сохранить в браузере — скачайте ZIP');
}

/* ───────── загрузка ───────── */
function readEmbedded(): Project | null {
  const el = document.getElementById('ashyq-project');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as Project;
  } catch {
    return null;
  }
}

function normalize(p: Project): Project {
  const d = defaultProject();
  const out: Project = { ...d, ...p, assets: p.assets ?? {}, content: p.content ?? {}, videos: p.videos ?? {} };
  out.slides = (p.slides ?? d.slides)
    .filter((s) => s.base === null || defsById[s.base])
    .map((s) => ({ ...s, over: s.over ?? {}, texts: s.texts ?? {}, overlay: s.overlay ?? [] }));
  if (!out.slides.length) out.slides = d.slides;
  return out;
}

let filePid = 'default';
/** Ключ проекта этого файла (у экспортированной копии — свой) */
export const getFilePid = () => filePid;

export async function initProject() {
  const embedded = readEmbedded();
  const pid = embedded?.pid ?? 'default';
  filePid = pid;
  const saved = await idbGet<Project>(`project:${pid}`);
  let p = embedded ?? saved ?? defaultProject();
  if (embedded && saved && (saved.updated ?? 0) > (embedded.updated ?? 0)) p = saved;
  await loadProject(p, false);
  const params = new URLSearchParams(location.search);
  let lastMode: string | null = null;
  try {
    lastMode = sessionStorage.getItem('ashyq-mode');
  } catch {
    /* нет доступа */
  }
  if (params.get('edit') === '1' || lastMode === 'edit') ui = { ...ui, mode: 'edit' };
}

/** Заменить текущий проект (загрузка/импорт) */
export async function loadProject(p: Project, save = true) {
  project = normalize(p);
  for (const a of Object.values(project.assets)) {
    if (a.kind === 'video' && !objectUrls[a.id]) {
      const b = await blobGet(a.id);
      if (b) objectUrls[a.id] = URL.createObjectURL(b);
    }
  }
  past.length = 0;
  future.length = 0;
  ui = { ...ui, cur: project.slides[0]?.id ?? '', sel: null };
  applyContent(project.content);
  applyVideos(project.videos, assetUrl);
  ui = { ...ui, ver: ui.ver + 1, status: 'saved' };
  emit();
  if (save) await saveNow();
}

/* ───────── чтение ───────── */
export const getProject = () => project;
export const getUI = () => ui;
export function useProject<T>(sel: (p: Project) => T): T {
  return useSyncExternalStore(subscribe, () => sel(project));
}
export function useUI<T>(sel: (u: UI) => T): T {
  return useSyncExternalStore(subscribe, () => sel(ui));
}

/** Слайды для показа (без скрытых) */
export function visibleSlides(p: Project = project) {
  return p.slides.filter((s) => !s.hidden);
}
export const findSlide = (id: string, p: Project = project) => p.slides.find((s) => s.id === id);

export function newOverlay(kind: OverlayEl['kind'], extra: Partial<OverlayEl> = {}): OverlayEl {
  const base: OverlayEl = { id: uid('o'), kind, box: { x: 660, y: 330, w: 600, h: 140, rot: 0 }, z: 10, style: {} };
  if (kind === 'text') Object.assign(base, { text: 'Жаңа мәтін', style: { fontSize: 48, color: '#1d1b3a', fontWeight: 700, fontFamily: 'Geologica Variable' } });
  if (kind === 'button') Object.assign(base, { text: 'Батырма', box: { x: 760, y: 380, w: 400, h: 110, rot: 0 }, style: { fontSize: 36, color: '#ffffff', bg: '#7b5cff', fontWeight: 700, radius: 24, borderColor: '#1d1b3a', borderWidth: 3, shadow: 'hard', align: 'center' }, action: { type: 'next' } });
  if (kind === 'shape') Object.assign(base, { shape: 'rect', box: { x: 760, y: 300, w: 400, h: 300, rot: 0 }, style: { bg: '#ffd23f', borderColor: '#1d1b3a', borderWidth: 4, radius: 28, shadow: 'hard' } });
  if (kind === 'image') Object.assign(base, { box: { x: 610, y: 200, w: 700, h: 500, rot: 0 }, fit: 'contain', style: { radius: 20 } });
  if (kind === 'video') Object.assign(base, { box: { x: 480, y: 160, w: 960, h: 540, rot: 0 }, style: { radius: 24, borderColor: '#1d1b3a', borderWidth: 3 } });
  return { ...base, ...extra };
}

/** Слайды для навигации (без скрытых) — стабильная ссылка, пока проект не изменился */
const deckCache = new WeakMap<Project, DeckItem[]>();
export interface DeckItem {
  id: string;
  title: string;
  group: SlideDef['group'];
  palette: [string, string, string];
  bare: boolean;
  inst: SlideInst;
}
export function deckOf(p: Project): DeckItem[] {
  let d = deckCache.get(p);
  if (!d) {
    const vis = visibleSlides(p);
    d = vis.map((inst) => ({ id: inst.id, inst, ...slideMeta(inst, p.slides) }));
    deckCache.set(p, d);
  }
  return d;
}
export const useDeck = () => useProject(deckOf);

/** Служебный доступ для автотестов (ничего не меняет) */
(window as unknown as { __ashyq: object }).__ashyq = { getProject, getUI };
