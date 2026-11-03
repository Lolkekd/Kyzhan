import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, type Variants } from 'motion/react';
import { lessonStore, useLesson } from './store/lessonStore';
import { playSound } from './lib/sound';
import { ScaledStage } from './components/layout/ScaledStage';
import { NavContext, type Nav } from './components/layout/NavContext';
import { TopBar, toggleFullscreen } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { TeacherPanel } from './components/layout/TeacherPanel';
import { useTimerWatcher } from './components/timer/useTimer';
import { TimerToast } from './components/timer/TimerToast';
import { setUI, useDeck, useUI } from './editor/store';
import { maxStep, SlideBody } from './editor/render';
import { SlideBackground } from './editor/SlideBackground';
import type { Transition } from './editor/types';

const Editor = lazy(() => import('./editor/Editor'));

/** Переходы между слайдами (настраиваются для каждого слайда в редакторе) */
const VARIANTS: Record<Transition, Variants> = {
  flip: {
    enter: (d) => ({ opacity: 0, x: d * 260, rotateY: d * -22, scale: 0.92 }),
    center: { opacity: 1, x: 0, rotateY: 0, scale: 1 },
    exit: (d) => ({ opacity: 0, x: d * -260, rotateY: d * 22, scale: 0.92 }),
  },
  slide: {
    enter: (d) => ({ opacity: 1, x: d * 1920 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 1, x: d * -1920 }),
  },
  fade: { enter: () => ({ opacity: 0 }), center: { opacity: 1 }, exit: () => ({ opacity: 0 }) },
  zoom: { enter: () => ({ opacity: 0, scale: 0.8 }), center: { opacity: 1, scale: 1 }, exit: () => ({ opacity: 0, scale: 1.15 }) },
  none: { enter: () => ({ opacity: 1 }), center: { opacity: 1 }, exit: () => ({ opacity: 0, transition: { duration: 0 } }) },
};

/** Элементы, внутри которых свайп/клавиши НЕ переключают слайд */
const INTERACTIVE = 'button, a, input, textarea, select, video, [data-no-swipe], [contenteditable="true"]';

export default function App() {
  const mode = useUI((u) => u.mode);
  useTimerWatcher();
  if (mode === 'edit')
    return (
      <Suspense fallback={null}>
        <Editor />
      </Suspense>
    );
  return <Viewer />;
}

function Viewer() {
  const deck = useDeck();
  const stored = useLesson((s) => s.slide);
  const lite = useLesson((s) => s.lite);
  const index = Math.min(Math.max(0, stored), Math.max(0, deck.length - 1));
  const [panelOpen, setPanelOpen] = useState(false);
  const [dir, setDir] = useState(1);
  /** шаг появления элементов «по нажатию» на текущем слайде */
  const [step, setStep] = useState(0);
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);
  const item = deck[index];
  const steps = item ? maxStep(item.inst) : 0;

  useEffect(() => {
    document.documentElement.dataset.lite = String(lite);
  }, [lite]);

  const goTo = useCallback(
    (i: number, atEnd = false) => {
      const cur = lessonStore.get().slide;
      if (i < 0 || i >= deck.length || i === cur) return;
      setDir(i > cur ? 1 : -1);
      setStep(atEnd ? maxStep(deck[i].inst) : 0);
      playSound('nav');
      lessonStore.update({ slide: i });
    },
    [deck],
  );

  const nav: Nav = useMemo(
    () => ({
      index,
      total: deck.length,
      goTo: (i: number) => goTo(i),
      next: () => {
        if (step < steps) {
          playSound('pop');
          setStep(step + 1);
        } else goTo(lessonStore.get().slide + 1);
      },
      prev: () => {
        if (step > 0) setStep(step - 1);
        else goTo(lessonStore.get().slide - 1, true);
      },
    }),
    [index, deck.length, goTo, step, steps],
  );

  // Клавиатура: стрелки / PageUp / PageDown (пульт-презентер), F, T, M, E (редактор), Home, End, Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key;
      if (key === 'Escape') return setPanelOpen(false);
      if (key === 't' || key === 'T' || key === 'е' || key === 'Е') return setPanelOpen((v) => !v);
      if (panelOpen) return;
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') {
        e.preventDefault();
        nav.next();
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        e.preventDefault();
        nav.prev();
      } else if (key === 'Home') goTo(0);
      else if (key === 'End') goTo(deck.length - 1);
      else if (key === 'f' || key === 'F' || key === 'а' || key === 'А') toggleFullscreen();
      else if (key === 'm' || key === 'M' || key === 'ь' || key === 'Ь') lessonStore.update((s) => ({ sound: !s.sound }));
      else if (key === 'e' || key === 'E' || key === 'у' || key === 'У') openEditor(item?.id);
      else if (key === 'l' || key === 'L' || key === 'д' || key === 'Д') lessonStore.update((s) => ({ lite: !s.lite }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav, goTo, panelOpen, deck.length, item]);

  if (!item) return <ScaledStage>{null}</ScaledStage>;
  // в лёгком режиме — короткое растворение вместо объёмных переходов
  const variants = lite ? VARIANTS.fade : VARIANTS[item.inst.transition ?? 'flip'];

  return (
    <MotionConfig reducedMotion={lite ? 'always' : 'user'}>
      <NavContext.Provider value={nav}>
        <ScaledStage>
          <div
            className="relative h-full w-full"
            onPointerDown={(e) => {
              // Свайп на сенсорной доске — только пальцем/пером и не по интерактивным элементам
              if (e.pointerType === 'mouse' || (e.target as HTMLElement).closest(INTERACTIVE)) {
                swipe.current = null;
                return;
              }
              swipe.current = { x: e.clientX, y: e.clientY, t: Date.now() };
            }}
            onPointerUp={(e) => {
              const s = swipe.current;
              swipe.current = null;
              if (!s || panelOpen) return;
              const dx = e.clientX - s.x;
              const dy = e.clientY - s.y;
              if (Date.now() - s.t < 700 && Math.abs(dx) > 140 && Math.abs(dy) < 100) {
                if (dx < 0) nav.next();
                else nav.prev();
              }
            }}
          >
            <SlideBackground inst={item.inst} palette={item.palette} />
            <TopBar onOpenPanel={() => setPanelOpen(true)} onEdit={() => openEditor(item.id)} />

            <div className={`absolute inset-x-0 bottom-[100px] top-[80px] ${lite ? '' : '[perspective:2000px]'}`}>
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={item.id}
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: lite ? 0.15 : item.inst.transition === 'none' ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <SlideBody inst={item.inst} step={step} />
                </motion.div>
              </AnimatePresence>
            </div>

            <BottomNav />
            <TimerToast />
            <TeacherPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
          </div>
        </ScaledStage>
      </NavContext.Provider>
    </MotionConfig>
  );
}

export function openEditor(slideId?: string) {
  setUI({ mode: 'edit', sel: null, interact: false, ...(slideId ? { cur: slideId } : {}) });
}
