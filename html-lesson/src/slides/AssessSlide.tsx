import { motion } from 'motion/react';
import { Check, Flag, Mountain } from 'lucide-react';
import { assessSlide as T } from '../data/lesson';
import { SlideHeader } from '../components/ui/SlideHeader';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { cn } from '../lib/cn';

const GROUP_COLORS = ['#0284c7', '#7b5cff', '#d63384', '#e07b00'];

/** «Шыңға шығу»: лист самооценки — отмечая задания, ученик «поднимается» к вершине (макс. 10 баллов) */
export function AssessSlide() {
  const rows = T.groups.flatMap((g) => g.rows);
  const [got, setGot] = useLessonState<number[]>('assess.got', rows.map(() => 0));
  const total = got.reduce((s, v) => s + v, 0);
  const k = Math.min(1, total / T.max);
  let idx = -1;

  const toggle = (i: number) => {
    const max = rows[i].points;
    const next = got.map((v, j) => (j === i ? (v >= max ? 0 : v + 1) : v));
    setGot(next);
    playSound(next[i] > got[i] ? (next.reduce((s, v) => s + v, 0) === T.max ? 'success' : 'plus') : 'minus');
  };

  return (
    <div className="flex h-full flex-col px-[90px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} right={<ConfirmButton compact onConfirm={() => setGot(rows.map(() => 0))} />} />
      <p className="mt-2 max-w-[1300px] text-[23px] leading-snug text-snow/75">{T.text}</p>

      <div className="mt-5 grid min-h-0 flex-1 grid-cols-[1fr_560px] gap-10 pb-6">
        <div className="grid min-h-0 grid-cols-2 content-start gap-5" data-no-swipe>
          {T.groups.map((g, gi) => (
            <div key={gi} className="glass rounded-[28px] p-5">
              <div className="mb-3 font-display text-[24px] font-black" style={{ color: GROUP_COLORS[gi] }}>
                {g.title}
              </div>
              <div className="flex flex-col gap-2">
                {g.rows.map((r) => {
                  idx++;
                  const i = idx;
                  const v = got[i] ?? 0;
                  return (
                    <button key={i} type="button" onClick={() => toggle(i)} className={cn('flex items-center gap-3 rounded-2xl border-[3px] px-4 py-2.5 text-left transition-colors', v ? 'border-ink bg-[#e9fbf2]' : 'border-ink/20 bg-white')}>
                      <span className="flex-1 text-[20px] font-semibold leading-tight">{r.task}</span>
                      <span className="flex gap-1">
                        {Array.from({ length: r.points }).map((_, p) => (
                          <span key={p} className={cn('grid h-9 w-9 place-items-center rounded-lg border-[3px] border-ink', p < v ? 'bg-mint text-white' : 'bg-white')}>
                            {p < v && <Check size={20} strokeWidth={3.5} />}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Шың */}
        <div className="glass relative flex flex-col overflow-hidden rounded-[36px] p-7">
          <div className="font-display text-[24px] font-bold">{T.totalLabel}</div>
          <div className="font-display text-[88px] font-black leading-none">
            {total}
            <span className="text-[44px] text-snow/40"> / {T.max}</span>
          </div>
          <div className="relative mt-4 flex-1">
            <svg viewBox="0 0 500 380" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax meet">
              <path d="M10 370 L180 120 L250 190 L330 40 L490 370 Z" fill="#c9f0e4" stroke="#1d1b3a" strokeWidth="5" strokeLinejoin="round" />
              <path d="M300 95 L330 40 L362 100 L340 90 L325 105 Z" fill="#fff" stroke="#1d1b3a" strokeWidth="4" strokeLinejoin="round" />
              <path d="M40 360 Q 200 300 230 230 T 330 50" fill="none" stroke="#1d1b3a" strokeWidth="4" strokeDasharray="10 10" opacity=".35" />
            </svg>
            <motion.div className="absolute" animate={{ left: `${8 + k * 58}%`, bottom: `${4 + k * 80}%` }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
              <div className="grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-electric text-white shadow-[4px_4px_0_rgb(var(--c-ink))]">
                {total >= T.max ? <Flag size={34} /> : <Mountain size={32} />}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
