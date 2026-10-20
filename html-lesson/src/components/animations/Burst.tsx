import { motion } from 'motion/react';
import { useMemo } from 'react';

/** Разлёт частиц из центра (празднование, раскрытие темы) */
export function Burst({ count = 36, colors = ['#22d3ee', '#a855f7', '#f472b6', '#fbbf24', '#34d399'], radius = 520, size = 14 }: { count?: number; colors?: string[]; radius?: number; size?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const r = radius * (0.5 + Math.random() * 0.6);
        return {
          x: Math.cos(a) * r,
          y: Math.sin(a) * r,
          c: colors[i % colors.length],
          s: size * (0.5 + Math.random()),
          rot: Math.random() * 360,
          square: i % 3 === 0,
          d: Math.random() * 0.15,
        };
      }),
    [count, colors, radius, size],
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ width: p.s, height: p.s, background: p.c, borderRadius: p.square ? 3 : '50%', boxShadow: `0 0 12px ${p.c}` }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: p.x, y: p.y + 60, opacity: 0, scale: 1, rotate: p.rot }}
          transition={{ duration: 1.6, delay: p.d, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}
