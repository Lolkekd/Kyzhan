import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { CodeBlock, type CodeBlockLine } from '../code/CodeBlock';
import { BrowserFrame, EditorFrame } from '../code/Frames';
import { cn } from '../../lib/cn';
import { playSound } from '../../lib/sound';

/** Текст HTML-кода → строки для CodeBlock (отступ = 2 пробела) */
export function codeLines(src: string): CodeBlockLine[] {
  return src.split('\n').map((l) => {
    const sp = l.match(/^ */)![0].length;
    return { text: l.trimStart(), indent: Math.floor(sp / 2) };
  });
}

/** Окно редактора с HTML-кодом */
export function HtmlCode({ code, fontSize = 22, className, file }: { code: string; fontSize?: number; className?: string; file?: string }) {
  return (
    <EditorFrame className={className} file={file}>
      <div className="h-full overflow-auto">
        <CodeBlock lines={codeLines(code)} fontSize={fontSize} />
      </div>
    </EditorFrame>
  );
}

/** Настоящий результат в браузере: HTML рисует сам браузер (iframe), как у студента на компьютере */
export function LiveHtml({ html, fontSize = 26, className, url = 'index.html' }: { html: string; fontSize?: number; className?: string; url?: string }) {
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center;font:${fontSize}px 'Times New Roman',serif;padding:20px;box-sizing:border-box}</style></head>${html.replace(/^\s*<html>|<\/html>\s*$/g, '')}</html>`;
  return (
    <BrowserFrame className={className} url={url}>
      <iframe title="preview" srcDoc={doc} className="pointer-events-none h-full w-full border-0 bg-white" tabIndex={-1} />
    </BrowserFrame>
  );
}

/** Вкладки подзаданий: «1.1 · 5 мин» */
export function SubtaskTabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string; sub?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-3" data-no-swipe>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => {
              if (!on) playSound('click');
              onChange(it.id);
            }}
            className={cn(
              'flex flex-col items-start rounded-[20px] border-[3px] px-5 py-2 text-left transition-colors',
              on ? 'border-ink bg-electric text-white shadow-[4px_4px_0_rgb(var(--c-ink))]' : 'border-ink/25 bg-white text-snow hover:border-ink',
            )}
          >
            <span className="font-display text-[24px] font-bold leading-tight">{it.label}</span>
            {it.sub && <span className={cn('text-[16px] leading-tight', on ? 'text-white/85' : 'text-snow/55')}>{it.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Карточка задания: номер, формат работы, текст */
export function TaskCard({ code, mode, text, children, className }: { code: string; mode: string; text: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('glass flex min-h-0 flex-col rounded-[32px] p-7', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border-[3px] border-ink bg-[rgb(var(--c-sun))] px-4 py-0.5 font-display text-[22px] font-bold">{code}</span>
        <span className="font-display text-[20px] font-semibold uppercase tracking-[0.14em] text-rose">{mode}</span>
      </div>
      <p className="mt-4 font-display text-[30px] font-semibold leading-snug">{text}</p>
      {children}
    </div>
  );
}

/** Скрытый ответ: кнопка «Дұрыс жауабы» → содержимое */
export function Reveal({ open, onToggle, showLabel, hideLabel, children, className }: { open: boolean; onToggle: () => void; showLabel: string; hideLabel: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-0 flex-col gap-4', className)}>
      <button
        type="button"
        onClick={() => {
          playSound(open ? 'click' : 'reveal');
          onToggle();
        }}
        className={cn('btn-candy flex h-16 shrink-0 items-center justify-center gap-3 rounded-[20px] font-display text-[24px] font-bold', open ? 'bg-white text-snow' : 'bg-mint text-white')}
      >
        {open ? <EyeOff size={28} /> : <Eye size={28} />} {open ? hideLabel : showLabel}
      </button>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="a" className="h-full" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="q"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid h-full place-items-center rounded-[28px] border-[3px] border-dashed border-ink/25 bg-white/60 font-display text-[90px] font-black text-ink/15"
            >
              ?
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
