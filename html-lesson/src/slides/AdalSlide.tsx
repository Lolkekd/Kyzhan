import { motion } from 'motion/react';
import { ClipboardCheck, Quote, Scale } from 'lucide-react';
import { adalSlide as T } from '../data/lesson';
import { SlideHeader } from '../components/ui/SlideHeader';

/** «Адал азамат»: слова учителя и лист самооценки (организационный этап) */
export function AdalSlide() {
  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} />
      <div className="mt-8 grid min-h-0 flex-1 grid-cols-[1fr_620px] gap-10 pb-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass relative flex flex-col justify-center overflow-hidden rounded-[40px] p-12">
          <Quote size={90} className="absolute right-10 top-8 text-[rgb(var(--c-sun))]" strokeWidth={2.5} />
          <div className="flex items-center gap-3 font-display text-[22px] font-bold uppercase tracking-[0.18em] text-rose">
            <Scale size={30} /> Әділдік
          </div>
          <div className="mt-5 font-display text-[64px] font-black leading-[1.08]">
            «<span className="marker">{T.quote}</span>»
          </div>
          <p className="mt-8 text-[27px] leading-snug text-snow/85">{T.text}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col justify-center rounded-[40px] border-[3px] border-ink bg-[#fff1c9] p-10 shadow-[8px_8px_0_rgb(var(--c-electric))]"
        >
          <span className="grid h-20 w-20 place-items-center rounded-[24px] border-[3px] border-ink bg-electric text-white">
            <ClipboardCheck size={44} />
          </span>
          <div className="mt-6 font-display text-[40px] font-black leading-tight">{T.sheetTitle}</div>
          <p className="mt-4 text-[25px] leading-snug text-snow/85">{T.sheetText}</p>
          <div className="mt-6 font-display text-[30px] font-bold text-electric">{T.sheetCall}</div>
        </motion.div>
      </div>
    </div>
  );
}
