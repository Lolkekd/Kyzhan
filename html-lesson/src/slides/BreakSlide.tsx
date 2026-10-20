import { motion } from 'motion/react';
import { Hand, PersonStanding, RefreshCcw, Wind } from 'lucide-react';
import { breakSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { playSound } from '../lib/sound';
import { useLessonState } from '../store/lessonStore';

const SHAPES = [
  { c: '#fbbf24', x: 6, y: 18, s: 90, r: '50%', d: 7 },
  { c: '#f472b6', x: 88, y: 12, s: 70, r: '22px', d: 9 },
  { c: '#34d399', x: 92, y: 70, s: 110, r: '50%', d: 8 },
  { c: '#22d3ee', x: 3, y: 74, s: 64, r: '18px', d: 10 },
  { c: '#a78bfa', x: 48, y: 90, s: 50, r: '50%', d: 6 },
  { c: '#fb923c', x: 70, y: 4, s: 46, r: '14px', d: 11 },
];
const MOVE_ICONS = [Hand, RefreshCcw, Wind];
const MOVE_COLORS = ['#fbbf24', '#f472b6', '#34d399'];

export function BreakSlide() {
  const [active, setActive] = useLessonState<number | null>('break.move', null);

  return (
    <div className="relative flex h-full flex-col overflow-hidden px-[100px] pt-4">
      {/* мягкие плавающие фигуры — без мигания */}
      {SHAPES.map((sh, i) => (
        <span
          key={i}
          className="anim-float-rot pointer-events-none absolute opacity-70"
          style={{
            left: `${sh.x}%`,
            top: `${sh.y}%`,
            width: sh.s,
            height: sh.s,
            borderRadius: sh.r,
            background: `linear-gradient(135deg, ${sh.c}, ${sh.c}55)`,
            boxShadow: `0 10px 40px -10px ${sh.c}`,
            ['--dur' as string]: `${sh.d}s`,
          }}
        />
      ))}

      <div className="relative text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow text-amber/90">
          {T.eyebrow}
        </motion.div>
        <h1 className="mt-1 font-display text-[84px] font-extrabold leading-none">
          {T.title.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: -80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 260, damping: 16 }}
            >
              <span
                className="anim-letter inline-block"
                style={{ color: ['#fbbf24', '#f472b6', '#34d399', '#22d3ee', '#a78bfa'][i % 5], ['--delay' as string]: `${1 + i * 0.08}s` }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            </motion.span>
          ))}
        </h1>
        <p className="mt-3 text-[28px] text-snow/70">{T.subtitle}</p>
      </div>

      <div className="relative mt-7 flex flex-1 items-start justify-center gap-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="w-[1060px]">
          <VideoPlayer src={settings.videos.break} title={T.title} accent="#fbbf24" />
        </motion.div>

        {T.moves.length > 0 && (
          <div className="flex w-[480px] flex-col gap-5">
            {T.moves.map((m, i) => {
              const Icon = MOVE_ICONS[i % MOVE_ICONS.length] ?? PersonStanding;
              const c = MOVE_COLORS[i % MOVE_COLORS.length];
              const on = active === i;
              return (
                <motion.button
                  key={i}
                  type="button"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0, scale: on ? 1.05 : 1 }}
                  transition={{ delay: active === null ? 0.5 + i * 0.12 : 0, type: 'spring', stiffness: 260, damping: 18 }}
                  onClick={() => {
                    playSound('pop');
                    setActive(on ? null : i);
                  }}
                  className="glass flex h-[150px] items-center gap-6 rounded-[32px] px-7 text-left"
                  style={{ boxShadow: on ? `0 0 0 3px ${c}, 0 20px 60px -20px ${c}` : '0 20px 60px -20px rgba(0,0,0,0.6)' }}
                >
                  <span
                    className={`grid h-20 w-20 shrink-0 place-items-center rounded-[22px] ${on ? 'anim-wiggle' : ''}`}
                    style={{ background: c, ['--dur' as string]: '1.2s', ['--wiggle' as string]: '-12deg' }}
                  >
                    <Icon size={44} className="text-ink" />
                  </span>
                  <span className="font-display text-[30px] font-semibold leading-tight">{m}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
