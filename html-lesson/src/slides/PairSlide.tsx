import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, CircleCheck, Combine, Eye, Plus, Split, UserRound } from 'lucide-react';
import { pairSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { Modal } from '../components/ui/Modal';
import { Segmented } from '../components/ui/Segmented';
import { RichText } from '../components/ui/RichText';
import { Timer } from '../components/timer/Timer';
import { CriteriaList } from '../components/tasks/CriteriaList';
import { SolutionView } from '../components/tasks/SolutionView';
import { useLessonState } from '../store/lessonStore';

type Tab = 'steps' | 'conditions' | 'criteria';
const A = '#0891a2';
const B = '#c026d3';

export function PairSlide() {
  const [tab, setTab] = useLessonState<Tab>('pair.tab', 'steps');
  const [merged, setMerged] = useLessonState<boolean>('pair.merged', false);
  const [answer, setAnswer] = useState(false);

  return (
    <div className="relative flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} right={<Timer id="pair" minutes={settings.timers.pair} />} />

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[1fr_640px] gap-10 pb-6">
        {/* Левая часть: задание и анимация двух рабочих зон */}
        <div className="flex min-h-0 flex-col">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-magenta text-ink">
              <CalendarDays size={36} />
            </span>
            <div>
              <div className="font-display text-[36px] font-bold leading-tight">«{T.task}»</div>
              <div className="text-[24px] text-snow/70">{T.taskText}</div>
            </div>
          </motion.div>

          <div className="relative mt-6 flex min-h-0 flex-1 items-center justify-center">
            <AnimatePresence mode="wait">
              {!merged ? (
                <motion.div key="split" className="flex w-full items-stretch justify-between gap-6" exit={{ opacity: 1 }}>
                  <Zone side="left" color={A} role={T.roles[0]}>
                    <SkeletonTable />
                  </Zone>
                  <motion.div
                    className="flex flex-col items-center justify-center"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <span className="relative grid h-16 w-16 place-items-center">
                      <span className="anim-spin absolute inset-0 rounded-full border-2 border-dashed border-white/30" />
                      <Plus size={30} />
                    </span>
                  </motion.div>
                  <Zone side="right" color={B} role={T.roles[1]}>
                    <DataChips />
                  </Zone>
                </motion.div>
              ) : (
                <motion.div
                  key="merged"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  className="relative w-[760px] rounded-[36px] p-[3px]"
                  style={{ background: `linear-gradient(120deg, ${A}, ${B})`, boxShadow: `0 0 80px -20px ${B}` }}
                >
                  <div className="rounded-[33px] bg-white p-8">
                    <div className="mb-5 flex items-center gap-4">
                      <Avatar color={A} label="1" />
                      <Avatar color={B} label="2" className="-ml-7" />
                      <span className="font-display text-[28px] font-bold">{T.together}</span>
                    </div>
                    <MiniTable filled />
                  </div>
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 12 }}
                    className="absolute -right-6 -top-6 grid h-20 w-20 place-items-center rounded-full bg-mint text-ink shadow-[0_0_40px_rgb(var(--c-mint))]"
                  >
                    <CircleCheck size={46} />
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-center">
            <GlowButton
              size="lg"
              variant={merged ? 'glass' : 'primary'}
              icon={merged ? Split : Combine}
              sound={merged ? 'click' : 'success'}
              onClick={() => setMerged(!merged)}
            >
              {merged ? T.splitButton : T.mergeButton}
            </GlowButton>
          </div>
        </div>

        {/* Правая часть: вкладки */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass flex min-h-0 flex-col rounded-[36px] p-7">
          <Segmented
            layoutId="pair-tabs"
            className="self-start"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'steps', label: T.tabs[0] },
              { value: 'conditions', label: T.tabs[1] },
              { value: 'criteria', label: T.tabs[2] },
            ]}
          />
          <div className="mt-6 min-h-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                {tab === 'steps' && (
                  <ol className="space-y-4">
                    {T.instructions.map((s, i) => (
                      <li key={i} className="flex items-start gap-4 text-[25px] leading-snug">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan to-magenta font-display text-[22px] font-bold text-ink">{i + 1}</span>
                        <RichText text={s} className="pt-1" />
                      </li>
                    ))}
                  </ol>
                )}
                {tab === 'conditions' && (
                  <ul className="space-y-4">
                    {T.conditions.map((s, i) => (
                      <li key={i} className="flex items-start gap-4 text-[25px] leading-snug">
                        <CircleCheck size={30} className="mt-0.5 shrink-0 text-mint" />
                        <RichText text={s} />
                      </li>
                    ))}
                  </ul>
                )}
                {tab === 'criteria' && <CriteriaList criteria={T.criteria} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <GlowButton className="w-full" variant="success" icon={Eye} onClick={() => setAnswer(true)}>
            {T.showAnswer}
          </GlowButton>
        </motion.div>
      </div>

      <Modal open={answer} onClose={() => setAnswer(false)} title={T.answerTitle} width={1640}>
        <SolutionView data={T.solution} />
      </Modal>
    </div>
  );
}

