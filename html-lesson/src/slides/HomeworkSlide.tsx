import { motion } from 'motion/react';
import { BookOpen, Camera, CircleCheck, House, Lightbulb } from 'lucide-react';
import { homeworkSlide as T } from '../data/lesson';
import { RichText } from '../components/ui/RichText';

/** Карточка домашнего задания — светлая и контрастная, чтобы её было удобно сфотографировать */
export function HomeworkSlide() {
  return (
    <div className="flex h-full items-center justify-center px-[100px]">
      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 20, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1600 }}
        className="relative w-[1560px] overflow-hidden rounded-[44px] bg-[#f7f9ff] text-[#0b1030] shadow-[0_50px_120px_-30px_rgba(56,140,255,0.55)]"
      >
        <div className="h-3 w-full bg-gradient-to-r from-cyan via-electric to-violet" />
        <div className="grid grid-cols-[1fr_470px] gap-12 p-14">
          <div>
            <div className="flex items-center gap-5">
              <span className="grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-electric to-violet text-white">
                <House size={44} />
              </span>
              <div>
                <div className="font-display text-[22px] font-semibold uppercase tracking-[0.24em] text-[#5b6ab0]">{T.eyebrow}</div>
                <div className="font-display text-[64px] font-extrabold leading-none">{T.title}</div>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-9 rounded-[28px] border-l-[8px] border-electric bg-[#e9eeff] px-8 py-6 font-display text-[38px] font-semibold leading-snug"
            >
              {T.task}
            </motion.p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {T.requirements.map((r, i) => (
                <motion.div
                  key={r}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.1 }}
                  className="flex items-center gap-4 rounded-[22px] border-2 border-[#dfe5f7] bg-white px-6 py-4 text-[28px] font-medium"
                >
                  <CircleCheck size={34} className="shrink-0 text-[#10b981]" />
                  {r}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="flex flex-col gap-6">
            <div className="rounded-[28px] bg-[#0b1030] p-7 text-white">
              <div className="mb-4 flex items-center gap-3 font-display text-[24px] font-semibold text-cyan">
                <BookOpen size={28} /> Тегтер
              </div>
              <div className="flex flex-wrap gap-3">
                {T.tags.map((t) => (
                  <RichText key={t} text={t} className="text-[27px]" />
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-[28px] border-2 border-dashed border-[#c7d0ef] p-7">
              <div className="mb-4 flex items-center gap-3 font-display text-[24px] font-semibold text-[#5b6ab0]">
                <Lightbulb size={28} className="text-amber" /> {T.ideasTitle}
              </div>
              <div className="flex flex-wrap gap-3">
                {T.ideas.map((it) => (
                  <span key={it} className="rounded-2xl bg-[#e9eeff] px-5 py-2 text-[26px] font-medium">
                    {it}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[20px] text-[#5b6ab0]">
              <Camera size={24} /> Суретке түсіріп ал!
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
