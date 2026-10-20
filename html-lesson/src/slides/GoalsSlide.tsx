import { AnimatePresence, motion } from 'motion/react';
import { BookOpenCheck, Code2, Flag, Target, Table2 } from 'lucide-react';
import { goalsSlide as T } from '../data/lesson';
import { SlideHeader } from '../components/ui/SlideHeader';
import { RichText } from '../components/ui/RichText';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { hexToRgba } from '../lib/cn';

const GOAL_ICONS = [Table2, Code2, BookOpenCheck];
const GOAL_COLORS = ['#0891a2', '#7b5cff', '#e0438c'];

// Координаты станций дорожной карты (в пикселях области 1060×700)
const MAP_W = 1060;
const MAP_H = 700;
const STATIONS = [
  { x: 130, y: 350 },
  { x: 400, y: 350 },
  { x: 670, y: 350 },
  { x: 940, y: 350 },
];
const PATH = 'M 130 350 C 220 440, 310 440, 400 350 C 490 260, 580 260, 670 350 C 760 440, 850 440, 940 350';

export function GoalsSlide() {
  const [open, setOpen] = useLessonState<number | null>('goals.open', null);

  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} />

      <div className="mt-8 grid min-h-0 flex-1 grid-cols-[600px_1fr] gap-12 pb-6">
        {/* Цели */}
        <div className="flex flex-col">
          <div className="mb-5 flex items-center gap-3 font-display text-[30px] font-semibold text-snow">
            <Target className="text-cyan" size={34} /> {T.goalsTitle}
          </div>
          <div className="flex flex-1 flex-col gap-5">
            {T.goals.map((g, i) => {
              const Icon = GOAL_ICONS[i % GOAL_ICONS.length];
              const c = GOAL_COLORS[i % GOAL_COLORS.length];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -60, rotateY: 25 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ delay: 0.35 + i * 0.15, type: 'spring', stiffness: 160, damping: 20 }}
                  className="glass relative flex flex-1 items-center gap-6 overflow-hidden rounded-[30px] px-7"
                >
                  <div className="absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${hexToRgba(c, 0.35)}, transparent 70%)` }} />
                  <div className="relative grid h-[84px] w-[84px] shrink-0 place-items-center rounded-[24px]" style={{ background: hexToRgba(c, 0.18), boxShadow: `inset 0 0 0 2px ${hexToRgba(c, 0.5)}` }}>
                    <Icon size={44} style={{ color: c }} />
                  </div>
                  <div className="relative font-display text-[29px] font-medium leading-snug text-snow">{g}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Дорожная карта */}
        <div className="flex min-h-0 flex-col">
          <div className="mb-1 flex items-center gap-3 font-display text-[30px] font-semibold text-snow">
            <Flag className="text-magenta" size={32} /> {T.planTitle}
          </div>
          <div className="relative flex-1">
            <div className="absolute left-0 top-1/2 -translate-y-1/2" style={{ width: MAP_W, height: MAP_H }}>
              <svg className="absolute inset-0" viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
                <defs>
                  <linearGradient id="road" x1="0" x2="1">
                    {T.plan.map((p, i) => (
                      <stop key={i} offset={i / (T.plan.length - 1)} stopColor={p.color} />
                    ))}
                  </linearGradient>
                </defs>
                <path d={PATH} fill="none" stroke="rgba(29,27,58,0.1)" strokeWidth={22} strokeLinecap="round" />
                <motion.path
                  d={PATH}
                  fill="none"
                  stroke="url(#road)"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray="1 0"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 1.8, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 0 10px rgba(129,140,248,0.8))' }}
                />
              </svg>

              {T.plan.map((p, i) => {
                const s = STATIONS[i];
                const above = i % 2 === 0;
                const isOpen = open === i;
                return (
                  <div key={i}>
                    <motion.span
                      className="absolute grid h-16 w-16 place-items-center rounded-full font-display text-[28px] font-bold text-ink"
                      style={{ left: s.x, top: s.y, x: '-50%', y: '-50%', background: p.color, boxShadow: `0 0 0 8px ${hexToRgba(p.color, 0.2)}, 0 0 40px ${p.color}` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.35, type: 'spring', stiffness: 300, damping: 14 }}
                    >
                      {i + 1}
                    </motion.span>
                    <div
                      className="absolute w-[300px] -translate-x-1/2"
                      style={{ left: s.x, ...(above ? { bottom: MAP_H - s.y + 60 } : { top: s.y + 60 }) }}
                    >
                    <motion.button
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        setOpen(isOpen ? null : i);
                      }}
                      initial={{ opacity: 0, y: above ? 30 : -30 }}
                      animate={{ opacity: 1, y: 0, scale: isOpen ? 1.04 : 1 }}
                      transition={{ delay: open === null ? 0.9 + i * 0.35 : 0, type: 'spring', stiffness: 220, damping: 22 }}
                      className="glass w-full rounded-[26px] p-5 text-left"
                      style={{
                        boxShadow: isOpen ? `0 0 0 3px ${p.color}, 0 20px 60px -20px ${p.color}` : '0 20px 60px -20px rgba(0,0,0,0.6)',
                      }}
                    >
                      <div className="font-display text-[30px] font-bold" style={{ color: p.color }}>
                        {p.title}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.items.map((it) => (
                          <span key={it} className="rounded-xl bg-white/[0.08] px-3 py-1 text-[20px] text-snow/90">
                            <RichText text={it} codeClassName="bg-transparent px-0 mx-0" />
                          </span>
                        ))}
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="pt-3 text-[20px] leading-snug text-snow/70">{p.note}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
