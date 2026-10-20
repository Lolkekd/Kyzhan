import { useState } from 'react';
import { motion } from 'motion/react';
import { CircleCheck, Eye, Monitor, UserRound } from 'lucide-react';
import { individualSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { Modal } from '../components/ui/Modal';
import { RichText } from '../components/ui/RichText';
import { Timer } from '../components/timer/Timer';
import { CriteriaList } from '../components/tasks/CriteriaList';
import { SolutionView } from '../components/tasks/SolutionView';
import { BrowserFrame } from '../components/code/Frames';
import { HtmlTablePreview } from '../components/code/HtmlTablePreview';

export function IndividualSlide() {
  const [answer, setAnswer] = useState(false);

  return (
    <div className="relative flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} right={<Timer id="individual" minutes={settings.timers.individual} />} />

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[560px_1fr_470px] gap-8 pb-6">
        {/* Карточка задания */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 160, damping: 20 }}
          className="glass relative flex flex-col overflow-hidden rounded-[36px] p-9"
        >
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan/15 text-cyan">
              <UserRound size={36} />
            </span>
            <span className="font-display text-[24px] font-semibold uppercase tracking-[0.18em] text-cyan">Тапсырма</span>
          </div>
          <p className="relative mt-6 font-display text-[32px] font-semibold leading-snug text-snow">{T.task}</p>
          <ul className="relative mt-auto space-y-3">
            {T.requirements.map((r, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-3 text-[24px] leading-snug text-snow/90">
                <CircleCheck size={28} className="mt-0.5 shrink-0 text-mint" />
                <RichText text={r} />
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Ожидаемый результат */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex min-h-0 flex-col">
          <div className="mb-4 flex items-center gap-3 font-display text-[26px] font-semibold">
            <Monitor size={30} className="text-electric" /> {T.expectedLabel}
          </div>
          <BrowserFrame className="min-h-0 flex-1">
            <div className="flex h-full items-center justify-center p-6">
              <HtmlTablePreview data={T.solution} fontSize={24} />
            </div>
          </BrowserFrame>
        </motion.div>

        {/* Критерии + ответ */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex flex-col">
          <CriteriaList criteria={T.criteria} title={T.criteriaTitle} />
          <GlowButton className="mt-auto w-full" size="lg" variant="success" icon={Eye} onClick={() => setAnswer(true)}>
            {T.showAnswer}
          </GlowButton>
        </motion.div>
      </div>

      <Modal open={answer} onClose={() => setAnswer(false)} title={T.answerTitle} width={1600}>
        <SolutionView data={T.solution} />
      </Modal>
    </div>
  );
}
