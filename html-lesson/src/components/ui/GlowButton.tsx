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
    'text-white bg-gradient-to-r from-electric via-[#6d6bff] to-violet shadow-[0_10px_40px_-8px_rgb(var(--c-electric)/0.7),inset_0_1px_0_rgba(255,255,255,0.35)]',
  glass: 'text-snow glass hover:bg-white/[0.1]',
  success: 'text-[#03140d] bg-gradient-to-r from-mint to-[#a3f7d6] shadow-[0_10px_40px_-10px_rgb(var(--c-mint)/0.8)]',
  danger: 'text-white bg-gradient-to-r from-rose to-magenta shadow-[0_10px_40px_-10px_rgb(var(--c-rose)/0.8)]',
  light: 'text-deep bg-white shadow-[0_10px_40px_-10px_rgba(255,255,255,0.6)]',
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
        'grid shrink-0 place-items-center rounded-2xl border transition-colors',
        active ? 'border-cyan/60 bg-cyan/20 text-cyan' : 'border-white/10 bg-white/[0.06] text-snow/80 hover:bg-white/[0.12] hover:text-white',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.46)} />
    </motion.button>
  );
}
