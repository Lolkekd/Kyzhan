import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

/** Заголовок слайда: надзаголовок + крупный заголовок с эффектным появлением */
export function SlideHeader({
  eyebrow,
  title,
  right,
  className,
  size = 'lg',
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  className?: string;
  size?: 'md' | 'lg';
}) {
  const words = title.split(' ');
  return (
    <div className={cn('flex items-end justify-between gap-8', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <motion.div
            className="eyebrow mb-3 flex items-center gap-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="h-[6px] w-12 rounded-full bg-rose" />
            {eyebrow}
          </motion.div>
        )}
        <h1 className={cn('font-display font-bold leading-[1.05] tracking-tight text-snow', size === 'lg' ? 'text-[68px]' : 'text-[56px]')}>
          {words.map((w, i) => (
            <motion.span
              key={i}
              className={cn('mr-[0.25em] inline-block', i === words.length - 1 && words.length > 1 && 'marker')}
              initial={{ opacity: 0, y: 40, rotateX: -70, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </h1>
      </div>
      {right && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="shrink-0">
          {right}
        </motion.div>
      )}
    </div>
  );
}
