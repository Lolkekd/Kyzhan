import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { playSound } from '../../lib/sound';

/** Переключатель вкладок с плавающим индикатором */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
  className?: string;
}) {
  return (
    <div className={cn('glass inline-flex rounded-[22px] p-1.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            if (o.value !== value) playSound('click');
            onChange(o.value);
          }}
          className={cn(
            'relative h-14 rounded-[18px] px-7 font-display text-[22px] font-semibold transition-colors',
            o.value === value ? 'text-white' : 'text-snow/55 hover:text-snow/85',
          )}
        >
          {o.value === value && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-[18px] bg-gradient-to-r from-electric/80 to-violet/80 shadow-[0_8px_30px_-8px_rgb(var(--c-electric)/0.8)]"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
