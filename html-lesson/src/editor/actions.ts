import { commit, findSlide, getProject, getUI, newOverlay, setUI, toast } from './store';
import { elementAt, pathOf } from './render';
import { uid, type ElOverride, type OverlayEl, type Project, type SlideInst } from './types';

/* ───────── выбор ───────── */
export const curSlide = (p: Project = getProject()) => findSlide(getUI().cur, p);
export const slideRootEl = (id = getUI().cur) => document.querySelector<HTMLElement>(`[data-editor-canvas] [data-slide-root="${id}"]`);
export const overlayEl = (id: string) => document.querySelector<HTMLElement>(`[data-editor-canvas] [data-ov-id="${id}"]`);

export function selectedOverlay(p: Project = getProject()): OverlayEl | undefined {
  const s = getUI().sel;
  if (s?.kind !== 'ov') return undefined;
  return curSlide(p)?.overlay.find((o) => o.id === s.id);
}

/** Изменить текущий слайд */
export function editSlide(fn: (s: SlideInst, p: Project) => void, merge?: string) {
  const id = getUI().cur;
  commit((p) => {
    const s = findSlide(id, p);
    if (s) fn(s, p);
  }, { merge });
}

export function editOverlay(id: string, fn: (o: OverlayEl) => void, merge?: string) {
  editSlide((s) => {
    const o = s.overlay.find((x) => x.id === id);
    if (o) fn(o);
  }, merge);
}

export function editOver(path: string, fn: (o: ElOverride) => void, merge?: string) {
  editSlide((s) => {
    const o = (s.over[path] ??= {});
    fn(o);
    if (!Object.values(o).some((v) => v !== undefined && !(typeof v === 'object' && !Object.keys(v as object).length))) delete s.over[path];
  }, merge);
}

/* ───────── добавление ───────── */
export function addOverlay(kind: OverlayEl['kind'], extra: Partial<OverlayEl> = {}) {
  const el = newOverlay(kind, extra);
  editSlide((s) => {
    el.z = Math.max(10, ...s.overlay.map((o) => o.z + 1));
    s.overlay.push(el);
  });
  setUI({ sel: { kind: 'ov', id: el.id } });
  return el.id;
}

/* ───────── буфер обмена (между слайдами тоже) ───────── */
let clipboard: OverlayEl[] | null = null;

/** Снимок существующего элемента как самостоятельного блока (статический HTML) */
function snapshotElement(path: string): OverlayEl | null {
  const root = slideRootEl();
  const el = root && elementAt(root, path);
  if (!root || !(el instanceof HTMLElement)) return null;
  const rr = root.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = root.offsetWidth / rr.width;
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.translate = '';
  clone.style.width = `${el.offsetWidth}px`;
  clone.style.height = `${el.offsetHeight}px`;
  clone.style.margin = '0';
  clone.style.transform = '';
  clone.style.opacity = '1';
  clone.querySelectorAll('[style]').forEach((n) => {
    const h = n as HTMLElement;
    if (h.style.opacity === '0') h.style.opacity = '1';
  });
  const cs = getComputedStyle(el);
  const wrapStyle = `color:${cs.color};font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};line-height:${cs.lineHeight}`;
  return newOverlay('html', {
    html: `<div style="${wrapStyle.replace(/"/g, "'")}">${clone.outerHTML}</div>`,
    nat: { w: el.offsetWidth, h: el.offsetHeight },
    box: { x: (r.left - rr.left) * k, y: (r.top - rr.top) * k, w: r.width * k, h: r.height * k, rot: 0 },
  });
}

export function copySelection(): boolean {
  const s = getUI().sel;
  if (!s) return false;
  if (s.kind === 'ov') {
    const o = selectedOverlay();
    if (o) clipboard = [structuredClone(o)];
  } else {
    const snap = snapshotElement(s.path);
    if (snap) clipboard = [snap];
  }
  if (clipboard) toast('Скопировано');
  return !!clipboard;
}

export function paste() {
  if (!clipboard) return toast('Буфер пуст — сначала скопируйте элемент');
  const items = clipboard.map((o) => ({ ...structuredClone(o), id: uid('o') }));
  editSlide((s) => {
    const top = Math.max(10, ...s.overlay.map((o) => o.z + 1));
    items.forEach((o, i) => {
      if (s.overlay.some((x) => x.box.x === o.box.x && x.box.y === o.box.y)) {
        o.box.x += 30;
        o.box.y += 30;
      }
      o.z = top + i;
      s.overlay.push(o);
    });
  });
  setUI({ sel: { kind: 'ov', id: items[items.length - 1].id } });
}

export function duplicateSelection() {
  if (copySelection()) paste();
}

export function deleteSelection() {
  const s = getUI().sel;
  if (!s) return;
  if (s.kind === 'ov') editSlide((sl) => void (sl.overlay = sl.overlay.filter((o) => o.id !== s.id)));
  else {
    editOver(s.path, (o) => void (o.hidden = true));
    toast('Элемент скрыт. Вернуть — справа «Показать»');
  }
  setUI({ sel: null });
}

