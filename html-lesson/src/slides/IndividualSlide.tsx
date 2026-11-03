import { AnimatePresence, motion } from 'motion/react';
import { individualSlide as T } from '../data/lesson';
import { SlideHeader } from '../components/ui/SlideHeader';
import { Timer } from '../components/timer/Timer';
import { HtmlCode, LiveHtml, Reveal, SubtaskTabs, TaskCard } from '../components/tasks/Practice';
import { useLessonState } from '../store/lessonStore';

/** Жеке жұмыс: 1.1 – 1.3 (код → кесте, кесте → код, тақырып жолағы colspan) */
export function IndividualSlide() {
  const [tab, setTab] = useLessonState<string>('individual.tab', T.tasks[0].id);
  const [shown, setShown] = useLessonState<Record<string, boolean>>('individual.answers', {});
  const task = T.tasks.find((t) => t.id === tab) ?? T.tasks[0];
  const open = !!shown[task.id];

  return (
    <div className="relative flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} right={<Timer key={task.id} id={`individual-${task.id}`} minutes={task.minutes} showPresets={false} />} />

      <div className="mt-4">
        <SubtaskTabs items={T.tasks.map((t) => ({ id: t.id, label: `${t.id}-тапсырма`, sub: `${t.mode} · ${t.minutes} мин` }))} value={tab} onChange={setTab} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="mt-5 grid min-h-0 flex-1 grid-cols-[1fr_1fr] gap-8 pb-6"
        >
          <TaskCard code={`${task.id}-тапсырма`} mode={task.mode} text={task.text}>
            <div className="mt-4 font-display text-[20px] font-semibold uppercase tracking-[0.12em] text-snow/55">{task.givenLabel}</div>
            <div className="mt-3 min-h-0 flex-1">
              {'code' in task && task.code ? (
                <HtmlCode code={task.code} fontSize={26} className="h-full" />
              ) : (
                <LiveHtml html={'targetHtml' in task ? task.targetHtml ?? '' : ''} fontSize={44} className="h-full" />
              )}
            </div>
          </TaskCard>

          <Reveal open={open} onToggle={() => setShown({ ...shown, [task.id]: !open })} showLabel={T.showAnswer} hideLabel={T.hideAnswer}>
            {'answerHtml' in task && task.answerHtml ? (
              <div className="flex h-full flex-col gap-4">
                <LiveHtml html={task.answerHtml} fontSize={52} className="min-h-0 flex-1" />
                <div className="glass rounded-[22px] py-3 text-center font-display text-[34px] font-black">{task.answerNote}</div>
              </div>
            ) : (
              <HtmlCode code={'answerCode' in task ? task.answerCode ?? '' : ''} fontSize={23} className="h-full" />
            )}
          </Reveal>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
