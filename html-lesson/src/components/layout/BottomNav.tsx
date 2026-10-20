import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { groups, slides } from '../../config/slides';
import { cn } from '../../lib/cn';
import { useNav } from './NavContext';

/** Нижняя панель: «Алдыңғы» / «Келесі» и индикатор прогресса по этапам урока */
export function BottomNav() {
  const { index, total, goTo, next, prev } = useNav();

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex h-[100px] items-center gap-8 px-10">
      <NavButton dir="prev" disabled={index === 0} onClick={prev} />

      <div className="flex flex-1 items-end justify-center gap-5">
        {groups.map((g) => {
          const items = slides.map((s, i) => ({ s, i })).filter(({ s }) => s.group === g.id);
          const active = slides[index].group === g.id;
          return (
            <div key={g.id} className="flex flex-col items-center gap-2">
              <span
                className={cn('font-display text-[15px] uppercase tracking-[0.16em] transition-colors', active ? 'text-snow' : 'text-snow/45')}
                style={active ? { color: g.color } : undefined}
              >
                {g.label}
              </span>
              <div className="flex items-center gap-2">
                {items.map(({ s, i }) => {
                  const done = i < index;
                  const cur = i === index;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      title={`${i + 1}. ${s.title}`}
                      aria-label={`${i + 1}. ${s.title}`}
                      onClick={() => goTo(i)}
                      className="group relative flex h-7 items-center"
                    >
                      <motion.span
                        className="block w-[38px] rounded-full"
                        animate={{
                          height: cur ? 14 : 8,
                          backgroundColor: cur ? g.color : done ? `${g.color}aa` : 'rgba(29,27,58,0.15)',
                          boxShadow: cur ? '0 0 0 3px rgb(29 27 58)' : '0 0 0 0 rgba(0,0,0,0)',
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      />
                      <span className="pointer-events-none absolute bottom-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border-[3px] border-ink bg-white px-3 py-1.5 font-display text-[16px] text-snow shadow-[3px_3px_0_rgb(var(--c-ink))] group-hover:block">
                        {i + 1}. {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="ml-2 self-center font-mono text-[22px] tabular-nums text-snow/50">
          <span className="text-snow">{String(index + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}
        </div>
      </div>

      <NavButton dir="next" disabled={index === total - 1} onClick={next} />
    </div>
  );
}

function NavButton({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  const isNext = dir === 'next';
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={cn(
        'flex h-16 w-[210px] shrink-0 items-center justify-center gap-2 rounded-[20px] font-display text-[22px] font-semibold transition-opacity disabled:opacity-25',
        isNext
          ? 'bg-electric text-white btn-candy'
          : 'glass text-snow',
      )}
    >
      {!isNext && <ChevronLeft size={28} />}
      {isNext ? 'Келесі' : 'Алдыңғы'}
      {isNext && <ChevronRight size={28} />}
    </motion.button>
  );
}
