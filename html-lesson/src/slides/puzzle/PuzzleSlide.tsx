import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleQuestionMark, Lock, MousePointerClick, WandSparkles } from 'lucide-react';
import { puzzleSlide as T } from '../../data/lesson';
import { SlideHeader } from '../../components/ui/SlideHeader';
import { GlowButton } from '../../components/ui/GlowButton';
import { ConfirmButton } from '../../components/ui/ConfirmButton';
import { Burst } from '../../components/animations/Burst';
import { useLessonState } from '../../store/lessonStore';
import { playSound } from '../../lib/sound';
import { cn, hexToRgba } from '../../lib/cn';
import { hintVisuals } from './HintVisuals';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24'];
const TILE_W = 580;
const TILE_H = 250;
const GAP = 28;

export function PuzzleSlide() {
  const [opened, setOpened] = useLessonState<number>('puzzle.opened', 0);
  const [revealed, setRevealed] = useLessonState<boolean>('puzzle.revealed', false);
  const [merging, setMerging] = useState(false);
  const [animateReveal, setAnimateReveal] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const allOpen = opened >= 4;

  const openTile = (i: number) => {
    if (i !== opened || merging) return;
    playSound('flip');
    setOpened(i + 1);
  };

  const reveal = () => {
    setMerging(true);
    playSound('reveal');
    timer.current = window.setTimeout(() => {
      setAnimateReveal(true);
      setRevealed(true);
      setMerging(false);
    }, 1100);
  };

  const restart = () => {
    window.clearTimeout(timer.current);
    setMerging(false);
    setAnimateReveal(false);
    setRevealed(false);
    setOpened(0);
  };

  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} right={<ConfirmButton label={T.restartButton} onConfirm={restart} />} />

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="grid" className="flex flex-1 flex-col items-center" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: merging ? 0 : 1 }} className="mt-2 text-[26px] text-snow/60">
              {T.subtitle}
            </motion.p>

            <div className="relative mt-5 grid grid-cols-2 [perspective:1800px]" style={{ gap: GAP, width: TILE_W * 2 + GAP }}>
              {T.hints.map((hint, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={
                      merging
                        ? {
                            x: (col === 0 ? 1 : -1) * ((TILE_W + GAP) / 2),
                            y: (row === 0 ? 1 : -1) * ((TILE_H + GAP) / 2),
                            scale: 0.35,
                            rotate: [0, (col === 0 ? -1 : 1) * 12, 0],
                            opacity: [1, 1, 0],
                          }
                        : { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }
                    }
                    transition={merging ? { duration: 1.05, ease: [0.65, 0, 0.35, 1] } : { delay: 0.35 + i * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
                    style={{ width: TILE_W, height: TILE_H }}
                  >
                    <Tile index={i} color={COLORS[i]} hint={hint} open={i < opened} isNext={i === opened} onOpen={() => openTile(i)} />
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 flex h-[120px] w-[1188px] items-center justify-center">
              <AnimatePresence mode="wait">
                {allOpen && !merging ? (
                  <motion.div
                    key="q"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
                    className="glass-strong flex w-full items-center gap-6 rounded-[32px] py-4 pl-6 pr-4"
                  >
                    <span className="anim-wiggle grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber/20 text-amber">
                      <CircleQuestionMark size={40} />
                    </span>
                    <span className="flex-1 font-display text-[29px] font-semibold leading-snug text-white">{T.question}</span>
                    <GlowButton size="lg" icon={WandSparkles} onClick={reveal} sound={null}>
                      {T.revealButton}
                    </GlowButton>
                  </motion.div>
                ) : !merging ? (
                  <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4">
                    {COLORS.map((c, i) => (
                      <motion.span
                        key={i}
                        className="h-4 rounded-full"
                        animate={{ width: i < opened ? 64 : 16, backgroundColor: i < opened ? c : 'rgba(255,255,255,0.2)' }}
                        style={{ boxShadow: i < opened ? `0 0 16px ${c}` : 'none' }}
                      />
                    ))}
                    <span className="ml-3 font-mono text-[24px] text-snow/50">{opened} / 4</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <RevealView key="reveal" animate={animateReveal} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Tile({
  index,
  color,
  hint,
  open,
  isNext,
  onOpen,
}: {
  index: number;
  color: string;
  hint: { title: string; caption: string };
  open: boolean;
  isNext: boolean;
  onOpen: () => void;
}) {
  const Visual = hintVisuals[index];
  const locked = !open && !isNext;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={open || locked}
      className={cn('relative h-full w-full text-left', locked && 'cursor-not-allowed')}
      aria-label={`${index + 1}-${T.tileLabel}`}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateX: open ? 180 : 0 }}
        transition={{ duration: 0.9, ease: [0.34, 1.25, 0.64, 1] }}
        whileHover={isNext ? { scale: 1.03 } : undefined}
      >
        {/* Закрытая сторона */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[32px] [backface-visibility:hidden]"
          style={{
            background: 'linear-gradient(150deg, rgba(20,30,80,0.95), rgba(8,12,36,0.95))',
            boxShadow: isNext ? `inset 0 0 0 3px ${color}, 0 0 60px -10px ${color}` : 'inset 0 0 0 2px rgba(255,255,255,0.08)',
            opacity: locked ? 0.55 : 1,
          }}
        >
          {/* «микросхема» */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 580 250" preserveAspectRatio="none">
            <path d="M0 60 H140 L170 90 H300 M580 200 H420 L390 170 H260 M60 262 V200 L90 170 M520 0 V60 L490 90" fill="none" stroke={color} strokeWidth="2" />
            {[
              [140, 60],
              [300, 90],
              [260, 170],
              [90, 170],
              [490, 90],
            ].map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r="5" fill={color} />
            ))}
          </svg>
          {isNext && (
            <div
              className="anim-sheen absolute inset-0"
              style={{ background: `linear-gradient(110deg, transparent 30%, ${hexToRgba(color, 0.18)} 50%, transparent 70%)`, backgroundSize: '250% 100%' }}
            />
          )}
          <div className="relative flex h-full items-center gap-8 px-12">
            <span className="font-display text-[120px] font-black leading-none" style={{ color, textShadow: `0 0 40px ${hexToRgba(color, 0.7)}` }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <div className="font-display text-[36px] font-bold text-white">
                {index + 1}-{T.tileLabel}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[22px] text-snow/60">
                {locked ? <Lock size={22} /> : <MousePointerClick size={24} style={{ color }} />}
                {locked ? T.lockedLabel : T.tapLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Открытая сторона с подсказкой */}
        <div
          className="absolute inset-0 flex items-center gap-7 overflow-hidden rounded-[32px] px-9 [backface-visibility:hidden] [transform:rotateX(180deg)]"
          style={{
            background: `linear-gradient(150deg, ${hexToRgba(color, 0.22)}, rgba(10,16,48,0.92) 60%)`,
            boxShadow: `inset 0 0 0 2px ${hexToRgba(color, 0.65)}, 0 20px 60px -20px ${color}`,
          }}
        >
          <div className="h-[160px] w-[190px] shrink-0">{open && <Visual color={color} />}</div>
          <div className="min-w-0">
            <div className="font-mono text-[20px]" style={{ color }}>
              {index + 1}-{T.tileLabel}
            </div>
            <div className="mt-1 font-display text-[34px] font-bold leading-tight text-white">{hint.title}</div>
            <div className="mt-2 text-[22px] text-snow/65">{hint.caption}</div>
          </div>
        </div>
      </motion.div>
    </button>
  );
}

/** Финальное раскрытие темы: четыре части пазла соединяются в символ таблицы */
function RevealView({ animate }: { animate: boolean }) {
  const d = (s: number) => (animate ? s : 0);
  const SQ = 110;
  const offsets = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  return (
    <motion.div className="relative flex flex-1 flex-col items-center justify-center pb-10" initial={animate ? { opacity: 0 } : false} animate={{ opacity: 1 }}>
      {animate && (
        <>
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[40%] h-[300px] w-[300px] rounded-full border-[6px] border-cyan"
            style={{ x: '-50%', y: '-50%' }}
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut', delay: 0.6 }}
          />
          <div className="pointer-events-none absolute left-1/2 top-[40%]">
            <Burst count={48} radius={700} size={16} />
          </div>
        </>
      )}

      {/* Эмблема: 4 части → таблица */}
      <div className="relative mb-12" style={{ width: SQ * 2, height: SQ * 2 }}>
        {COLORS.map((c, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: SQ,
              height: SQ,
              left: (i % 2) * SQ,
              top: Math.floor(i / 2) * SQ,
              background: c,
              borderRadius: [`28px 0 0 0`, `0 28px 0 0`, `0 0 0 28px`, `0 0 28px 0`][i],
              boxShadow: `0 0 40px ${hexToRgba(c, 0.7)}`,
            }}
            initial={animate ? { x: offsets[i][0] * 160, y: offsets[i][1] * 160, rotate: offsets[i][0] * 45, opacity: 0 } : false}
            animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            transition={{ delay: d(0.1) + i * d(0.08), duration: d(0.8) || 0.01, ease: [0.34, 1.4, 0.64, 1] }}
          />
        ))}
        {/* линии таблицы поверх */}
        <svg className="absolute inset-0" viewBox="0 0 220 220">
          {[110].map((p, k) => (
            <g key={k}>
              <motion.line x1={0} x2={220} y1={p} y2={p} stroke="#070c26" strokeWidth={8} initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ delay: d(1) + k * 0.1, duration: 0.5 }} />
              <motion.line y1={0} y2={220} x1={p} x2={p} stroke="#070c26" strokeWidth={8} initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ delay: d(1.2) + k * 0.1, duration: 0.5 }} />
            </g>
          ))}
        </svg>
      </div>

      <motion.div
        initial={animate ? { opacity: 0, y: 20, letterSpacing: '0.6em' } : false}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
        transition={{ delay: d(1.3), duration: 0.8 }}
        className="font-display text-[28px] font-medium uppercase text-cyan"
      >
        {T.topicLabel}
      </motion.div>
      <motion.h2
        initial={animate ? { opacity: 0, scale: 0.6, filter: 'blur(20px)' } : false}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ delay: d(1.5), duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 text-center font-display text-[120px] font-extrabold leading-none tracking-tight"
      >
        <span
          className="shimmer-text bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg,#67e8f9,#60a5fa,#c4b5fd,#f9a8d4,#fde68a,#67e8f9)', filter: 'drop-shadow(0 0 40px rgba(96,165,250,0.5))' }}
        >
          {T.topic}
        </span>
      </motion.h2>
    </motion.div>
  );
}
