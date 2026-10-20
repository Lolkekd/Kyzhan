import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlarmClock, X } from 'lucide-react';
import { lessonStore, useLessonState } from '../../store/lessonStore';

const NAMES: Record<string, string> = {
  individual: 'Жеке жұмыс',
  pair: 'Жұптық жұмыс',
  team: 'Топтық жұмыс',
};

/** Всплывающее уведомление «Уақыт бітті!» — видно на любом слайде */
export function TimerToast() {
  const [alert] = useLessonState<{ id: string; at: number } | null>('ui.timerAlert', null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!alert || Date.now() - alert.at > 15000) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(t);
  }, [alert]);

  const close = () => {
    setVisible(false);
    lessonStore.setKV('ui.timerAlert', null);
  };

  return (
    <AnimatePresence>
      {visible && alert && (
        <motion.button
          type="button"
          onClick={close}
          initial={{ opacity: 0, y: -40, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -40, x: '-50%' }}
          className="absolute left-1/2 top-[92px] z-40 flex items-center gap-4 rounded-[24px] border border-rose/50 bg-[#2a0d1f]/95 py-3 pl-4 pr-6 shadow-[0_20px_60px_-10px_rgb(var(--c-rose)/0.6)]"
          data-no-swipe
        >
          <span className="anim-wiggle grid h-12 w-12 place-items-center rounded-2xl bg-rose text-ink" style={{ ['--dur' as string]: '0.8s', ['--wiggle' as string]: '-14deg' }}>
            <AlarmClock size={28} />
          </span>
          <span className="font-display text-[26px] font-bold text-white">Уақыт бітті!</span>
          <span className="text-[22px] text-rose">{NAMES[alert.id] ?? ''}</span>
          <X size={22} className="ml-2 text-snow/50" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
