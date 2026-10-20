import { motion } from 'motion/react';

/** Анимированные иллюстрации-подсказки для четырёх плиток пазла (тема прямо не называется) */

export function RowsColumnsHint({ color }: { color: string }) {
  const W = 220;
  const H = 160;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
      {[0, 1, 2, 3].map((r) => (
        <motion.line
          key={`h${r}`}
          x1={10}
          x2={W - 10}
          y1={10 + r * 46}
          y2={10 + r * 46}
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4 + r * 0.15, duration: 0.6 }}
        />
      ))}
      {[0, 1, 2, 3].map((c) => (
        <motion.line
          key={`v${c}`}
          y1={10}
          y2={H - 12}
          x1={10 + c * 66.6}
          x2={10 + c * 66.6}
          stroke="rgb(29 27 58)"
          strokeOpacity={0.8}
          strokeWidth={6}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1 + c * 0.15, duration: 0.6 }}
        />
      ))}
      <motion.path d={`M ${W + 14} 20 v ${H - 40}`} stroke="rgb(29 27 58)" strokeOpacity={0.35} strokeWidth={3} strokeDasharray="6 6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} />
    </svg>
  );
}

export function CellsHint({ color }: { color: string }) {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-2.5 p-1">
      {Array.from({ length: 9 }).map((_, i) => {
        const hot = i === 4;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: hot ? [0, 1.12, 1] : 1, opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.07, type: 'spring', stiffness: 300, damping: 16 }}
            className="rounded-xl border-2"
            style={{
              borderColor: hot ? color : 'rgba(29,27,58,0.4)',
              background: hot ? color : 'rgba(255,255,255,0.9)',
              boxShadow: hot ? `0 0 30px ${color}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export function TagsHint({ color }: { color: string }) {
  const parts = ['<', '/', '>'];
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, rotate: -20 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.3 + i * 0.15 }}
          className="inline-block"
        >
          <span
            className="anim-float inline-block font-mono text-[110px] font-bold leading-none"
            style={{ color: i === 1 ? 'rgb(29 27 58)' : color, textShadow: 'none', ['--float' as string]: '-8px', ['--dur' as string]: '2.4s', ['--delay' as string]: `${i * 0.3}s` }}
          >
            {p}
          </span>
        </motion.span>
      ))}
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={{ delay: 1 }} className="absolute -bottom-7 font-mono text-[19px] text-snow">
        &lt;html&gt; &lt;body&gt; …
      </motion.span>
    </div>
  );
}

export function DataHint({ color }: { color: string }) {
  const rows = [
    ['Әлия', '8', '5'],
    ['Нұрлан', '8', '4'],
    ['Дана', '8', '5'],
  ];
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.18 }}
          className="flex items-center gap-2 font-mono text-[22px]"
        >
          <span className="w-[100px] rounded-lg bg-white/10 px-2 py-1 text-snow">{r[0]}</span>
          <span className="w-[44px] rounded-lg bg-white/10 px-2 py-1 text-center text-snow">{r[1]}</span>
          <span className="w-[44px] rounded-lg px-2 py-1 text-center font-bold text-ink" style={{ background: color }}>
            {r[2]}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export const hintVisuals = [RowsColumnsHint, CellsHint, TagsHint, DataHint];
