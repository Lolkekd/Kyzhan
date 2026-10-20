import { useEffect, useState } from 'react';
import { RotateCcw, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { playSound } from '../../lib/sound';

/**
 * Кнопка сброса с подтверждением: первое нажатие — «Растайсыз ба?», второе — действие.
 * Защищает от случайного сброса результатов.
 */
export function ConfirmButton({
  onConfirm,
  label = 'Қайта бастау',
  confirmLabel = 'Растау?',
  icon: Icon = RotateCcw,
  className,
  compact,
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      title={label}
      onClick={() => {
        if (armed) {
          playSound('minus');
          setArmed(false);
          onConfirm();
        } else {
          playSound('click');
          setArmed(true);
        }
      }}
      className={cn(
        'inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border px-4 font-display text-[18px] font-medium transition-colors',
        armed ? 'border-rose/60 bg-rose/20 text-rose' : 'border-white/10 bg-white/[0.05] text-snow/60 hover:bg-white/[0.1] hover:text-snow',
        className,
      )}
    >
      <Icon size={20} className={cn(armed && 'animate-spin')} style={armed ? { animationDuration: '1.4s' } : undefined} />
      {(!compact || armed) && <span>{armed ? confirmLabel : label}</span>}
    </motion.button>
  );
}
