import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Fish, Palette, Sparkles, Target, Wifi } from 'lucide-react';
import { breakSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { SubtaskTabs } from '../components/tasks/Practice';
import { useLessonState } from '../store/lessonStore';

const PAIR_STYLE = [
  { icon: Fish, color: '#0284c7' },
  { icon: Palette, color: '#e07b00' },
];

/** Сергіту сәті: «Шығармашылық аквариум!» (+ вкладка с видео, если нужно) */
export function BreakSlide() {
  const [tab, setTab] = useLessonState<'task' | 'video'>('break.tab', 'task');

  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        right={
          <div className="flex items-center gap-4">
            <SubtaskTabs
              items={[
                { id: 'task', label: T.tabs.task, sub: T.subtitle },
                { id: 'video', label: T.tabs.video, sub: 'videos/break.mp4' },
              ]}
              value={tab}
              onChange={(v) => setTab(v as 'task' | 'video')}
            />
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {tab === 'task' ? (
          <motion.div key="task" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="mt-6 grid min-h-0 flex-1 grid-cols-[1fr_1fr_470px] gap-7 pb-8">
            {T.pairs.map((p, i) => {
              const S = PAIR_STYLE[i % PAIR_STYLE.length];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.12 }}
                  className="flex flex-col rounded-[36px] border-[3px] border-ink bg-white p-8"
                  style={{ boxShadow: `8px 8px 0 ${S.color}` }}
                >
                  <span className="grid h-24 w-24 place-items-center rounded-[28px] border-[3px] border-ink text-white" style={{ background: S.color }}>
                    <S.icon size={54} />
                  </span>
                  <div className="mt-6 font-display text-[22px] font-bold uppercase tracking-[0.16em]" style={{ color: S.color }}>
                    {p.who}
                  </div>
                  <div className="mt-1 font-display text-[44px] font-black leading-tight">{p.title}</div>
                  <p className="mt-4 text-[25px] leading-snug text-snow/85">{p.text}</p>
                </motion.div>
              );
            })}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="flex flex-col gap-5">
              <div className="glass rounded-[30px] p-6">
                <div className="flex items-center gap-2 font-display text-[20px] font-bold uppercase tracking-[0.14em] text-rose">
                  <Target size={24} /> Мақсаты
                </div>
                <p className="mt-2 text-[21px] leading-snug">{T.goal}</p>
              </div>
              <div className="rounded-[30px] border-[3px] border-ink bg-[#fff1c9] p-6">
                <div className="flex items-center gap-2 font-display text-[20px] font-bold uppercase tracking-[0.14em] text-electric">
                  <Sparkles size={24} /> Мұғалім сөзі
                </div>
                <p className="mt-2 text-[21px] leading-snug">{T.teacherWords}</p>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <GlowButton size="lg" iconRight={ExternalLink} icon={Fish} onClick={() => window.open(T.url, '_blank', 'noopener')}>
                  {T.openButton}
                </GlowButton>
                <div className="flex items-center justify-center gap-2 text-[18px] text-snow/55">
                  <Wifi size={18} /> {T.url.replace('https://', '')} · {T.internetNote}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="video" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="mt-6 flex min-h-0 flex-1 items-start justify-center pb-8">
            <div className="w-[1300px]">
              <VideoPlayer src={settings.videos.break} title={T.eyebrow} accent="#e69500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