/* ───────── слои ───────── */
export function layer(dir: 'up' | 'down' | 'top' | 'bottom') {
  const s = getUI().sel;
  if (!s) return;
  if (s.kind === 'ov') {
    editSlide((sl) => {
      const list = [...sl.overlay].sort((a, b) => a.z - b.z);
      const i = list.findIndex((o) => o.id === s.id);
      const [el] = list.splice(i, 1);
      const j = dir === 'top' ? list.length : dir === 'bottom' ? 0 : Math.max(0, Math.min(list.length, i + (dir === 'up' ? 1 : -1)));
      list.splice(j, 0, el);
      list.forEach((o, k) => (o.z = 10 + k));
    });
  } else {
    editOver(s.path, (o) => {
      const z = o.z ?? 0;
      o.z = dir === 'top' ? 50 : dir === 'bottom' ? -1 : z + (dir === 'up' ? 1 : -1);
    });
  }
}

/* ───────── выравнивание по слайду ───────── */
const AREA = { w: 1920, h: 900 };
export function align(where: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') {
  const s = getUI().sel;
  if (!s) return;
  if (s.kind === 'ov') {
    editOverlay(s.id, (o) => {
      if (where === 'left') o.box.x = 0;
      if (where === 'hcenter') o.box.x = Math.round((AREA.w - o.box.w) / 2);
      if (where === 'right') o.box.x = AREA.w - o.box.w;
      if (where === 'top') o.box.y = 0;
      if (where === 'vcenter') o.box.y = Math.round((AREA.h - o.box.h) / 2);
      if (where === 'bottom') o.box.y = AREA.h - o.box.h;
    });
    return;
  }
  const root = slideRootEl();
  const el = root && elementAt(root, s.path);
  if (!root || !el) return;
  const rr = root.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = root.offsetWidth / rr.width;
  const x = (r.left - rr.left) * k;
  const y = (r.top - rr.top) * k;
  const w = r.width * k;
  const h = r.height * k;
  editOver(s.path, (o) => {
    if (where === 'left') o.dx = (o.dx ?? 0) - x;
    if (where === 'hcenter') o.dx = (o.dx ?? 0) + (AREA.w - w) / 2 - x;
    if (where === 'right') o.dx = (o.dx ?? 0) + AREA.w - w - x;
    if (where === 'top') o.dy = (o.dy ?? 0) - y;
    if (where === 'vcenter') o.dy = (o.dy ?? 0) + (AREA.h - h) / 2 - y;
    if (where === 'bottom') o.dy = (o.dy ?? 0) + AREA.h - h - y;
  });
}

export function nudge(dx: number, dy: number) {
  const s = getUI().sel;
  if (!s) return;
  if (s.kind === 'ov')
    editOverlay(s.id, (o) => {
      o.box.x += dx;
      o.box.y += dy;
    }, 'nudge');
  else
    editOver(s.path, (o) => {
      o.dx = (o.dx ?? 0) + dx;
      o.dy = (o.dy ?? 0) + dy;
    }, 'nudge');
}

export function selectParent() {
  const s = getUI().sel;
  if (s?.kind !== 'el' || !s.path) return;
  const parts = s.path.split('.');
  parts.pop();
  setUI({ sel: parts.length ? { kind: 'el', path: parts.join('.') } : null });
}

export function resetSelection() {
  const s = getUI().sel;
  if (s?.kind !== 'el') return;
  editSlide((sl) => {
    delete sl.over[s.path];
    for (const k of Object.keys(sl.texts)) if (k.startsWith(`${s.path}#`)) delete sl.texts[k];
  });
  toast('Изменения элемента сброшены');
}

/* ───────── слайды ───────── */
export function addSlide(after: string, from?: SlideInst) {
  const id = uid('s');
  commit((p) => {
    const i = p.slides.findIndex((s) => s.id === after);
    const inst: SlideInst = from
      ? { ...structuredClone(from), id, title: `${from.title} (копия)`, hidden: false }
      : { id, base: null, title: 'Жаңа слайд', over: {}, texts: {}, overlay: [] };
    if (from) inst.overlay.forEach((o) => (o.id = uid('o')));
    p.slides.splice(i + 1, 0, inst);
  });
  setUI({ cur: id, sel: null });
}
export function removeSlide(id: string) {
  const p = getProject();
  if (p.slides.length <= 1) return toast('Нельзя удалить единственный слайд');
  const i = p.slides.findIndex((s) => s.id === id);
  commit((q) => void (q.slides = q.slides.filter((s) => s.id !== id)));
  const next = getProject().slides[Math.max(0, i - 1)];
  setUI({ cur: next.id, sel: null });
  toast('Слайд удалён (Ctrl+Z — вернуть)');
}
export function moveSlide(id: string, to: number) {
  commit((p) => {
    const i = p.slides.findIndex((s) => s.id === id);
    const [s] = p.slides.splice(i, 1);
    p.slides.splice(Math.max(0, Math.min(p.slides.length, to)), 0, s);
  });
}
export function toggleHidden(id: string) {
  commit((p) => {
    const s = findSlide(id, p);
    if (s) s.hidden = !s.hidden;
  });
}

/** Найти DOM-элемент выбранного */
export function selectedNode(): HTMLElement | null {
  const s = getUI().sel;
  if (!s) return null;
  if (s.kind === 'ov') return overlayEl(s.id);
  const root = slideRootEl();
  const el = root && elementAt(root, s.path);
  return el instanceof HTMLElement || el instanceof SVGElement ? (el as HTMLElement) : null;
}
export { pathOf };
