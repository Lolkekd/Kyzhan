import { memo, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { assetUrl, slideDef, useUI } from './store';
import type { Anim, Effect, ElOverride, OverlayEl, SlideInst, StyleProps } from './types';
import { useNav } from '../components/layout/NavContext';

import { SlideInstCtx } from './instCtx';

/* ───────── пути элементов ───────── */
export function pathOf(root: Element, el: Element): string | null {
  const parts: number[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root) {
    const parent: Element | null = cur.parentElement;
    if (!parent) return null;
    parts.unshift(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return cur === root ? parts.join('.') : null;
}
export function selectorOf(instId: string, path: string) {
  const root = `[data-slide-root="${instId}"]`;
  return path === '' ? root : `${root}>` + path.split('.').map((i) => `:nth-child(${Number(i) + 1})`).join('>');
}
export function elementAt(root: Element, path: string): Element | null {
  if (path === '') return root;
  let cur: Element | null = root;
  for (const i of path.split('.')) {
    cur = cur?.children[Number(i)] ?? null;
    if (!cur) return null;
  }
  return cur;
}

/* ───────── стили ───────── */
export const SHADOWS: Record<string, string> = {
  none: 'none',
  soft: '0 18px 50px -12px rgba(29,27,58,0.35)',
  hard: '6px 6px 0 #1d1b3a',
  glow: '0 0 40px rgba(123,92,255,0.65)',
};
export const FONTS: { value: string; label: string }[] = [
  { value: '', label: 'Как в слайде' },
  { value: 'Geologica Variable', label: 'Geologica (заголовки)' },
  { value: 'Onest Variable', label: 'Onest (текст)' },
  { value: 'Fira Code Variable', label: 'Fira Code (код)' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
];

function cssDecl(s: StyleProps | undefined, important: boolean): string {
  if (!s) return '';
  const imp = important ? ' !important' : '';
  const out: string[] = [];
  if (s.color) out.push(`color:${s.color}${imp}`, `-webkit-text-fill-color:${s.color}${imp}`);
  if (s.bg) out.push(`background:${s.bg}${imp}`);
  if (s.fontFamily) out.push(`font-family:"${s.fontFamily}",sans-serif${imp}`);
  if (s.fontSize) out.push(`font-size:${s.fontSize}px${imp}`);
  if (s.fontWeight) out.push(`font-weight:${s.fontWeight}${imp}`);
  if (s.italic) out.push(`font-style:italic${imp}`);
  if (s.underline) out.push(`text-decoration:underline${imp}`);
  if (s.align) out.push(`text-align:${s.align}${imp}`);
  if (s.lineHeight) out.push(`line-height:${s.lineHeight}${imp}`);
  if (s.borderWidth !== undefined) out.push(`border:${s.borderWidth}px solid ${s.borderColor ?? '#1d1b3a'}${imp}`);
  else if (s.borderColor) out.push(`border-color:${s.borderColor}${imp}`);
  if (s.radius !== undefined) out.push(`border-radius:${s.radius}px${imp}`);
  if (s.shadow) out.push(`box-shadow:${SHADOWS[s.shadow]}${imp}`);
  if (s.opacity !== undefined) out.push(`opacity:${s.opacity}${imp}`);
  if (s.padding !== undefined) out.push(`padding:${s.padding}px${imp}`);
  return out.join(';');
}

export function styleObj(s: StyleProps): CSSProperties {
  return {
    color: s.color,
    background: s.bg,
    fontFamily: s.fontFamily ? `"${s.fontFamily}", sans-serif` : undefined,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    fontStyle: s.italic ? 'italic' : undefined,
    textDecoration: s.underline ? 'underline' : undefined,
    textAlign: s.align,
    lineHeight: s.lineHeight,
    border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor ?? '#1d1b3a'}` : undefined,
    borderRadius: s.radius,
    boxShadow: s.shadow ? SHADOWS[s.shadow] : undefined,
    opacity: s.opacity,
    padding: s.padding,
  };
}

/* ───────── анимации ───────── */
export const EFFECTS: { value: Effect; label: string }[] = [
  { value: 'none', label: 'Без анимации' },
  { value: 'fade', label: 'Проявление' },
  { value: 'up', label: 'Снизу вверх' },
  { value: 'down', label: 'Сверху вниз' },
  { value: 'left', label: 'Слева' },
  { value: 'right', label: 'Справа' },
  { value: 'zoom', label: 'Увеличение' },
  { value: 'bounce', label: 'Прыжок' },
  { value: 'flip', label: 'Переворот' },
];
const KEYFRAMES = `
@keyframes ae-fade{from{opacity:0}}
@keyframes ae-up{from{opacity:0;translate:0 80px}}
@keyframes ae-down{from{opacity:0;translate:0 -80px}}
@keyframes ae-left{from{opacity:0;translate:-140px 0}}
@keyframes ae-right{from{opacity:0;translate:140px 0}}
@keyframes ae-zoom{from{opacity:0;scale:.4}}
@keyframes ae-bounce{0%{opacity:0;scale:.3}60%{opacity:1;scale:1.12}80%{scale:.95}}
@keyframes ae-flip{from{opacity:0;rotate:y 90deg}}`;

export function stepVisible(anim: Anim | undefined, step: number) {
  if (!anim) return true;
  if (anim.trigger === 'click' && step < anim.order) return false;
  if (anim.hideAt && step >= anim.hideAt) return false;
  return true;
}
/** Сколько «нажатий» есть на слайде */
export function maxStep(inst: SlideInst) {
  let m = 0;
  const take = (a?: Anim) => {
    if (!a) return;
    if (a.trigger === 'click') m = Math.max(m, a.order);
    if (a.hideAt) m = Math.max(m, a.hideAt);
  };
  inst.overlay.forEach((o) => take(o.anim));
  Object.values(inst.over).forEach((o) => take(o.anim));
  return m;
}

/** CSS для изменений существующих элементов */
function overrideCss(inst: SlideInst, step: number, editing: boolean): string {
  const rules: string[] = [KEYFRAMES];
  for (const [path, o] of Object.entries(inst.over) as [string, ElOverride][]) {
    const sel = selectorOf(inst.id, path);
    const d: string[] = [];
    if (o.dx || o.dy) d.push(`translate:${o.dx ?? 0}px ${o.dy ?? 0}px !important`);
    if (o.display) d.push(`display:${o.display} !important`);
    if (o.w) d.push(`width:${o.w}px !important`, 'max-width:none !important', 'flex:none !important');
    if (o.h) d.push(`height:${o.h}px !important`, 'max-height:none !important');
    if (o.z !== undefined) d.push(`z-index:${o.z} !important`, 'position:relative');
    const style = cssDecl(o.style, true);
    if (style) d.push(style);
    if (o.hidden) d.push(editing ? 'opacity:.18 !important;outline:2px dashed #ff5a5f' : 'display:none !important');
    else if (!stepVisible(o.anim, step)) d.push(editing ? 'opacity:.35 !important' : 'visibility:hidden !important');
    else if (o.anim && o.anim.effect !== 'none' && !editing) d.push(`animation:ae-${o.anim.effect} ${o.anim.duration}s cubic-bezier(.22,1,.36,1) ${o.anim.delay}s backwards`);
    if (d.length) rules.push(`${sel}{${d.join(';')}}`);
    // стиль текста — и для вложенных элементов с собственным цветом/шрифтом
    if (o.style && (o.style.color || o.style.fontFamily)) {
      const inner: string[] = [];
      if (o.style.color) inner.push(`color:${o.style.color} !important`, `-webkit-text-fill-color:${o.style.color} !important`);
      if (o.style.fontFamily) inner.push(`font-family:"${o.style.fontFamily}",sans-serif !important`);
      rules.push(`${sel} *:not(svg *){${inner.join(';')}}`);
    }
  }
  return rules.join('\n');
}

/* ───────── текстовые замены ───────── */
function applyTexts(root: HTMLElement, inst: SlideInst) {
  for (const [key, v] of Object.entries(inst.texts)) {
    const [path, idx] = key.split('#');
    const el = elementAt(root, path);
    const node = el?.childNodes[Number(idx)];
    if (node && node.nodeType === Node.TEXT_NODE && node.nodeValue !== v.t && node.nodeValue === v.o) node.nodeValue = v.t;
  }
}

/** Содержимое слайда (область 1920×900): исходный компонент + изменения + новые элементы */
export const SlideBody = memo(function SlideBody({ inst, step = Infinity, editing = false, thumb = false }: { inst: SlideInst; step?: number; editing?: boolean; thumb?: boolean }) {
  const ver = useUI((u) => u.ver);
  const def = slideDef(inst);
  const Comp = def?.component;
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const r = root.current;
    if (!r || !Object.keys(inst.texts).length) return;
    applyTexts(r, inst);
    let busy = false;
    const mo = new MutationObserver(() => {
      if (busy) return;
      busy = true;
      applyTexts(r, inst);
      busy = false;
    });
    mo.observe(r, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [inst, ver]);

  // замена картинок <img>
  useLayoutEffect(() => {
    const r = root.current;
    if (!r) return;
    for (const [path, o] of Object.entries(inst.over)) {
      if (!o.imgAsset) continue;
      const el = elementAt(r, path);
      const url = assetUrl(o.imgAsset);
      if (el instanceof HTMLImageElement && url && el.src !== url) el.src = url;
    }
  });

  return (
    <SlideInstCtx.Provider value={inst}>
      <style>{overrideCss(inst, step, editing)}</style>
      <div data-slide-root={inst.id} ref={root} className="absolute inset-0">
        {Comp && <Comp key={`${ver}`} />}
      </div>
      <div className="pointer-events-none absolute inset-0">
        {[...inst.overlay]
          .sort((a, b) => a.z - b.z)
          .map((o) => (
            <OverlayItem key={o.id} el={o} step={step} editing={editing} thumb={thumb} />
          ))}
      </div>
    </SlideInstCtx.Provider>
  );
});

const FROM: Record<Effect, Record<string, number | string>> = {
  none: {},
  fade: { opacity: 0 },
  up: { opacity: 0, y: 80 },
  down: { opacity: 0, y: -80 },
  left: { opacity: 0, x: -140 },
  right: { opacity: 0, x: 140 },
  zoom: { opacity: 0, scale: 0.4 },
  bounce: { opacity: 0, scale: 0.3 },
  flip: { opacity: 0, rotateY: 90 },
};

export function OverlayItem({ el, step, editing, thumb }: { el: OverlayEl; step: number; editing: boolean; thumb?: boolean }) {
  const nav = useNav();
  const visible = editing || stepVisible(el.anim, step);
  const fx = el.anim?.effect ?? 'none';
  const st = styleObj(el.style);
  const url = assetUrl(el.asset);
  const ghost = editing && !stepVisible(el.anim, step);

  const act = () => {
    if (editing || !el.action) return;
    const a = el.action;
    if (a.type === 'next') nav.next();
    else if (a.type === 'prev') nav.prev();
    else if (a.type === 'goto') nav.goTo(Math.max(0, Number(a.value ?? 1) - 1));
    else if (a.type === 'url' && a.value) window.open(a.value, '_blank', 'noopener');
  };

  let inner: React.ReactNode = null;
  if (el.kind === 'text') inner = <div className="h-full w-full whitespace-pre-wrap break-words" data-ov-text style={{ ...st, border: undefined, boxShadow: undefined, borderRadius: undefined, background: undefined }}>{el.text}</div>;
  else if (el.kind === 'button')
    inner = (
      <button type="button" onClick={act} className="pointer-events-auto flex h-full w-full items-center justify-center whitespace-pre-wrap px-4 leading-tight transition hover:brightness-110 active:scale-95" style={st} data-ov-text>
        {el.text}
      </button>
    );
  else if (el.kind === 'shape') inner = <div className="h-full w-full" style={{ ...st, borderRadius: el.shape === 'ellipse' ? '50%' : el.shape === 'pill' ? 9999 : st.borderRadius, height: el.shape === 'line' ? Math.max(4, el.style.borderWidth ?? 6) : '100%', border: el.shape === 'line' ? undefined : st.border, background: el.shape === 'line' ? el.style.borderColor ?? '#1d1b3a' : st.background }} />;
  else if (el.kind === 'image')
    inner = url ? (
      <img src={url} alt="" draggable={false} className="h-full w-full" style={{ objectFit: el.fit ?? 'contain', borderRadius: st.borderRadius, border: st.border, boxShadow: st.boxShadow, opacity: st.opacity }} />
    ) : (
      <div className="grid h-full w-full place-items-center rounded-2xl border-4 border-dashed border-ink/30 bg-white/70 text-[28px] text-snow/50">Сурет</div>
    );
  else if (el.kind === 'video')
    inner = url ? (
      <video src={url} controls={!editing && !thumb} playsInline className={editing ? 'pointer-events-none h-full w-full bg-black' : 'pointer-events-auto h-full w-full bg-black'} style={{ objectFit: el.fit ?? 'contain', borderRadius: st.borderRadius, border: st.border, boxShadow: st.boxShadow }} />
    ) : (
      <div className="grid h-full w-full place-items-center rounded-2xl border-4 border-dashed border-ink/30 bg-white/70 text-[28px] text-snow/50">Бейне</div>
    );
  else if (el.kind === 'html')
    inner = (
      <div className="h-full w-full overflow-hidden" style={st}>
        <div
          style={{ width: el.nat?.w, height: el.nat?.h, transformOrigin: '0 0', transform: el.nat ? `scale(${el.box.w / el.nat.w}, ${el.box.h / el.nat.h})` : undefined }}
          dangerouslySetInnerHTML={{ __html: el.html ?? '' }}
        />
      </div>
    );

  const box: CSSProperties = { left: el.box.x, top: el.box.y, width: el.box.w, height: el.box.h, rotate: `${el.box.rot}deg`, zIndex: el.z };
  return (
    <motion.div
      data-ov-id={el.id}
      className={editing ? 'pointer-events-auto absolute' : `absolute ${el.kind === 'video' || el.kind === 'button' ? 'pointer-events-auto' : ''}`}
      style={{ ...box, pointerEvents: visible ? undefined : 'none' }}
      initial={editing || thumb || fx === 'none' ? false : FROM[fx]}
      animate={visible ? { opacity: ghost ? 0.35 : 1, x: 0, y: 0, scale: 1, rotateY: 0 } : { opacity: 0, scale: fx === 'zoom' ? 0.4 : 1 }}
      transition={fx === 'bounce' ? { type: 'spring', stiffness: 260, damping: 11, delay: el.anim?.delay ?? 0 } : { duration: el.anim?.duration ?? 0.6, delay: el.anim?.delay ?? 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {inner}
    </motion.div>
  );
}
