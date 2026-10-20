import { motion } from 'motion/react';
import { Heart, RotateCcw } from 'lucide-react';
import { finaleSlide as T } from '../data/lesson';
import { useNav } from '../components/layout/NavContext';
import { GlowButton } from '../components/ui/GlowButton';

const CELLS = Array.from({ length: 22 }).map((_, i) => ({
  x: (i * 83) % 100,
  size: 30 + ((i * 17) % 40),
  dur: 14 + ((i * 5) % 10),
  delay: -((i * 2.7) % 14),
  color: ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'][i % 5],
}));

/** Финальный экран: спокойно поднимающиеся «ячейки» и мягкое свечение */
export function FinaleSlide() {
  const { goTo } = useNav();
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden text-center">
      {CELLS.map((c, i) => (
        <span
          key={i}
          className="anim-rise pointer-events-none absolute top-0 rounded-xl border-2"
          style={{
            left: `${c.x}%`,
            width: c.size,
            height: c.size,
            borderColor: `${c.color}99`,
            background: `${c.color}1f`,
            ['--dur' as string]: `${c.dur}s`,
            ['--delay' as string]: `${c.delay}s`,
          }}
        />
      ))}

      <div
        className="anim-pulse absolute h-[760px] w-[760px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 65%)', ['--dur' as string]: '6s', ['--pulse' as string]: 1.12 }}
      />

      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 12 }} className="relative mb-8">
        <span className="anim-pulse block" style={{ ['--dur' as string]: '1.8s', ['--pulse' as string]: 1.12 }}>
          <Heart size={110} className="fill-rose text-rose" style={{ filter: 'drop-shadow(0 0 40px rgb(251 113 133))' }} />
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 40, filter: 'blur(16px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative font-display text-[112px] font-extrabold leading-none tracking-tight"
      >
        <span className="shimmer-text bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg,#67e8f9,#a5b4fc,#f0abfc,#fde68a,#67e8f9)' }}>
          {T.thanks}
        </span>
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }} className="relative mt-8 font-display text-[46px] font-medium text-snow/85">
        {T.done}
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="relative mt-16">
        <GlowButton size="lg" variant="glass" icon={RotateCcw} onClick={() => goTo(0)}>
          {T.restart}
        </GlowButton>
      </motion.div>
    </div>
  );
}
