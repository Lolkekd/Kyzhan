import { motion } from 'motion/react';
import { Minus, Pause, Play, Plus, RotateCcw, TimerReset } from 'lucide-react';
import { cn, formatTime } from '../../lib/cn';
import { playSound } from '../../lib/sound';
import { useTimer } from './useTimer';

const PRESETS = [3, 5, 7, 10, 15];

/** Настраиваемый таймер задания: старт/пауза, сброс, ±1 минута, быстрые пресеты */
export function Timer({ id, minutes, className, showPresets = true }: { id: string; minutes: number; className?: string; showPresets?: boolean }) {
  const t = useTimer(id, minutes);
  const R = 48;
  const C = 2 * Math.PI * R;
  const color = t.finished ? '#fb7185' : t.progress < 0.2 && t.running ? '#fbbf24' : '#22d3ee';
  const idle = !t.running && !t.finished && t.remaining === t.duration;

  const btn = 'grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-snow/80 transition hover:bg-white/[0.14] active:scale-90';

  return (
    <div className={cn('glass flex items-center gap-5 rounded-[28px] py-3 pl-3 pr-5', className)} data-no-swipe>
      <div className="relative h-[116px] w-[116px] shrink-0">
        {t.finished && <span className="animate-pulse-ring absolute inset-2 rounded-full border-4 border-rose/70" />}
        <svg viewBox="0 0 116 116" className="h-full w-full -rotate-90">
          <circle cx="58" cy="58" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
          <motion.circle
            cx="58"
            cy="58"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - t.progress), stroke: color }}
            transition={{ duration: 0.3, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[30px] font-semibold tabular-nums tracking-tight" style={{ color: t.finished ? '#fb7185' : 'white' }}>
            {formatTime(Math.ceil(t.remaining))}
          </span>
          <span className="font-display text-[13px] uppercase tracking-[0.14em] text-snow/50">
            {t.finished ? 'бітті' : t.running ? '' : idle ? 'таймер' : 'кідіріс'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound('click');
              if (t.running) t.pause();
              else t.start();
            }}
            className={cn(
              'flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-2xl px-5 font-display text-[21px] font-semibold text-white',
              t.running ? 'bg-white/15' : 'bg-gradient-to-r from-electric to-violet shadow-[0_8px_30px_-8px_rgb(var(--c-electric)/0.8)]',
            )}
          >
            {t.running ? <Pause size={24} /> : <Play size={24} />}
            {t.running ? 'Кідірту' : t.finished ? 'Қайта' : idle ? 'Бастау' : 'Жалғастыру'}
          </motion.button>
          <button type="button" className={btn} title="−1 минут" onClick={() => { playSound('click'); t.adjust(-60); }}>
            <Minus size={22} />
          </button>
          <button type="button" className={btn} title="+1 минут" onClick={() => { playSound('click'); t.adjust(60); }}>
            <Plus size={22} />
          </button>
          <button type="button" className={btn} title="Қайта бастау" onClick={() => { playSound('click'); t.reset(); }}>
            <RotateCcw size={22} />
          </button>
        </div>
        {showPresets && (
          <div className={cn('flex items-center gap-1.5 transition-opacity', t.running && 'pointer-events-none opacity-30')}>
            <TimerReset size={18} className="mr-1 text-snow/40" />
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { playSound('click'); t.setMinutes(m); }}
                className={cn(
                  'h-9 min-w-9 rounded-lg px-2 font-mono text-[17px] transition',
                  t.duration === m * 60 ? 'bg-cyan/25 text-cyan' : 'bg-white/[0.05] text-snow/55 hover:bg-white/[0.12]',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
