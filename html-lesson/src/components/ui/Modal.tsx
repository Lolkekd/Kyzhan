import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { IconButton } from './GlowButton';

/** Модальное окно внутри слайда (не закрывает слайд, не переключает его) */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 1500,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: number;
}) {
  // Esc закрывает окно (и не переключает слайд)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center bg-ink/70 p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-no-swipe
        >
          <motion.div
            className="glass-strong relative flex max-h-full flex-col rounded-[36px] p-10"
            style={{ width }}
            initial={{ opacity: 0, y: 60, scale: 0.92, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-6">
              <div className="font-display text-[40px] font-bold">{title}</div>
              <IconButton icon={X} label="Жабу" onClick={onClose} size={60} />
            </div>
            <div className="min-h-0 flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
