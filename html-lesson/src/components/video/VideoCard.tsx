import { useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { VideoPlayer } from './VideoPlayer';
import { playSound } from '../../lib/sound';
import { cn } from '../../lib/cn';

/**
 * Карточка видео: на слайде только обложка и кнопка, ролик открывается по нажатию в большом окне.
 * Если видео не нужно — его просто не открывают (и на слайде нет пустой заглушки).
 */
export function VideoCard({ src, title, sub, color = '#7b5cff', className, big }: { src: string; title: string; sub?: string; color?: string; className?: string; big?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        type="button"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          playSound('click');
          setOpen(true);
        }}
        className={cn('relative flex items-center gap-6 overflow-hidden rounded-[32px] border-[3px] border-ink bg-white text-left', big ? 'p-10' : 'p-7', className)}
        style={{ boxShadow: `8px 8px 0 ${color}` }}
      >
        <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20" style={{ background: color }} />
        <span className={cn('relative grid shrink-0 place-items-center rounded-full border-[3px] border-ink text-white', big ? 'h-32 w-32' : 'h-24 w-24')} style={{ background: color }}>
          <Play size={big ? 60 : 44} fill="currentColor" className="ml-1.5" />
        </span>
        <span className="relative min-w-0">
          <span className={cn('block font-display font-black leading-tight', big ? 'text-[46px]' : 'text-[34px]')}>{title}</span>
          {sub && <span className="mt-1 block text-[22px] text-snow/60">{sub}</span>}
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border-[3px] border-ink px-4 py-1 font-display text-[20px] font-bold" style={{ background: 'rgb(var(--c-sun))' }}>
            <Play size={18} fill="currentColor" /> Бейнені ашу
          </span>
        </span>
      </motion.button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} width={1150}>
        <VideoPlayer src={src} title={title} accent={color} />
      </Modal>
    </>
  );
}
