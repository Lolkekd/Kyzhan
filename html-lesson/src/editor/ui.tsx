import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Небольшие элементы интерфейса редактора (светлый стиль Canva/Figma) */
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

export function IconBtn({ icon: Icon, label, onClick, active, disabled, danger, kbd, text, wide }: { icon: LucideIcon; label: string; onClick: () => void; active?: boolean; disabled?: boolean; danger?: boolean; kbd?: string; text?: string; wide?: boolean }) {
  return (
    <button
      type="button"
      title={kbd ? `${label} (${kbd})` : label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-medium transition-colors disabled:cursor-default disabled:opacity-35',
        active ? 'bg-[#7b5cff] text-white' : danger ? 'text-[#d6303a] hover:bg-[#ffe9ea]' : 'text-[#3b3858] hover:bg-[#efedf8]',
        'min-w-9',
      )}
    >
      <Icon size={18} strokeWidth={2} />
      {text && <span className={wide ? 'whitespace-nowrap' : 'hidden whitespace-nowrap min-[1700px]:inline'}>{text}</span>}
    </button>
  );
}

export function Section({ title, children, defaultOpen = true, right }: { title: string; children: ReactNode; defaultOpen?: boolean; right?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#ecebf3]">
      <div className="flex items-center">
        <button type="button" onClick={() => setOpen(!open)} className="flex flex-1 items-center gap-1.5 px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b6788]">
          <ChevronDown size={14} className={cx('transition-transform', !open && '-rotate-90')} />
          {title}
        </button>
        {right && <div className="pr-3">{right}</div>}
      </div>
      {open && <div className="flex flex-col gap-2.5 px-4 pb-4">{children}</div>}
    </div>
  );
}

export function Row({ label, children, compact }: { label: string; children: ReactNode; compact?: boolean }) {
  return (
    <div className={cx('flex text-[13px] text-[#3b3858]', compact ? 'flex-col gap-1' : 'items-center gap-2')} role="group" aria-label={label}>
      <span className={cx('shrink-0 text-[#6b6788]', compact ? 'text-[12px]' : 'w-[92px]')}>{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </div>
  );
}

const inputCls = 'h-8 w-full min-w-0 rounded-md border border-[#dcd9ea] bg-white px-2 text-[13px] text-[#1d1b3a] outline-none focus:border-[#7b5cff] focus:ring-2 focus:ring-[#7b5cff]/20';

export function Num({ value, onChange, min, max, step = 1, suffix, placeholder }: { value: number | undefined; onChange: (v: number | undefined) => void; min?: number; max?: number; step?: number; suffix?: string; placeholder?: string }) {
  return (
    <div className="relative flex-1">
      <input
        type="number"
        className={cx(inputCls, suffix && 'pr-7')}
        value={value === undefined || Number.isNaN(value) ? '' : Math.round(value * 100) / 100}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
      {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[#9a96b4]">{suffix}</span>}
    </div>
  );
}

export function Text({ value, onChange, placeholder, area, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean; mono?: boolean }) {
  if (area)
    return (
      <textarea
        className={cx(inputCls, 'h-auto min-h-[64px] resize-y py-1.5 leading-snug', mono && 'font-mono text-[12px]')}
        rows={Math.min(14, Math.max(2, value.split('\n').length + 1))}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
      />
    );
  return <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />;
}

export function Select<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className={inputCls} value={String(value)} onChange={(e) => onChange((typeof value === 'number' ? Number(e.target.value) : e.target.value) as T)}>
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const SWATCHES = ['#1d1b3a', '#ffffff', '#7b5cff', '#ff5a5f', '#00c2a8', '#ffd23f', '#e69500', '#d63384', '#0284c7', '#12a06a', '#fff8ec', '#9ca3af'];
export function Color({ value, onChange, allowEmpty = true }: { value: string | undefined; onChange: (v: string | undefined) => void; allowEmpty?: boolean }) {
  const [open, setOpen] = useState(false);
  const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
  return (
    <div className="relative flex flex-1 items-center gap-1.5">
      <button type="button" onClick={() => setOpen(!open)} className="h-8 w-8 shrink-0 rounded-md border border-[#dcd9ea]" style={{ background: value ? value : 'repeating-conic-gradient(#e5e3ef 0 25%, #fff 0 50%) 50%/10px 10px' }} title="Цвет" />
      <input className={inputCls} value={value ?? ''} placeholder="как в слайде" onChange={(e) => onChange(e.target.value || undefined)} onKeyDown={(e) => e.stopPropagation()} />
      {open && (
        <div className="absolute right-0 top-9 z-50 w-[220px] rounded-xl border border-[#e3e1ee] bg-white p-3 shadow-xl" onMouseLeave={() => setOpen(false)}>
          <div className="grid grid-cols-6 gap-1.5">
            {SWATCHES.map((c) => (
              <button key={c} type="button" title={c} onClick={() => onChange(c)} className="h-7 w-7 rounded-md border border-black/10" style={{ background: c }} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0" />
            <span className="text-[12px] text-[#6b6788]">Свой цвет</span>
            {allowEmpty && (
              <button type="button" onClick={() => onChange(undefined)} className="ml-auto text-[12px] text-[#7b5cff] hover:underline">
                Сброс
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Seg<T extends string>({ value, onChange, options }: { value: T | undefined; onChange: (v: T) => void; options: { value: T; label?: string; icon?: LucideIcon; title?: string }[] }) {
  return (
    <div className="flex flex-1 rounded-lg bg-[#f1f0f7] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title ?? o.label}
          onClick={() => onChange(o.value)}
          className={cx('flex h-7 flex-1 items-center justify-center rounded-md text-[12px] font-semibold transition-colors', value === o.value ? 'bg-white text-[#1d1b3a] shadow-sm' : 'text-[#6b6788] hover:text-[#1d1b3a]')}
        >
          {o.icon ? <o.icon size={15} /> : o.label}
        </button>
      ))}
    </div>
  );
}

export function Btn({ children, onClick, primary, danger, icon: Icon, small }: { children: ReactNode; onClick: () => void; primary?: boolean; danger?: boolean; icon?: LucideIcon; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors',
        small ? 'h-8 px-2.5 text-[12px]' : 'h-9 px-3 text-[13px]',
        primary ? 'bg-[#7b5cff] text-white hover:bg-[#6a4bf0]' : danger ? 'bg-[#ffe9ea] text-[#d6303a] hover:bg-[#ffd6d8]' : 'bg-[#f1f0f7] text-[#3b3858] hover:bg-[#e6e3f3]',
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-[#f6f4ff] px-3 py-2 text-[12px] leading-snug text-[#5b5680]">{children}</div>;
}
