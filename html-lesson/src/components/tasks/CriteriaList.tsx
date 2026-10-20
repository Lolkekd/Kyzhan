import { motion } from 'motion/react';
import { Award } from 'lucide-react';
import type { Criterion } from '../../data/lesson';
import { RichText } from '../ui/RichText';

/** Список критериев оценивания с баллами и итогом */
export function CriteriaList({ criteria, title, fontSize = 23 }: { criteria: Criterion[]; title?: string; fontSize?: number }) {
  const total = criteria.reduce((s, c) => s + c.points, 0);
  return (
    <div>
      {title && (
        <div className="mb-4 flex items-center gap-3 font-display text-[26px] font-semibold text-snow">
          <Award className="text-amber" size={30} />
          {title}
        </div>
      )}
      <ul className="space-y-3">
        {criteria.map((c, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3"
            style={{ fontSize }}
          >
            <RichText text={c.text} className="flex-1 leading-snug text-snow/90" />
            <span className="shrink-0 rounded-xl bg-amber/15 px-3 py-1 font-display font-bold text-amber">{c.points}</span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber/20 to-transparent px-5 py-3 font-display text-[24px] font-bold">
        <span>Барлығы</span>
        <span className="text-amber">{total} ұпай</span>
      </div>
    </div>
  );
}
