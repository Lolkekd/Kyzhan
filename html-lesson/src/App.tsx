import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { slides } from './config/slides';
import { lessonStore, useLesson } from './store/lessonStore';
import { playSound } from './lib/sound';
import { ScaledStage } from './components/layout/ScaledStage';
import { NavContext, type Nav } from './components/layout/NavContext';
import { TopBar, toggleFullscreen } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { TeacherPanel } from './components/layout/TeacherPanel';
import { Background } from './components/animations/Background';
import { useTimerWatcher } from './components/timer/useTimer';
import { TimerToast } from './components/timer/TimerToast';

const slideVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 260, rotateY: d * -22, scale: 0.92, pointerEvents: 'none' as const }),
  center: { opacity: 1, x: 0, rotateY: 0, scale: 1, pointerEvents: 'auto' as const },
  exit: (d: number) => ({ opacity: 0, x: d * -260, rotateY: d * 22, scale: 0.92, pointerEvents: 'none' as const }),
};

/** Элементы, внутри которых свайп/клавиши НЕ переключают слайд */
const INTERACTIVE = 'button, a, input, textarea, select, video, [data-no-swipe], [contenteditable="true"]';

export default function App() {
  const stored = useLesson((s) => s.slide);
  const lite = useLesson((s) => s.lite);
  const index = Math.min(Math.max(0, stored), slides.length - 1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dir, setDir] = useState(1);
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);

  useTimerWatcher();

  useEffect(() => {
    document.documentElement.dataset.lite = String(lite);
  }, [lite]);

  const goTo = useCallback((i: number) => {
    const cur = lessonStore.get().slide;
    if (i < 0 || i >= slides.length || i === cur) return;
    setDir(i > cur ? 1 : -1);
    playSound('nav');
    lessonStore.update({ slide: i });
  }, []);

  const nav: Nav = useMemo(
    () => ({
      index,
      total: slides.length,
      goTo,
      next: () => goTo(lessonStore.get().slide + 1),
      prev: () => goTo(lessonStore.get().slide - 1),
    }),
    [index, goTo],
  );

  // Клавиатура: стрелки / PageUp / PageDown (пульт-презентер), F, T, M, Home, End, Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key;
      if (key === 'Escape') return setPanelOpen(false);
      if (key === 't' || key === 'T' || key === 'е' || key === 'Е') return setPanelOpen((v) => !v);
      if (panelOpen) return;
      if (key === 'ArrowRight' || key === 'PageDown') {
        e.preventDefault();
        nav.next();
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        e.preventDefault();
        nav.prev();
      } else if (key === 'Home') goTo(0);
      else if (key === 'End') goTo(slides.length - 1);
      else if (key === 'f' || key === 'F' || key === 'а' || key === 'А') toggleFullscreen();
      else if (key === 'm' || key === 'M' || key === 'ь' || key === 'Ь') lessonStore.update((s) => ({ sound: !s.sound }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav, goTo, panelOpen]);

  const Slide = slides[index].component;

  return (
    <MotionConfig reducedMotion="user">
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
            <Background palette={slides[index].palette} />
            <TopBar onOpenPanel={() => setPanelOpen(true)} />

            <div className="absolute inset-x-0 bottom-[100px] top-[80px] [perspective:2000px]">
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={slides[index].id}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Slide />
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
