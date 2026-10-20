import { motion, type HTMLMotionProps } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { playSound, type SoundName } from '../../lib/sound';

type Variant = 'primary' | 'glass' | 'success' | 'danger' | 'light';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  sound?: SoundName | null;
  children?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'text-white bg-electric btn-candy hover:brightness-110',
  glass: 'text-snow glass hover:bg-[rgb(var(--c-sun))]',
  success: 'text-white bg-mint btn-candy hover:brightness-110',
  danger: 'text-white bg-rose btn-candy hover:brightness-110',
  light: 'text-deep bg-white btn-candy hover:bg-[rgb(var(--c-sun))]',
};

const sizes: Record<Size, string> = {
  sm: 'h-12 px-5 text-[19px] gap-2 rounded-2xl',
  md: 'h-16 px-7 text-[23px] gap-3 rounded-[20px]',
  lg: 'h-20 px-10 text-[28px] gap-3 rounded-[24px]',
  xl: 'h-28 px-16 text-[38px] gap-5 rounded-[32px]',
};
const iconSize: Record<Size, number> = { sm: 20, md: 26, lg: 30, xl: 40 };

export function GlowButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  sound = 'click',
  className,
  children,
  onClick,
  disabled,
  ...rest
}: Props) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -3, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-display font-semibold tracking-tight transition-[filter,opacity] disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      onClick={(e) => {
        if (sound) playSound(sound);
        onClick?.(e);
      }}
      {...rest}
    >
      {Icon && <Icon size={iconSize[size]} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={iconSize[size]} strokeWidth={2.2} />}
    </motion.button>
  );
}

/** Круглая кнопка-иконка */
export function IconButton({
  icon: Icon,
  label,
  active,
  onClick,
  className,
  size = 52,
  sound = 'click',
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
  size?: number;
  sound?: SoundName | null;
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        if (sound) playSound(sound);
        onClick();
      }}
      className={cn(
        'grid shrink-0 place-items-center rounded-2xl border-[3px] shadow-[3px_3px_0_rgb(var(--c-ink))] transition-colors',
        active ? 'border-ink bg-electric text-white' : 'border-ink bg-white text-snow hover:bg-[rgb(var(--c-sun))]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.46)} />
    </motion.button>
  );
}
