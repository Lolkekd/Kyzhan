import { Fragment } from 'react';
import { cn } from '../../lib/cn';

/** Текст, в котором фрагменты вида <table> автоматически оформляются как код */
export function RichText({ text, className, codeClassName }: { text: string; className?: string; codeClassName?: string }) {
  const parts = text.split(/(<\/?[a-z]+[^>]*>)/g);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        /^<\/?[a-z]/.test(p) ? (
          <code
            key={i}
            className={cn('mx-[0.08em] whitespace-nowrap rounded-lg bg-[#ff7ab6]/15 px-[0.3em] py-[0.05em] font-mono text-[0.88em] text-[#ff9cc8] [font-variant-ligatures:none]', codeClassName)}
          >
            {p}
          </code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </span>
  );
}