function Avatar({ color, label, className = '' }: { color: string; label: string; className?: string }) {
  return (
    <span className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-deep ${className}`} style={{ background: color }}>
      <UserRound size={32} className="text-ink" />
      <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white font-display text-[15px] font-bold text-ink">{label}</span>
    </span>
  );
}

function Zone({ side, color, role, children }: { side: 'left' | 'right'; color: string; role: { who: string; name: string; text: string }; children: React.ReactNode }) {
  const dir = side === 'left' ? 1 : -1;
  return (
    <motion.div
      initial={{ opacity: 0, x: -dir * 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir * 240, scale: 0.7, transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] } }}
      transition={{ delay: 0.35, type: 'spring', stiffness: 160, damping: 20 }}
      className="flex w-[440px] flex-col rounded-[32px] border-2 bg-white/[0.04] p-6"
      style={{ borderColor: `${color}88`, boxShadow: `0 20px 60px -30px ${color}` }}
    >
      <div className="flex items-center gap-4">
        <Avatar color={color} label={side === 'left' ? '1' : '2'} />
        <div>
          <div className="text-[18px] text-snow/50">{role.who}</div>
          <div className="font-display text-[26px] font-bold" style={{ color }}>
            {role.name}
          </div>
        </div>
      </div>
      <div className="my-5 flex h-[190px] items-center justify-center">{children}</div>
      <RichText text={role.text} className="text-[21px] leading-snug text-snow/80" />
    </motion.div>
  );
}

function SkeletonTable() {
  return (
    <div className="w-full">
      <MiniTable />
    </div>
  );
}

function DataChips() {
  const rows = T.solution.rows;
  return (
    <div className="flex w-full flex-col gap-2">
      {rows.map((r, i) => (
        <div
          key={i}
          className="anim-float flex items-center gap-2 rounded-xl border border-magenta/30 bg-magenta/10 px-3 py-1 font-mono text-[18px]"
          style={{ ['--float' as string]: '-4px', ['--dur' as string]: '2.4s', ['--delay' as string]: `${i * 0.3}s` }}
        >
          <span className="text-[#c026d3]">&lt;td&gt;</span>
          <span className="truncate text-snow">{r[2]}</span>
          <span className="ml-auto text-snow/40">{r[1]}</span>
        </div>
      ))}
    </div>
  );
}

/** Мини-таблица расписания: пустой «каркас» или заполненная */
function MiniTable({ filled }: { filled?: boolean }) {
  const { headers, rows } = T.solution;
  return (
    <table className="w-full border-collapse font-body" style={{ fontSize: filled ? 24 : 17 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="border-2 border-cyan/50 bg-cyan/15 px-3 py-1.5 font-display font-semibold text-cyan">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, k) => (
              <td key={k} className="border-2 border-dashed border-white/20 px-3" style={{ height: filled ? 48 : 30 }}>
                {filled && (
                  <motion.span
                    className="block text-snow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 + k * 0.05 }}
                  >
                    {c}
                  </motion.span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
