import { AnimatePresence, motion } from 'motion/react';
import { Check, Eye, ExternalLink, PartyPopper, ScanLine } from 'lucide-react';
import { plickersSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { Burst } from '../components/animations/Burst';
import { useLesson, useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { cn } from '../lib/cn';

export function PlickersSlide() {
  const n = T.questionsCount;
  const [done, setDone] = useLessonState<boolean[]>('plickers.done', Array(n).fill(false));
  const url = useLesson((s) => s.plickersUrl) || settings.plickersUrl;
  const count = done.filter(Boolean).length;
  const complete = count === n;

  const [cur, setCur] = useLessonState<number | null>('plickers.q', null);
  const [ans, setAns] = useLessonState<boolean>('plickers.ans', false);
  const toggle = (i: number) => {
    setCur(i);
    setAns(false);
    const next = done.map((v, k) => (k === i ? !v : v));
    setDone(next);
    if (next.every(Boolean)) playSound('success');
    else playSound(next[i] ? 'plus' : 'minus');
  };

  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        right={
          <div className="flex items-center gap-3">
            <GlowButton icon={ScanLine} iconRight={ExternalLink} size="lg" onClick={() => window.open(url, '_blank', 'noopener')}>
              {T.openButton}
            </GlowButton>
            <ConfirmButton compact onConfirm={() => setDone(Array(n).fill(false))} />
          </div>
        }
      />

      <div className="mt-10 grid min-h-0 flex-1 grid-cols-[560px_1fr] gap-14 pb-8">
        {/* Как работает Plickers */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass flex flex-col rounded-[36px] p-9">
          <div className="text-[26px] text-snow/75">{T.subtitle}</div>
          <div className="flex flex-1 items-center justify-center py-6">
            <PlickersCard />
          </div>
          <ol className="space-y-3">
            {T.steps.map((s, i) => (
              <li key={i} className="flex items-center gap-4 text-[24px] text-snow/90">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/15 font-display font-bold text-cyan">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Индикаторы вопросов */}
        <div className="relative flex flex-col justify-center">
          <div className="relative flex items-start justify-between px-6">
            <div className="absolute left-[95px] right-[95px] top-[75px] h-2 rounded-full bg-white/10" />
            <motion.div
              className="absolute left-[95px] top-[75px] h-2 rounded-full bg-gradient-to-r from-cyan via-electric to-mint"
              animate={{ width: `calc((100% - 190px) * ${count / n})` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{ boxShadow: '0 0 20px rgb(var(--c-cyan))' }}
            />
            {done.map((d, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.92 }}
                className="relative z-10 flex w-[150px] flex-col items-center"
              >
                <motion.span
                  animate={{
                    backgroundColor: d ? '#12a06a' : '#ffffff',
                    borderColor: d ? '#12a06a' : 'rgba(29,27,58,0.25)',
                    boxShadow: d ? '0 0 50px rgba(52,211,153,0.7)' : '0 0 0 rgba(0,0,0,0)',
                  }}
                  className="relative grid h-[150px] w-[150px] place-items-center rounded-full border-4"
                >
                  <AnimatePresence mode="wait">
                    {d ? (
                      <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                        <Check size={76} strokeWidth={3} className="text-ink" />
                      </motion.span>
                    ) : (
                      <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="font-display text-[64px] font-bold text-snow">
                        {i + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
                <span className="mt-4 font-display text-[26px] font-semibold text-snow">
                  {i + 1}-{T.questionLabel}
                </span>
                <span className={cn('mt-1 text-[20px]', d ? 'text-mint' : 'text-snow/40')}>{d ? T.doneLabel : T.pendingLabel}</span>
              </motion.button>
            ))}
          </div>

          {/* Текущий вопрос и ответ (по нажатию) */}
          <div className="mt-6 h-[200px]">
            <AnimatePresence mode="wait">
              {cur !== null && T.questions[cur] && (
                <motion.div key={cur} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass flex h-full flex-col rounded-[30px] px-8 py-5">
                  <div className="font-display text-[20px] font-bold uppercase tracking-[0.14em] text-rose">
                    {cur + 1}-{T.questionLabel}
                  </div>
                  <div className="mt-1 font-display text-[34px] font-bold leading-tight">{T.questions[cur].q}</div>
                  <div className="mt-auto flex items-end gap-4">
                    {ans ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-mint/15 px-5 py-2 text-[24px] font-semibold leading-snug text-[#0b6b47]">
                        {T.answerLabel}: {T.questions[cur].a}
                      </motion.div>
                    ) : (
                      <button type="button" onClick={() => { playSound('reveal'); setAns(true); }} className="btn-candy flex h-12 items-center gap-2 rounded-2xl bg-mint px-5 font-display text-[20px] font-bold text-white">
                        <Eye size={22} /> {T.answerLabel}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex h-[150px] items-center justify-center">
            <AnimatePresence mode="wait">
              {complete ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.6, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                  className="relative flex items-center gap-7 rounded-[36px] border border-mint/40 bg-mint/10 px-12 py-8"
                  style={{ boxShadow: '0 0 80px -20px rgb(var(--c-mint))' }}
                >
                  <Burst count={40} radius={460} />
                  <PartyPopper size={72} className="text-mint" />
                  <div>
                    <div className="font-display text-[46px] font-bold text-snow">{T.completeTitle}</div>
                    <div className="text-[26px] text-mint">{T.completeText}</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <div className="font-display text-[64px] font-bold leading-none">
                    <span className="text-gradient">{count}</span>
                    <span className="text-snow/30"> / {n}</span>
                  </div>
                  <div className="mt-3 text-[22px] text-snow/45">{T.markHint}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Стилизованная карточка в духе Plickers (без реального кода)
const PATTERN = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1],
];

function PlickersCard() {
  return (
    <div className="relative h-[250px] w-[250px]">
      <div className="anim-card-turn absolute inset-0 rounded-[26px] bg-white p-9 shadow-[0_20px_60px_-10px_rgba(34,211,238,0.6)]">
        <div className="grid h-full w-full grid-cols-5 grid-rows-5">
          {PATTERN.flat().map((v, i) => (
            <span key={i} className={v ? 'bg-ink' : ''} />
          ))}
        </div>
        {['A', 'B', 'C', 'D'].map((l, i) => (
          <span
            key={l}
            className="absolute font-display text-[22px] font-bold text-slate-400"
            style={{
              top: i === 0 ? 6 : i === 2 ? 'auto' : '50%',
              bottom: i === 2 ? 6 : 'auto',
              left: i === 3 ? 10 : i === 1 ? 'auto' : '50%',
              right: i === 1 ? 10 : 'auto',
              transform: `translate(${i === 0 || i === 2 ? '-50%' : '0'}, ${i === 1 || i === 3 ? '-50%' : '0'}) rotate(${[0, 90, 180, 270][i]}deg)`,
            }}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-cyan px-3 py-0.5 font-display text-[18px] font-bold text-ink">▲</div>
    </div>
  );
}
