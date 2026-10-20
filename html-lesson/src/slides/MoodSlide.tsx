import { useLessonState } from '../store/lessonStore';
import { motion } from 'motion/react';
import { HeartHandshake, MessageCircle, ShieldCheck } from 'lucide-react';
import { moodSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { SlideHeader } from '../components/ui/SlideHeader';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { cn } from '../lib/cn';
import { playSound } from '../lib/sound';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6'];

export function MoodSlide() {
  const [active, setActive] = useLessonState<number | null>('mood.question', null);

  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        right={
          <div className="chip border-rose/30 bg-rose/10 text-rose">
            <ShieldCheck size={24} />
            {T.slogan}
          </div>
        }
      />

      <div className="mt-10 grid min-h-0 flex-1 grid-cols-[1060px_1fr] gap-12">
        <motion.div initial={{ opacity: 0, scale: 0.94, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
          <VideoPlayer src={settings.videos.cyberbullying} title={T.videoTitle} expectedDuration={T.videoDuration} accent="#a78bfa" />
          <div className="mt-4 flex items-center gap-3 text-[20px] text-snow/50">
            <HeartHandshake size={22} className="text-rose" />
            {T.videoTitle} · {T.videoDuration}
          </div>
        </motion.div>

        <div className="flex flex-col gap-5">
          {T.questions.map((q, i) => {
            const on = active === i;
            return (
              <motion.button
                key={i}
                type="button"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: active === null || on ? 1 : 0.45, x: 0, scale: on ? 1.03 : 1 }}
                transition={{ delay: active === null ? 0.5 + i * 0.12 : 0, type: 'spring', stiffness: 260, damping: 24 }}
                onClick={() => {
                  playSound('pop');
                  setActive(on ? null : i);
                }}
                className={cn('glass relative flex flex-1 items-center gap-6 overflow-hidden rounded-[30px] px-8 text-left transition-colors', on && 'bg-white/[0.1]')}
                style={{ boxShadow: on ? `0 0 0 3px ${COLORS[i]}, 0 20px 60px -20px ${COLORS[i]}` : '0 20px 60px -20px rgba(0,0,0,0.6)' }}
              >
                <span className="absolute inset-y-0 left-0 w-2" style={{ background: COLORS[i] }} />
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-[30px] font-bold text-ink"
                  style={{ background: COLORS[i] }}
                >
                  {i + 1}
                </span>
                <span className="font-display text-[30px] font-medium leading-snug text-snow">{q}</span>
                <MessageCircle size={30} className="ml-auto shrink-0 text-snow/25" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
