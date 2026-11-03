import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  FolderOpen,
  Hand,
  ImagePlus,
  Maximize,
  MousePointer2,
  Play,
  Redo2,
  Save,
  Shapes,
  SquareMousePointer,
  Trash2,
  Type,
  Undo2,
  Video,
  ZoomIn,
  ZoomOut,
  CornerLeftUp,
  RotateCcw,
} from 'lucide-react';
import { lessonStore } from '../store/lessonStore';
import { addAssetFile, canRedo, canUndo, commit, deckOf, findSlide, getProject, getUI, redo, saveNow, setUI, undo, useProject, useUI } from './store';
import {
  addOverlay,
  addSlide,
  align,
  copySelection,
  deleteSelection,
  duplicateSelection,
  layer,
  moveSlide,
  nudge,
  paste,
  removeSlide,
  resetSelection,
  selectParent,
  toggleHidden,
} from './actions';
import { Canvas } from './Canvas';
import { SlidePanel } from './SlidePanel';
import { Inspector, pickFile } from './Inspector';
import { attachMediaFiles, exportZip, importFile, missingVideos } from './io';
import { IconBtn, cx } from './ui';

/** Визуальный редактор презентации (Canva / PowerPoint / Figma) */
export default function Editor() {
  const [menu, setMenu] = useState<{ x: number; y: number; target: 'canvas' | 'slide'; slideId?: string } | null>(null);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const onMenu = (e: Event) => setMenu((e as CustomEvent).detail);
    window.addEventListener('editor-menu', onMenu);
    return () => window.removeEventListener('editor-menu', onMenu);
  }, []);

  // Горячие клавиши
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const code = e.code;
      if (mod && (code === 'KeyZ' || k === 'z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && (code === 'KeyY' || k === 'y')) {
        e.preventDefault();
        redo();
      } else if (mod && (code === 'KeyS' || k === 's')) {
        e.preventDefault();
        void saveNow(true);
      } else if (mod && (code === 'KeyC' || k === 'c')) {
        if (copySelection()) e.preventDefault();
      } else if (mod && (code === 'KeyV' || k === 'v')) {
        e.preventDefault();
        paste();
      } else if (mod && (code === 'KeyD' || k === 'd')) {
        e.preventDefault();
        duplicateSelection();
      } else if (mod && (k === '=' || k === '+')) {
        e.preventDefault();
        zoomBy(1.2);
      } else if (mod && k === '-') {
        e.preventDefault();
        zoomBy(1 / 1.2);
      } else if (mod && k === '0') {
        e.preventDefault();
        setUI({ zoom: 'fit' });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (getUI().sel) {
          e.preventDefault();
          deleteSelection();
        }
      } else if (e.key.startsWith('Arrow')) {
        const s = getUI().sel;
        if (!s) {
          // без выделения стрелки листают слайды
          const list = getProject().slides;
          const i = list.findIndex((x) => x.id === getUI().cur);
          const j = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1 : i - 1;
          if (list[j]) {
            e.preventDefault();
            setUI({ cur: list[j].id });
          }
          return;
        }
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudge(e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0, e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0);
      } else if (e.key === 'Escape') {
        setMenu(null);
        const s = getUI().sel;
        if (s?.kind === 'el' && s.path.includes('.')) selectParent();
        else setUI({ sel: null });
      } else if (e.key === 'F5' || (mod && e.key === 'Enter')) {
        e.preventDefault();
        startShow(e.shiftKey);
      } else if (!mod && (code === 'KeyT' || k === 't')) addOverlay('text');
      else if (!mod && e.key === '?') setHelp((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f6f5fb] font-body text-[#1d1b3a]" onPointerDown={() => menu && setMenu(null)}>
      <Toolbar onHelp={() => setHelp(true)} />
      <div className="flex min-h-0 flex-1">
        <SlidePanel />
        <Canvas />
        <Inspector />
      </div>
      <StatusBar />
      <AnimatePresence>{menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}</AnimatePresence>
      <AnimatePresence>{help && <HelpDialog onClose={() => setHelp(false)} />}</AnimatePresence>
      <Toast />
    </div>
  );
}

function zoomBy(k: number) {
  const z = getUI().zoom;
  const curScale = z === 'fit' ? lastScale : z;
  setUI({ zoom: Math.max(0.1, Math.min(3, Math.round(curScale * k * 100) / 100)) });
}
let lastScale = 0.5;
window.addEventListener('editor-scale', (e) => (lastScale = (e as CustomEvent).detail));

/** Запустить показ с текущего слайда */
export function startShow(fromStart = false) {
  const p = getProject();
  const deck = deckOf(p);
  let idx = 0;
  if (!fromStart) {
    const all = p.slides;
    const i = all.findIndex((s) => s.id === getUI().cur);
    for (let k = i; k < all.length; k++) {
      const d = deck.findIndex((x) => x.id === all[k].id);
      if (d >= 0) {
        idx = d;
        break;
      }
    }
  }
  void saveNow();
  lessonStore.update({ slide: idx });
  setUI({ mode: 'view', sel: null });
}

/* ───────── верхняя панель ───────── */
function Toolbar({ onHelp }: { onHelp: () => void }) {
  const name = useProject((p) => p.name);
  const sel = useUI((u) => u.sel);
  const zoom = useUI((u) => u.zoom);
  const interact = useUI((u) => u.interact);
  useProject((p) => p); // для доступности отмены/повтора
  const [scale, setScale] = useState(lastScale);
  const [shapes, setShapes] = useState(false);
  useEffect(() => {
    const f = (e: Event) => setScale((e as CustomEvent).detail);
    window.addEventListener('editor-scale', f);
    return () => window.removeEventListener('editor-scale', f);
  }, []);

  const addMedia = async (kind: 'image' | 'video') => {
    const f = await pickFile(kind === 'image' ? 'image/*' : 'video/*');
    if (!f) return;
    const id = await addAssetFile(f);
    if (kind === 'image') {
      const img = new Image();
      img.src = (getProject().assets[id]?.data as string) ?? '';
      await img.decode().catch(() => undefined);
      const k = Math.min(1, 900 / (img.naturalWidth || 900), 640 / (img.naturalHeight || 640));
      const w = Math.round((img.naturalWidth || 700) * k);
      const h = Math.round((img.naturalHeight || 500) * k);
      addOverlay('image', { asset: id, box: { x: Math.round((1920 - w) / 2), y: Math.round((900 - h) / 2), w, h, rot: 0 } });
    } else addOverlay('video', { asset: id });
  };

  return (
    <header className="flex h-[58px] shrink-0 items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-[#e3e1ee] bg-white px-3">
      <div className="mr-2 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff5a5f] to-[#7b5cff] font-mono text-[14px] font-bold text-white">&lt;/&gt;</div>
        <div className="leading-tight">
          <input
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              commit((p) => void (p.name = v), { merge: 'name' });
            }}
            className="w-[170px] rounded px-1 text-[14px] font-bold outline-none hover:bg-[#f6f5fb] focus:bg-[#f6f5fb]"
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="px-1 text-[11px] text-[#9a96b4]">Редактор презентации</div>
        </div>
      </div>
      <Sep />
      <IconBtn icon={Undo2} label="Отменить" kbd="Ctrl+Z" onClick={undo} disabled={!canUndo()} />
      <IconBtn icon={Redo2} label="Повторить" kbd="Ctrl+Y" onClick={redo} disabled={!canRedo()} />
      <Sep />
      <IconBtn icon={Type} label="Текст" kbd="T" text="Текст" onClick={() => addOverlay('text')} />
      <IconBtn icon={ImagePlus} label="Картинка" text="Фото" onClick={() => void addMedia('image')} />
      <IconBtn icon={Video} label="Видео" text="Видео" onClick={() => void addMedia('video')} />
      <div className="relative">
        <IconBtn icon={Shapes} label="Фигура" text="Фигура" onClick={() => setShapes(!shapes)} />
        {shapes && (
          <div className="absolute left-0 top-11 z-50 flex w-[190px] flex-col rounded-xl border border-[#e3e1ee] bg-white p-1.5 shadow-xl" onMouseLeave={() => setShapes(false)}>
            {(
              [
                ['rect', 'Прямоугольник'],
                ['ellipse', 'Круг / овал'],
                ['pill', 'Капсула'],
                ['line', 'Линия'],
              ] as const
            ).map(([s, l]) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  addOverlay('shape', s === 'line' ? { shape: s, box: { x: 660, y: 440, w: 600, h: 10, rot: 0 }, style: { borderColor: '#1d1b3a', borderWidth: 8 } } : { shape: s });
                  setShapes(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-[13px] hover:bg-[#f1f0f7]"
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      <IconBtn icon={SquareMousePointer} label="Кнопка" text="Кнопка" onClick={() => addOverlay('button')} />
      <Sep />
      <IconBtn icon={Copy} label="Копировать" kbd="Ctrl+C" onClick={copySelection} disabled={!sel} />
      <IconBtn icon={ClipboardPaste} label="Вставить" kbd="Ctrl+V" onClick={paste} />
      <IconBtn icon={CopyPlus} label="Дублировать" kbd="Ctrl+D" onClick={duplicateSelection} disabled={!sel} />
      <IconBtn icon={Trash2} label="Удалить" kbd="Delete" onClick={deleteSelection} disabled={!sel} danger />
      <Sep />
      <IconBtn icon={ArrowUpToLine} label="На передний план" onClick={() => layer('top')} disabled={!sel} />
      <IconBtn icon={ArrowDownToLine} label="На задний план" onClick={() => layer('bottom')} disabled={!sel} />
      <AlignMenu disabled={!sel} />
      <Sep />
      <IconBtn icon={ZoomOut} label="Уменьшить" kbd="Ctrl −" onClick={() => zoomBy(1 / 1.2)} />
      <button type="button" title="Вписать в окно (Ctrl+0)" onClick={() => setUI({ zoom: 'fit' })} className="h-9 w-[54px] rounded-lg text-[13px] font-semibold text-[#3b3858] hover:bg-[#efedf8]">
        {zoom === 'fit' ? `${Math.round(scale * 100)}%` : `${Math.round(zoom * 100)}%`}
      </button>
      <IconBtn icon={ZoomIn} label="Увеличить" kbd="Ctrl +" onClick={() => zoomBy(1.2)} />
      <Sep />
      <button
        type="button"
        title="Режим урока: нажимайте кнопки и игры прямо на слайде (например, открыть ответ, чтобы его отредактировать)"
        onClick={() => setUI({ interact: !interact, sel: null })}
        aria-label={interact ? 'Редактировать' : 'Как ученик'}
        className={cx('flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold', interact ? 'bg-[#1d1b3a] text-white' : 'text-[#3b3858] hover:bg-[#efedf8]')}
      >
        {interact ? <MousePointer2 size={17} /> : <Hand size={17} />}
        <span className={interact ? '' : 'hidden min-[1700px]:inline'}>{interact ? 'Редактировать' : 'Как ученик'}</span>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <SaveState />
        <IconBtn icon={Save} label="Сохранить" kbd="Ctrl+S" onClick={() => void saveNow(true)} />
        <IconBtn
          icon={FolderOpen}
          label="Открыть сохранённую презентацию (ZIP / HTML)"
          text="Открыть"
          wide
          onClick={async () => {
            const f = await pickFile('.zip,.html,.htm,.json');
            if (f) await importFile(f).catch((e) => alert(`Не удалось открыть файл: ${e}`));
          }}
        />
        <IconBtn
          icon={Download}
          label="Скачать готовую презентацию (ZIP)"
          text="Скачать ZIP"
          wide
          onClick={async () => {
            const miss = await missingVideos();
            if (miss.length && confirm(`На этом компьютере нет файлов ${miss.length} видео.\nВыбрать папку media из архива, чтобы включить их в ZIP?`)) {
              const files = await pickFolder();
              if (files) await attachMediaFiles(files);
            }
            await exportZip();
          }}
        />
        <IconBtn icon={Maximize} label="Полный экран" onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen?.())} />
        <button type="button" onClick={onHelp} title="Горячие клавиши (?)" className="h-9 w-9 rounded-lg text-[15px] font-bold text-[#3b3858] hover:bg-[#efedf8]">
          ?
        </button>
        <button type="button" onClick={() => startShow()} title="Показ с текущего слайда (F5)" className="ml-1 flex h-9 items-center gap-1.5 rounded-xl bg-[#7b5cff] px-4 text-[14px] font-bold text-white shadow-[0_6px_20px_-6px_#7b5cff] hover:bg-[#6a4bf0]">
          <Play size={16} fill="currentColor" /> Показ
        </button>
      </div>
    </header>
  );
}

function pickFolder(): Promise<FileList | null> {
  return new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.multiple = true;
    (i as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true;
    i.onchange = () => res(i.files);
    i.click();
  });
}

const Sep = () => <span className="mx-1 h-6 w-px shrink-0 bg-[#e3e1ee]" />;

function AlignMenu({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <IconBtn icon={AlignCenterHorizontal} label="Выровнять по слайду" onClick={() => setOpen(!open)} disabled={disabled} />
      {open && !disabled && (
        <div className="absolute left-0 top-11 z-50 grid w-[210px] grid-cols-3 gap-1 rounded-xl border border-[#e3e1ee] bg-white p-2 shadow-xl" onMouseLeave={() => setOpen(false)}>
          {(
            [
              ['left', AlignStartVertical, 'Влево'],
              ['hcenter', AlignCenterVertical, 'По центру'],
              ['right', AlignEndVertical, 'Вправо'],
              ['top', AlignStartHorizontal, 'Вверх'],
              ['vcenter', AlignCenterHorizontal, 'По середине'],
              ['bottom', AlignEndHorizontal, 'Вниз'],
            ] as const
          ).map(([w, I, l]) => (
            <button key={w} type="button" title={l} onClick={() => align(w)} className="flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] hover:bg-[#f1f0f7]">
              <I size={18} />
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SaveState() {
  const status = useUI((u) => u.status);
  const map = { saved: ['Сохранено', 'bg-[#12a06a]'], saving: ['Сохранение…', 'bg-[#e69500]'], dirty: ['Изменено', 'bg-[#e69500]'], error: ['Ошибка сохранения', 'bg-[#d6303a]'] } as const;
  const [t, c] = map[status];
  return (
    <span className="mr-1 flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#6b6788]" title="Автосохранение в этом браузере. Чтобы перенести на другой компьютер — «Скачать ZIP».">
      <span className={cx('h-2 w-2 rounded-full', c)} />
      {t}
    </span>
  );
}

function StatusBar() {
  const cur = useUI((u) => u.cur);
  const slides = useProject((p) => p.slides);
  const sel = useUI((u) => u.sel);
  const i = slides.findIndex((s) => s.id === cur);
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-[#e3e1ee] bg-white px-4 text-[12px] text-[#6b6788]">
      <span>
        Слайд {i + 1} из {slides.length}
      </span>
      <span>{sel ? 'Перетаскивайте мышкой · стрелки — сдвиг на 1 px (Shift — 10 px) · двойной щелчок — текст' : 'Щёлкните по элементу, чтобы выбрать его · правый клик — меню'}</span>
      <span className="ml-auto">Горячие клавиши — «?»</span>
    </footer>
  );
}

/* ───────── контекстное меню ───────── */
function ContextMenu({ x, y, target, slideId, onClose }: { x: number; y: number; target: 'canvas' | 'slide'; slideId?: string; onClose: () => void }) {
  const sel = useUI((u) => u.sel);
  const slide = useProject((p) => (slideId ? findSlide(slideId, p) : undefined));
  const item = (icon: ReactNode, label: string, fn: () => void, kbd?: string, danger?: boolean) => (
    <button
      type="button"
      onClick={() => {
        fn();
        onClose();
      }}
      className={cx('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px]', danger ? 'text-[#d6303a] hover:bg-[#ffe9ea]' : 'hover:bg-[#f1f0f7]')}
    >
      <span className="text-[#6b6788]">{icon}</span>
      <span className="flex-1">{label}</span>
      {kbd && <span className="text-[11px] text-[#9a96b4]">{kbd}</span>}
    </button>
  );
  const list = getProject().slides;
  const idx = slideId ? list.findIndex((s) => s.id === slideId) : -1;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[1000] w-[240px] rounded-xl border border-[#e3e1ee] bg-white p-1.5 shadow-2xl"
      style={{ left: Math.min(x, window.innerWidth - 250), top: Math.min(y, window.innerHeight - 340) }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {target === 'canvas' ? (
        <>
          {sel && item(<Copy size={15} />, 'Копировать', copySelection, 'Ctrl+C')}
          {item(<ClipboardPaste size={15} />, 'Вставить', paste, 'Ctrl+V')}
          {sel && item(<CopyPlus size={15} />, 'Дублировать', duplicateSelection, 'Ctrl+D')}
          {sel && item(<ArrowUpToLine size={15} />, 'На передний план', () => layer('top'))}
          {sel && item(<ArrowDownToLine size={15} />, 'На задний план', () => layer('bottom'))}
          {sel?.kind === 'el' && item(<CornerLeftUp size={15} />, 'Выделить родительский блок', selectParent, 'Esc')}
          {sel?.kind === 'el' && item(<RotateCcw size={15} />, 'Сбросить изменения', resetSelection)}
          {item(<Type size={15} />, 'Добавить текст', () => addOverlay('text'), 'T')}
          {sel && item(<Trash2 size={15} />, sel.kind === 'el' ? 'Скрыть элемент' : 'Удалить', deleteSelection, 'Del', true)}
        </>
      ) : slide ? (
        <>
          {item(<FilePlus2 size={15} />, 'Новый пустой слайд после', () => addSlide(slide.id))}
          {item(<CopyPlus size={15} />, 'Дублировать слайд', () => addSlide(slide.id, slide))}
          {item(slide.hidden ? <Eye size={15} /> : <EyeOff size={15} />, slide.hidden ? 'Показывать при показе' : 'Скрыть при показе', () => toggleHidden(slide.id))}
          {idx > 0 && item(<ArrowUpToLine size={15} />, 'Переместить выше', () => moveSlide(slide.id, idx - 1))}
          {idx < list.length - 1 && item(<ArrowDownToLine size={15} />, 'Переместить ниже', () => moveSlide(slide.id, idx + 1))}
          {item(<Play size={15} />, 'Показ с этого слайда', () => startShow())}
          {item(<Trash2 size={15} />, 'Удалить слайд', () => removeSlide(slide.id), undefined, true)}
        </>
      ) : null}
    </motion.div>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  const rows = [
    ['Щелчок', 'выбрать элемент'],
    ['Двойной щелчок', 'изменить текст'],
    ['Перетаскивание', 'переместить (Alt — без привязки)'],
    ['Маркеры рамки', 'размер (Shift — с сохранением пропорций)'],
    ['Стрелки', 'сдвиг на 1 px, Shift — на 10 px'],
    ['Esc', 'выделить родительский блок / снять выделение'],
    ['Ctrl+Z / Ctrl+Y', 'отменить / повторить'],
    ['Ctrl+C / Ctrl+V / Ctrl+D', 'копировать / вставить / дублировать'],
    ['Delete', 'удалить (элементы слайда — скрыть)'],
    ['T', 'добавить текст'],
    ['Ctrl+S', 'сохранить'],
    ['Ctrl + / Ctrl − / Ctrl+0', 'масштаб / вписать'],
    ['F5', 'показ с текущего слайда'],
    ['E (в показе)', 'вернуться в редактор'],
  ];
  return (
    <motion.div className="fixed inset-0 z-[1000] grid place-items-center bg-[#1d1b3a]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={onClose}>
      <motion.div initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} className="w-[560px] rounded-2xl bg-white p-6 shadow-2xl" onPointerDown={(e) => e.stopPropagation()}>
        <div className="mb-4 text-[20px] font-bold">Горячие клавиши</div>
        <div className="grid grid-cols-[200px_1fr] gap-x-4 gap-y-2 text-[14px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <span className="font-mono text-[13px] text-[#5b3ee0]">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-5 h-10 w-full rounded-xl bg-[#7b5cff] font-semibold text-white">
          Понятно
        </button>
      </motion.div>
    </motion.div>
  );
}

function Toast() {
  const t = useUI((u) => u.toast);
  return (
    <AnimatePresence>
      {t && (
        <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-12 left-1/2 z-[1100] -translate-x-1/2 rounded-xl bg-[#1d1b3a] px-5 py-2.5 text-[14px] font-semibold text-white shadow-xl">
          {t.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
