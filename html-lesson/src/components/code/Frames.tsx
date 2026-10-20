import type { ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Окно редактора кода */
export function EditorFrame({ file = 'index.html', children, className, right }: { file?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <div className={cn('on-dark flex flex-col overflow-hidden rounded-[28px] border-[3px] border-ink bg-[#1d1b3a] shadow-[8px_8px_0_rgb(var(--c-electric))]', className)}>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.03] px-6">
        <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#febc2e]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
        <span className="ml-4 rounded-t-lg border-b-2 border-cyan px-3 py-1 font-mono text-[18px] text-snow/80">{file}</span>
        <div className="ml-auto">{right}</div>
      </div>
      <div className="relative min-h-0 flex-1 px-4 py-4">{children}</div>
    </div>
  );
}

/** Окно браузера */
export function BrowserFrame({ children, className, url = 'index.html' }: { children: ReactNode; className?: string; url?: string }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-[28px] border-[3px] border-ink bg-white shadow-[8px_8px_0_#00c2a8]', className)}>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b-[3px] border-ink bg-[#fff1c9] px-6">
        <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#febc2e]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
        <div className="ml-4 flex flex-1 items-center gap-2 rounded-full border-2 border-ink/20 bg-white px-4 py-1.5 font-body text-[18px] text-slate-600">
          <Globe size={18} />
          {url}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 bg-white">{children}</div>
    </div>
  );
}
