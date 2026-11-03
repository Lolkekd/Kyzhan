import { memo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { EyeOff, FilePlus2, Copy } from 'lucide-react';
import { deckOf, setUI, useProject, useUI } from './store';
import { addSlide, moveSlide } from './actions';
import { SlideBody } from './render';
import { SlideBackground } from './SlideBackground';
import { openContextMenuEvent } from './Canvas';
import { NavContext } from '../components/layout/NavContext';
import { cx } from './ui';
import type { SlideInst } from './types';

const TW = 196;

/** Левая панель: миниатюры слайдов, перетаскивание для смены порядка, меню по правому клику */
export function SlidePanel() {
  const slides = useProject((p) => p.slides);
  const deck = useProject(deckOf);
  const cur = useUI((u) => u.cur);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  let shown = 0;

  return (
    <aside className="flex w-[244px] shrink-0 flex-col border-r border-[#e3e1ee] bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b6788]">Слайды · {slides.length}</span>
        <div className="flex gap-1">
          <button type="button" title="Новый пустой слайд" onClick={() => addSlide(cur)} className="grid h-7 w-7 place-items-center rounded-md text-[#3b3858] hover:bg-[#efedf8]">
            <FilePlus2 size={16} />
          </button>
          <button
            type="button"
            title="Новый слайд на основе текущего"
            onClick={() => {
              const s = slides.find((x) => x.id === cur);
              if (s) addSlide(cur, s);
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-[#3b3858] hover:bg-[#efedf8]"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-6"
        onDragOver={(e) => {
          e.preventDefault();
        }}
      >
        {slides.map((s, i) => {
          const num = s.hidden ? null : ++shown;
          return (
            <div key={s.id}>
              <div className={cx('mx-2 h-1 rounded-full transition-colors', over === i && dragId ? 'bg-[#7b5cff]' : 'bg-transparent')} />
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  setDragId(s.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', s.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOver(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setOver(e.clientY < r.top + r.height / 2 ? i : i + 1);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId && over !== null) {
                    const from = slides.findIndex((x) => x.id === dragId);
                    moveSlide(dragId, over > from ? over - 1 : over);
                  }
                  setDragId(null);
                  setOver(null);
                }}
                onClick={() => setUI({ cur: s.id, sel: null })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setUI({ cur: s.id, sel: null });
                  openContextMenuEvent(e.clientX, e.clientY, 'slide', s.id);
                }}
                className={cx('group mb-1 flex w-full gap-2 rounded-xl p-1.5 text-left transition-colors', cur === s.id ? 'bg-[#efeaff]' : 'hover:bg-[#f6f5fb]', dragId === s.id && 'opacity-40')}
              >
                <span className="w-5 pt-1 text-right text-[12px] font-semibold text-[#9a96b4]">{num ?? '–'}</span>
                <div className="min-w-0 flex-1">
                  <div className={cx('relative overflow-hidden rounded-lg ring-2', cur === s.id ? 'ring-[#7b5cff]' : 'ring-[#e3e1ee] group-hover:ring-[#cfc8f5]', s.hidden && 'opacity-45')} style={{ width: TW - 30, height: (TW - 30) * (1080 / 1920) }}>
                    <Thumb inst={s} palette={deck.find((d) => d.id === s.id)?.palette ?? ['#7b5cff', '#00c2a8', '#ff5a5f']} w={TW - 30} />
                    {s.hidden && (
                      <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-[#1d1b3a]/80 text-white" title="Скрыт при показе">
                        <EyeOff size={14} />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-[12px] font-medium text-[#3b3858]">{s.title}</div>
                </div>
              </button>
            </div>
          );
        })}
        <div className={cx('mx-2 h-1 rounded-full', over === slides.length && dragId ? 'bg-[#7b5cff]' : 'bg-transparent')} />
      </div>
    </aside>
  );
}

const NAV = { index: 0, total: 0, goTo: () => {}, next: () => {}, prev: () => {} };

/** Живая миниатюра слайда (рисуется тем же кодом, что и показ) */
const Thumb = memo(function Thumb({ inst, palette, w }: { inst: SlideInst; palette: [string, string, string]; w: number }) {
  const k = w / 1920;
  return (
    <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: 1920, height: 1080, transform: `scale(${k})` }} {...({ inert: '' } as object)}>
      <MotionConfig reducedMotion="always" transition={{ duration: 0 }}>
        <NavContext.Provider value={NAV}>
          <SlideBackground inst={inst} palette={palette} />
          <div className="absolute inset-x-0" style={{ top: 80, height: 900 }}>
            <SlideBody inst={inst} editing={false} thumb />
          </div>
        </NavContext.Provider>
      </MotionConfig>
    </div>
  );
});
