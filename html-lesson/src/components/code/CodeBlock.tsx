import { AnimatePresence, motion } from 'motion/react';
import { tokenizeHtml, type TokenType } from '../../lib/htmlTable';
import { cn } from '../../lib/cn';

const tokenClass: Record<TokenType, string> = {
  punct: 'text-slate-400',
  tag: 'text-[#ff7ab6]',
  attr: 'text-amber',
  value: 'text-mint',
  text: 'text-snow',
};

export interface CodeBlockLine {
  text: string;
  indent: number;
}

interface Props<L extends CodeBlockLine> {
  lines: L[];
  fontSize?: number;
  isVisible?: (line: L, i: number) => boolean;
  /** 0 — нет подсветки, 1 — мягкая, 2 — яркая */
  highlight?: (line: L, i: number) => 0 | 1 | 2;
  onLineClick?: (line: L, i: number) => void;
  highlightColor?: string;
  /** приглушать неподсвеченные строки */
  dimOthers?: boolean;
}

/** Блок кода с нумерацией строк, подсветкой синтаксиса и анимацией появления строк */
export function CodeBlock<L extends CodeBlockLine>({
  lines,
  fontSize = 24,
  isVisible = () => true,
  highlight = () => 0,
  onLineClick,
  highlightColor = '34 211 238',
  dimOthers = false,
}: Props<L>) {
  const lineHeight = Math.round(fontSize * 1.5);
  let visibleNo = 0;
  return (
    <div className="font-mono" style={{ fontSize, lineHeight: `${lineHeight}px`, fontVariantLigatures: 'none' }}>
      <AnimatePresence initial={false}>
        {lines.map((line, i) => {
          if (!isVisible(line, i)) return null;
          visibleNo += 1;
          const h = highlight(line, i);
          return (
            <motion.div
              key={i}
              layout="position"
              initial={{ opacity: 0, x: -24, height: 0 }}
              animate={{ opacity: 1, x: 0, height: lineHeight }}
              exit={{ opacity: 0, x: 24, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={onLineClick ? () => onLineClick(line, i) : undefined}
              className={cn(
                'relative flex items-center whitespace-pre rounded-lg pr-4 transition-colors duration-300',
                onLineClick && 'cursor-pointer hover:bg-white/[0.05]',
              )}
              style={{
                backgroundColor: h === 2 ? `rgb(${highlightColor} / 0.2)` : h === 1 ? `rgb(${highlightColor} / 0.08)` : 'rgba(0,0,0,0)',
                boxShadow: h === 2 ? `inset 4px 0 0 rgb(${highlightColor})` : 'inset 0 0 0 rgba(0,0,0,0)',
              }}
            >
              <span className="w-[2.6em] shrink-0 select-none pr-[0.8em] text-right text-white/25">{visibleNo}</span>
              <span style={{ paddingLeft: `${line.indent * 1.5}em` }} className={cn('transition-opacity duration-300', dimOthers && h === 0 && 'opacity-35')}>
                {tokenizeHtml(line.text).map((tok, k) => (
                  <span key={k} className={tokenClass[tok.type]}>
                    {tok.t}
                  </span>
                ))}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
