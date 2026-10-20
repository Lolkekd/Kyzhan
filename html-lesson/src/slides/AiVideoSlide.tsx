import { motion } from 'motion/react';
import { BrainCircuit } from 'lucide-react';
import { aiVideoSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { SlideHeader } from '../components/ui/SlideHeader';
import { VideoPlayer } from '../components/video/VideoPlayer';

/** Декоративная «нейросеть» по бокам видео */
function NeuralNet({ flip }: { flip?: boolean }) {
  const layers = [
    [120, 260, 400, 540],
    [190, 330, 470],
    [260, 400],
  ];
  const xs = [30, 120, 210];
  return (
    <svg viewBox="0 0 240 660" className="h-[660px] w-[240px]" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      {layers.slice(0, -1).map((layer, li) =>
        layer.map((y1, a) =>
          layers[li + 1].map((y2, b) => (
            <motion.line
              key={`${li}-${a}-${b}`}
              x1={xs[li]}
              y1={y1}
              x2={xs[li + 1]}
              y2={y2}
              stroke="url(#nn)"
              strokeWidth={2}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.25, 0.7, 0.25] }}
              transition={{ pathLength: { delay: 0.5 + li * 0.3, duration: 0.8 }, opacity: { duration: 3, repeat: Infinity, delay: (a + b) * 0.3 } }}
            />
          )),
        ),
      )}
      {layers.map((layer, li) =>
        layer.map((y, k) => (
          <circle
            key={`${li}-${k}`}
            className="anim-pulse"
            cx={xs[li]}
            cy={y}
            r={10}
            fill={li === 2 ? '#c026d3' : li === 1 ? '#7b5cff' : '#0891a2'}
            style={{ ['--pulse' as string]: 1.3, ['--delay' as string]: `${li * 0.4 + k * 0.2}s` }}
          />
        )),
      )}
      <defs>
        <linearGradient id="nn" x1="0" x2="1">
          <stop offset="0" stopColor="#0891a2" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AiVideoSlide() {
  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        size="md"
        right={
          <div className="chip border-magenta/40 bg-magenta/10 text-[#a21caf]">
            <BrainCircuit size={24} />
            {T.badge}
          </div>
        }
      />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-2 text-[24px] text-snow/60">
        {T.subtitle}
      </motion.p>

      <div className="mt-4 flex flex-1 items-start justify-center gap-6">
        <NeuralNet />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: 18 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1600 }}
          className="w-[1120px]"
        >
          <VideoPlayer src={settings.videos.aiLesson} title={T.title} accent="#c026d3" />
        </motion.div>
        <NeuralNet flip />
      </div>
    </div>
  );
}
