import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { slides } from '../../config/slides';
import { lessonStore, useLesson } from '../../store/lessonStore';
import { IconButton } from '../ui/GlowButton';
import { useNav } from './NavContext';

export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function TopBar({ onOpenPanel }: { onOpenPanel: () => void }) {
  const { index } = useNav();
  const sound = useLesson((s) => s.sound);
  const [fs, setFs] = useState(!!document.fullscreenElement);
  const slide = slides[index];

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-[80px] items-center gap-6 px-10">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border-[3px] border-ink bg-rose font-mono text-[20px] font-bold text-white shadow-[3px_3px_0_rgb(var(--c-ink))]">
          &lt;/&gt;
        </div>
        <div className="leading-tight">
          <div className="font-display text-[20px] font-semibold text-snow">Информатика</div>
          <div className="text-[16px] text-snow/50">Ашық сабақ</div>
        </div>
      </div>

      <div className="relative flex h-full flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {!slide.bare && (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 rounded-full border-[3px] border-ink bg-[rgb(var(--c-sun))] px-5 py-1.5 font-display text-[19px] font-semibold text-snow shadow-[3px_3px_0_rgb(var(--c-ink))]"
            >
              <span className="font-mono text-electric">{String(index + 1).padStart(2, '0')}</span>
              <span className="h-4 w-[2px] bg-ink/40" />
              {slide.title}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <IconButton
          icon={sound ? Volume2 : VolumeX}
          label={sound ? 'Дыбыс эффектілерін өшіру (M)' : 'Дыбыс эффектілерін қосу (M)'}
          active={sound}
          onClick={() => lessonStore.update((s) => ({ sound: !s.sound }))}
        />
        <IconButton icon={LayoutGrid} label="Мұғалім панелі (T)" onClick={onOpenPanel} />
        <IconButton icon={fs ? Minimize : Maximize} label="Толық экран (F)" onClick={toggleFullscreen} />
      </div>
    </div>
  );
}
