import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { titleSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { useNav } from '../components/layout/NavContext';
import { GlowButton } from '../components/ui/GlowButton';
import { FloatingTokens } from '../components/animations/FloatingTokens';
import { CodeBlock } from '../components/code/CodeBlock';
import { EditorFrame } from '../components/code/Frames';

// Нейтральный код: тема урока здесь не раскрывается
const CODE = [
  { text: '<!DOCTYPE html>', indent: 0 },
  { text: '<html lang="kk">', indent: 0 },
  { text: '<body>', indent: 1 },
  { text: '<h1>Сәлем, әлем!</h1>', indent: 2 },
  { text: '<p>Бүгін біз жаңа</p>', indent: 2 },
  { text: '<p>құпияны ашамыз…</p>', indent: 2 },
  { text: '</body>', indent: 1 },
  { text: '</html>', indent: 0 },
];

export function TitleSlide() {
  const { next } = useNav();
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (typed >= CODE.length) return;
    const t = window.setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 900 : 420);
    return () => window.clearTimeout(t);
  }, [typed]);

  const letters = T.subject.split('');

  return (
    <div className="relative h-full w-full">
      <FloatingTokens count={10} opacity={0.16} className="inset-y-0 left-[52%] right-0" />

      <div className="relative grid h-full grid-cols-[1.1fr_1fr] items-center gap-10 px-[110px]">
        {/* Левая колонка: заголовок */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="chip mb-10 border-cyan/30 bg-cyan/10 text-cyan"
          >
            <Sparkles size={22} />
            {T.format}
          </motion.div>

          <h1 className="font-display text-[124px] font-extrabold leading-[0.95] tracking-[-0.03em]">
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                className="text-gradient shimmer-text inline-block"
                style={{ backgroundImage: 'linear-gradient(90deg,#67e8f9,#60a5fa,#a78bfa,#f0abfc,#67e8f9)' }}
                initial={{ opacity: 0, y: 80, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-6 flex items-center gap-6"
          >
            <span className="h-[4px] w-24 rounded-full bg-gradient-to-r from-cyan to-violet" />
            <span className="font-display text-[64px] font-semibold text-white">{T.format}</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-6 text-[40px] font-light text-snow/75"
          >
            {T.tagline}
          </motion.p>

          {(settings.teacherName || settings.schoolName) && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-4 text-[24px] text-snow/50">
              {[settings.teacherName, settings.schoolName].filter(Boolean).join(' · ')}
            </motion.p>
          )}

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, type: 'spring' }} className="relative mt-16 inline-block">
            <span className="anim-glow absolute -inset-4 rounded-[44px] bg-gradient-to-r from-cyan/50 to-violet/60 blur-2xl" />
            <GlowButton size="xl" iconRight={ArrowRight} sound="success" onClick={next}>
              {T.startButton}
            </GlowButton>
          </motion.div>
        </div>

        {/* Правая колонка: «живой» редактор кода с орбитами */}
        <div className="relative flex h-full items-center justify-center">
          <div className="absolute h-[720px] w-[720px] rounded-full border border-white/[0.07]" />
          <div className="animate-spin-slow absolute h-[720px] w-[720px]">
            {['<h1>', '{ }', '</>', '<p>'].map((t, i) => (
              <span
                key={t}
                className="absolute"
                style={{
                  left: `${50 + 50 * Math.cos((i * Math.PI) / 2)}%`,
                  top: `${50 + 50 * Math.sin((i * Math.PI) / 2)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span
                  className="block rounded-xl border border-white/15 bg-navy px-3 py-1.5 font-mono text-[22px] text-cyan shadow-[0_0_24px_-4px_rgb(var(--c-cyan))]"
                  style={{ animation: 'spin-slow 40s linear infinite reverse' }}
                >
                  {t}
                </span>
              </span>
            ))}
          </div>
          <div className="absolute h-[540px] w-[540px] rounded-full border border-dashed border-violet/20" />

          <div className="anim-float relative" style={{ ['--float' as string]: '-14px', ['--dur' as string]: '6s' }}>
            <motion.div
              initial={{ opacity: 0, rotateY: -35, rotateX: 15, z: -200 }}
              animate={{ opacity: 1, rotateY: -14, rotateX: 6, z: 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
              style={{ transformPerspective: 1400 }}
              className="relative w-[640px]"
            >
              <EditorFrame className="h-[440px]">
                <CodeBlock lines={CODE} fontSize={25} isVisible={(_, i) => i < typed} />
                {typed < CODE.length && <span className="animate-caret ml-[2.6em] inline-block h-8 w-[3px] translate-y-1 bg-cyan" />}
              </EditorFrame>
              <div className="absolute -bottom-10 left-1/2 h-20 w-[80%] -translate-x-1/2 rounded-full bg-electric/30 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
