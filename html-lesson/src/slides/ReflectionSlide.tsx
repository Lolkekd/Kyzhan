import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { reflectionSlide as T } from '../data/lesson';
import { SlideHeader } from '../components/ui/SlideHeader';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { hexToRgba } from '../lib/cn';

/**
 * Рефлексия «Бағдаршам». Нажатие на сигнал лишь подсвечивает его и показывает тёплый отклик —
 * это не подсчёт голосов и не имитация ответов всего класса.
 */
export function ReflectionSlide() {
  const [selected, setSelected] = useLessonState<string | null>('reflection.light', null);
  const [question, setQuestion] = useLessonState<number | null>('reflection.question', null);
  const current = T.lights.find((l) => l.id === selected) ?? null;

  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        right={
          <div className="chip">
            <Sparkles size={22} className="text-amber" /> {T.method}
          </div>
        }
      />

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[400px_1fr] gap-14 pb-6">
        {/* Светофор */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 140, damping: 18 }}
          className="relative mx-auto flex h-full w-[300px] flex-col items-center justify-around rounded-[70px] border border-white/10 bg-gradient-to-b from-[#141c44] to-[#0a0f2c] py-8 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),inset_0_2px_0_rgba(255,255,255,0.08)]"
        >
          {T.lights.map((l, i) => {
            const on = selected === l.id;
            const dim = selected !== null && !on;
            return (
              <motion.button
                key={l.id}
                type="button"
                aria-label={l.label}
                onClick={() => {
                  playSound(on ? 'click' : 'bell');
                  setSelected(on ? null : l.id);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                className="relative grid h-[190px] w-[190px] place-items-center rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: on ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: selected === null ? 0.5 + i * 0.15 : 0 }}
              >
                {on && (
                  <>
                    <span className="animate-pulse-ring absolute inset-0 rounded-full border-4" style={{ borderColor: l.color }} />
                    <span className="animate-pulse-ring absolute inset-0 rounded-full border-4" style={{ borderColor: l.color, animationDelay: '1.2s' }} />
                  </>
                )}
                <motion.span
                  className="absolute inset-0 rounded-full"
                  animate={{
                    opacity: dim ? 0.25 : 1,
                    boxShadow: on ? `0 0 90px 20px ${hexToRgba(l.color, 0.75)}, inset 0 -12px 30px rgba(0,0,0,0.25)` : `0 0 30px ${hexToRgba(l.color, 0.35)}, inset 0 -12px 30px rgba(0,0,0,0.35)`,
                  }}
                  style={{ background: `radial-gradient(circle at 35% 30%, #ffffffcc, ${l.color} 30%, ${hexToRgba(l.color, 0.85)} 70%)` }}
                />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Подписи + отклик + вопросы */}
        <div className="flex min-h-0 flex-col gap-6">
          <div className="flex flex-col gap-4">
            {T.lights.map((l, i) => {
              const on = selected === l.id;
              return (
                <motion.button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    playSound(on ? 'click' : 'bell');
                    setSelected(on ? null : l.id);
                  }}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: selected && !on ? 0.45 : 1, x: 0 }}
                  transition={{ delay: selected === null ? 0.5 + i * 0.12 : 0 }}
                  className="glass flex items-center gap-5 rounded-[28px] px-7 py-5 text-left"
                  style={{ boxShadow: on ? `0 0 0 3px ${l.color}, 0 20px 60px -20px ${l.color}` : '0 20px 60px -20px rgba(0,0,0,0.6)', backgroundColor: on ? hexToRgba(l.color, 0.14) : 'rgba(255,255,255,0.055)' }}
                >
                  <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: l.color, boxShadow: `0 0 20px ${l.color}` }} />
                  <span className="font-display text-[34px] font-semibold">{l.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="relative h-[96px]">
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex h-full items-center gap-4 rounded-[28px] px-7 font-display text-[30px] font-semibold"
                  style={{ color: current.color, background: hexToRgba(current.color, 0.1) }}
                >
                  <Sparkles size={34} /> {current.reply}
                </motion.div>
              )}
              {!current && (
                <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full items-center px-2 text-[24px] text-snow/50">
                  {T.hint}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-5">
            {T.questions.map((q, i) => {
              const on = question === i;
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setQuestion(on ? null : i);
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0, scale: on ? 1.04 : 1 }}
                  transition={{ delay: question === null ? 0.8 + i * 0.1 : 0 }}
                  className="glass flex h-[150px] flex-col justify-between rounded-[28px] p-6 text-left"
                  style={{ boxShadow: on ? '0 0 0 3px rgb(var(--c-cyan)), 0 20px 50px -20px rgb(var(--c-cyan))' : '0 20px 60px -20px rgba(0,0,0,0.6)' }}
                >
                  <MessageCircle size={30} className="text-cyan" />
                  <span className="font-display text-[28px] font-semibold leading-tight">{q}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
