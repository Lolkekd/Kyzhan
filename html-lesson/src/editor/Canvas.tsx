import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPE } from 'react';
import { MotionConfig } from 'motion/react';
import { NavContext } from '../components/layout/NavContext';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { commit, deckOf, endPreview, findSlide, getProject, getUI, preview, setUI, toast, useProject, useUI, type Sel } from './store';
import { elementAt, pathOf, SlideBody } from './render';
import { SlideBackground } from './SlideBackground';
import { CONTENT, plain, SLIDE_CONTENT } from './content';
import { selectedNode, slideRootEl } from './actions';
import type { Project } from './types';

const AREA_TOP = 80;
const SNAP = 8;
type Rect = { x: number; y: number; w: number; h: number };
type Guide = { x?: number; y?: number };

export function openContextMenuEvent(x: number, y: number, target: 'canvas' | 'slide', slideId?: string) {
  window.dispatchEvent(new CustomEvent('editor-menu', { detail: { x, y, target, slideId } }));
}

/** Рабочая область: слайд в масштабе + слой редактирования */
export function Canvas() {
  const cur = useUI((u) => u.cur);
  const zoom = useUI((u) => u.zoom);
  const interact = useUI((u) => u.interact);
  const sel = useUI((u) => u.sel);
  const inst = useProject((p) => findSlide(cur, p));
  const deck = useProject(deckOf);
  const viewport = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 1200, h: 700 });
  const [hover, setHover] = useState<Rect | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
  const drag = useRef<DragState | null>(null);

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = Math.max(0.1, Math.min((vp.w - 64) / 1920, (vp.h - 64) / 1080));
  const scale = zoom === 'fit' ? fit : zoom;
  const W = 1920 * scale;
  const H = 1080 * scale;
  const padX = Math.max(32, (vp.w - W) / 2);
  const padY = Math.max(32, (vp.h - H) / 2);

  // сообщаем масштаб наружу (для подписи 100%)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('editor-scale', { detail: scale }));
  }, [scale]);

  if (!inst) return <div className="flex-1" />;
  const index = Math.max(0, deck.findIndex((d) => d.id === inst.id));
  const nav = { index, total: deck.length, goTo: () => {}, next: () => {}, prev: () => {} };

  /* ───────── выбор элемента под курсором ───────── */
  const pick = (x: number, y: number): Sel | null => {
    const l = layer.current;
    if (l) l.style.pointerEvents = 'none';
    const list = document.elementsFromPoint(x, y);
    if (l) l.style.pointerEvents = '';
    for (const el of list) {
      if (!area.current?.contains(el)) continue;
      const ov = el.closest('[data-ov-id]');
      if (ov) return { kind: 'ov', id: ov.getAttribute('data-ov-id')! };
      const root = el.closest('[data-slide-root]');
      if (root) {
        let t: Element = el;
        if (t instanceof SVGElement && !(t instanceof SVGSVGElement)) t = t.ownerSVGElement ?? t;
        if (t === root) return null;
        const p = pathOf(root, t);
        return p === null ? null : { kind: 'el', path: p };
      }
    }
    return null;
  };

  const areaRect = () => area.current!.getBoundingClientRect();
  const toArea = (r: DOMRect): Rect => {
    const a = areaRect();
    return { x: (r.left - a.left) / scale, y: (r.top - a.top) / scale, w: r.width / scale, h: r.height / scale };
  };
  const nodeOf = (s: Sel | null) => {
    if (!s) return null;
    if (s.kind === 'ov') return area.current?.querySelector<HTMLElement>(`[data-ov-id="${s.id}"]`) ?? null;
    const root = slideRootEl(inst.id);
    return (root && (elementAt(root, s.path) as HTMLElement | null)) ?? null;
  };

  /** Прямоугольники для привязки: края/центр слайда, другие элементы */
  const snapTargets = (s: Sel): Rect[] => {
    const out: Rect[] = [{ x: 0, y: 0, w: 1920, h: 900 }];
    inst.overlay.forEach((o) => {
      if (!(s.kind === 'ov' && s.id === o.id)) out.push(o.box);
    });
    const n = nodeOf(s);
    if (s.kind === 'el' && n?.parentElement) {
      out.push(toArea(n.parentElement.getBoundingClientRect()));
      for (const sib of Array.from(n.parentElement.children)) if (sib !== n) out.push(toArea(sib.getBoundingClientRect()));
    }
    return out;
  };

  const snap = (r: Rect, targets: Rect[]): { dx: number; dy: number; g: Guide[] } => {
    let best: { d: number; v: number; at: number } | null = null;
    let bestY: { d: number; v: number; at: number } | null = null;
    const xs = [r.x, r.x + r.w / 2, r.x + r.w];
    const ys = [r.y, r.y + r.h / 2, r.y + r.h];
    for (const t of targets) {
      for (const tx of [t.x, t.x + t.w / 2, t.x + t.w])
        for (const x of xs) {
          const d = tx - x;
          if (Math.abs(d) < SNAP / Math.max(scale, 0.3) && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, v: tx, at: 0 };
        }
      for (const ty of [t.y, t.y + t.h / 2, t.y + t.h])
        for (const y of ys) {
          const d = ty - y;
          if (Math.abs(d) < SNAP / Math.max(scale, 0.3) && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, v: ty, at: 0 };
        }
    }
    const g: Guide[] = [];
    if (best) g.push({ x: best.v });
    if (bestY) g.push({ y: bestY.v });
    return { dx: best?.d ?? 0, dy: bestY?.d ?? 0, g };
  };

  /* ───────── перетаскивание ───────── */
  const startMove = (e: RPE, s: Sel) => {
    const n = nodeOf(s);
    if (!n) return;
    const p = getProject();
    const slide = findSlide(inst.id, p)!;
    const ov = s.kind === 'ov' ? slide.overlay.find((o) => o.id === s.id) : undefined;
    if (ov?.locked) return;
    const o = s.kind === 'el' ? slide.over[s.path] : undefined;
    drag.current = {
      mode: 'move',
      sel: s,
      x0: e.clientX,
      y0: e.clientY,
      rect0: s.kind === 'ov' && ov ? { ...ov.box } : toArea(n.getBoundingClientRect()),
      base: { x: ov?.box.x ?? o?.dx ?? 0, y: ov?.box.y ?? o?.dy ?? 0, w: 0, h: 0, rot: ov?.box.rot ?? 0 },
      targets: snapTargets(s),
      moved: false,
    };
  };

  const startResize = (e: RPE, handle: string) => {
    e.stopPropagation();
    const s = getUI().sel;
    const n = nodeOf(s);
    if (!s || !n) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const slide = findSlide(inst.id, getProject())!;
    const ov = s.kind === 'ov' ? slide.overlay.find((o) => o.id === s.id) : undefined;
    const o = s.kind === 'el' ? slide.over[s.path] : undefined;
    drag.current = {
      mode: handle === 'rot' ? 'rot' : 'resize',
      handle,
      sel: s,
      x0: e.clientX,
      y0: e.clientY,
      rect0: ov ? { ...ov.box } : toArea(n.getBoundingClientRect()),
      base: ov ? { ...ov.box } : { x: o?.dx ?? 0, y: o?.dy ?? 0, w: n.offsetWidth || n.getBoundingClientRect().width / scale, h: n.offsetHeight || n.getBoundingClientRect().height / scale, rot: 0 },
      display: getComputedStyle(n).display,
      targets: [],
      moved: false,
    };
  };

  const onMove = (e: RPE) => {
    const d = drag.current;
    if (!d) {
      if (interact) return;
      const h = pick(e.clientX, e.clientY);
      const n = nodeOf(h);
      if (n && !(sel && JSON.stringify(sel) === JSON.stringify(h))) {
        const r = n.getBoundingClientRect();
        const w = wrap.current!.getBoundingClientRect();
        setHover({ x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height });
      } else setHover(null);
      return;
    }
    let dx = (e.clientX - d.x0) / scale;
    let dy = (e.clientY - d.y0) / scale;
    if (!d.moved && Math.hypot(dx, dy) < 3 / scale) return;
    d.moved = true;
    const s = d.sel;
    if (d.mode === 'move') {
      if (!e.altKey) {
        const sn = snap({ ...d.rect0, x: d.rect0.x + dx, y: d.rect0.y + dy }, d.targets);
        dx += sn.dx;
        dy += sn.dy;
        setGuides(sn.g);
      } else setGuides([]);
      preview((p) => applyMove(p, inst.id, s, d.base.x + dx, d.base.y + dy));
    } else if (d.mode === 'resize') {
      const h = d.handle!;
      let { x, y, w, h: hh } = d.base;
      if (h.includes('e')) w = d.base.w + dx;
      if (h.includes('s')) hh = d.base.h + dy;
      if (h.includes('w')) {
        w = d.base.w - dx;
        x = d.base.x + dx;
      }
      if (h.includes('n')) {
        hh = d.base.h - dy;
        y = d.base.y + dy;
      }
      if (e.shiftKey && d.base.w && d.base.h) {
        const k = Math.max(w / d.base.w, hh / d.base.h);
        if (h.includes('w')) x = d.base.x + d.base.w - d.base.w * k;
        if (h.includes('n')) y = d.base.y + d.base.h - d.base.h * k;
        w = d.base.w * k;
        hh = d.base.h * k;
      }
      w = Math.max(12, w);
      hh = Math.max(12, hh);
      preview((p) => applyResize(p, inst.id, s, { x, y, w, h: hh }, d.display));
    } else if (d.mode === 'rot' && s.kind === 'ov') {
      const n = nodeOf(s)!;
      const r = n.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let ang = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
      if (e.shiftKey) ang = Math.round(ang / 15) * 15;
      preview((p) => {
        const o = findSlide(inst.id, p)?.overlay.find((x) => x.id === s.id);
        if (o) o.box.rot = Math.round(((ang % 360) + 360) % 360);
      });
    }
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    setGuides([]);
    if (d) endPreview(d.moved);
  };

  const onDown = (e: RPE) => {
    if (e.button !== 0 || textEdit) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const hit = pick(e.clientX, e.clientY);
    const cur = getUI().sel;
    let target = hit;
    // если щёлкнули внутри уже выбранного элемента — двигаем его, а не вложенный
    const curNode = nodeOf(cur);
    if (cur && curNode && hit) {
      const r = curNode.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      const hn = nodeOf(hit);
      if (inside && hn && curNode.contains(hn)) target = cur;
    }
    if (!target) {
      setUI({ sel: null });
      return;
    }
    if (JSON.stringify(target) !== JSON.stringify(cur)) setUI({ sel: target });
    setHover(null);
    startMove(e, target);
  };

  /* ───────── редактирование текста ───────── */
  const startText = (x: number, y: number) => {
    const hit = pick(x, y);
    if (!hit) return;
    const w = wrap.current!.getBoundingClientRect();
    if (hit.kind === 'ov') {
      const o = findSlide(inst.id, getProject())?.overlay.find((v) => v.id === hit.id);
      if (!o || !(o.kind === 'text' || o.kind === 'button')) return;
      const n = nodeOf(hit)!;
      const r = n.getBoundingClientRect();
      const cs = getComputedStyle(n.querySelector('[data-ov-text]') ?? n);
      setUI({ sel: hit });
      setTextEdit({
        rect: { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height },
        value: o.text ?? '',
        font: cs.font,
        size: parseFloat(cs.fontSize) * scale,
        align: cs.textAlign,
        hint: 'Текст элемента',
        commit: (v) => {
          commit((p) => {
            const t = findSlide(inst.id, p)?.overlay.find((z) => z.id === hit.id);
            if (t) t.text = v;
          });
        },
      });
      return;
    }
    // существующий текст слайда
    const l = layer.current;
    if (l) l.style.pointerEvents = 'none';
    const range = document.caretRangeFromPoint?.(x, y);
    if (l) l.style.pointerEvents = '';
    let node: Node | null = range?.startContainer ?? null;
    const root = slideRootEl(inst.id);
    if (!root) return;
    if (!node || node.nodeType !== Node.TEXT_NODE || !root.contains(node)) {
      const el = nodeOf(hit);
      node = el ? Array.from(el.childNodes).find((c) => c.nodeType === Node.TEXT_NODE && c.nodeValue?.trim()) ?? null : null;
    }
    if (!node || !node.parentElement) return toast('Здесь нет текста. Выберите текст двойным щелчком');
    const keys = inst.base ? SLIDE_CONTENT[inst.base] ?? [] : [];
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    // 1) ищем этот текст в данных задания — тогда меняем сами данные (логика слайда видит новый текст)
    let cand: Element = node.parentElement;
    const texts: { el: Element; s: string }[] = [{ el: node.parentElement, s: node.nodeValue ?? '' }];
    for (let k = 0; k < 4 && cand.parentElement && cand.parentElement !== root; k++) {
      cand = cand.parentElement;
      texts.push({ el: cand, s: cand.textContent ?? '' });
    }
    for (const t of texts) {
      const want = norm(t.s);
      if (!want) continue;
      for (const key of keys) {
        const path = findString(plain(CONTENT[key]), want, norm);
        if (path) {
          const r = t.el.getBoundingClientRect();
          const cs = getComputedStyle(node.parentElement);
          const full = getIn(plain(CONTENT[key]), path) as string;
          setTextEdit({
            rect: { x: r.left - w.left, y: r.top - w.top, w: Math.max(r.width, 160), h: r.height },
            value: full,
            font: cs.font,
            size: parseFloat(cs.fontSize) * scale,
            align: cs.textAlign,
            hint: 'Текст задания (меняется и в логике слайда)',
            commit: (v) => {
              commit((p) => {
                const obj = (p.content[key] as object) ?? plain(CONTENT[key]);
                setIn(obj, path, v);
                p.content[key] = obj;
              });
            },
          });
          return;
        }
      }
    }
    // 2) иначе — замена именно этого текста на слайде
    const parent = node.parentElement;
    const ppath = pathOf(root, parent);
    if (ppath === null) return;
    const idx = Array.prototype.indexOf.call(parent.childNodes, node);
    const key = `${ppath}#${idx}`;
    const orig = inst.texts[key]?.o ?? node.nodeValue ?? '';
    const r = parent.getBoundingClientRect();
    const cs = getComputedStyle(parent);
    setTextEdit({
      rect: { x: r.left - w.left, y: r.top - w.top, w: Math.max(r.width, 160), h: r.height },
      value: node.nodeValue ?? '',
      font: cs.font,
      size: parseFloat(cs.fontSize) * scale,
      align: cs.textAlign,
      hint: 'Текст на слайде',
      commit: (v) => {
        commit((p) => {
          const s = findSlide(inst.id, p);
          if (!s) return;
          if (v === orig) delete s.texts[key];
          else s.texts[key] = { o: orig, t: v };
        });
        // показываем сразу, не дожидаясь перерисовки
        if (node) node.nodeValue = v;
      },
    });
  };

  const scaleLabel = Math.round(scale * 100);

  return (
    <div ref={viewport} className="relative min-w-0 flex-1 overflow-auto bg-[#e9e7f2]" onPointerDown={(e) => e.target === viewport.current && setUI({ sel: null })}>
      <div ref={wrap} data-editor-canvas className="relative" style={{ width: W + padX * 2, height: H + padY * 2 }}>
        <div className="absolute overflow-hidden rounded-[6px] shadow-[0_20px_60px_-20px_rgba(29,27,58,0.45)] ring-1 ring-black/10" style={{ left: padX, top: padY, width: W, height: H }}>
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}>
            <MotionConfig reducedMotion="user">
              <NavContext.Provider value={nav}>
                <SlideBackground inst={inst} palette={deck[index]?.palette ?? ['#7b5cff', '#00c2a8', '#ff5a5f']} />
                <div className="pointer-events-none">
                  <TopBar onOpenPanel={() => {}} />
                </div>
                <div ref={area} className="absolute inset-x-0" style={{ top: AREA_TOP, height: 900 }}>
                  <SlideBody inst={inst} editing />
                  {!interact && (
                    <div
                      ref={layer}
                      className="absolute inset-0 z-[200] cursor-default"
                      onPointerDown={onDown}
                      onPointerMove={onMove}
                      onPointerUp={onUp}
                      onPointerLeave={() => !drag.current && setHover(null)}
                      onDoubleClick={(e) => startText(e.clientX, e.clientY)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        const hit = pick(e.clientX, e.clientY);
                        if (hit && JSON.stringify(hit) !== JSON.stringify(getUI().sel)) setUI({ sel: hit });
                        openContextMenuEvent(e.clientX, e.clientY, 'canvas');
                      }}
                    />
                  )}
                </div>
                <div className="pointer-events-none">
                  <BottomNav />
                </div>
              </NavContext.Provider>
            </MotionConfig>
          </div>
        </div>

        {/* направляющие */}
        {guides.map((g, i) =>
          g.x !== undefined ? (
            <div key={i} className="pointer-events-none absolute w-px bg-[#ff2d8f]" style={{ left: padX + g.x * scale, top: padY + AREA_TOP * scale, height: 900 * scale }} />
          ) : (
            <div key={i} className="pointer-events-none absolute h-px bg-[#ff2d8f]" style={{ top: padY + (AREA_TOP + (g.y ?? 0)) * scale, left: padX, width: W }} />
          ),
        )}

        {hover && !interact && <div className="pointer-events-none absolute rounded-[3px] outline outline-2 outline-[#7b5cff]/50" style={{ left: hover.x, top: hover.y, width: hover.w, height: hover.h }} />}
        {!interact && <SelectionFrame wrap={wrap} onHandle={startResize} onMove={onMove} onUp={onUp} canRotate={sel?.kind === 'ov'} />}

        {textEdit && (
          <TextEditor
            st={textEdit}
            onDone={(v) => {
              if (v !== null && v !== textEdit.value) textEdit.commit(v);
              setTextEdit(null);
            }}
          />
        )}
      </div>
      {interact && (
        <div className="pointer-events-none fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1d1b3a] px-5 py-2 text-[14px] font-semibold text-white shadow-lg">
          Режим урока: клики работают как в презентации · нажмите «Редактировать», чтобы вернуться
        </div>
      )}
      <span className="sr-only">{scaleLabel}</span>
    </div>
  );
}

/* ───────── применение перемещения/размера ───────── */
function applyMove(p: Project, slideId: string, s: Sel, x: number, y: number) {
  const slide = findSlide(slideId, p);
  if (!slide) return;
  if (s.kind === 'ov') {
    const o = slide.overlay.find((v) => v.id === s.id);
    if (o) {
      o.box.x = Math.round(x);
      o.box.y = Math.round(y);
    }
  } else {
    const o = (slide.over[s.path] ??= {});
    o.dx = Math.round(x);
    o.dy = Math.round(y);
  }
}
function applyResize(p: Project, slideId: string, s: Sel, r: Rect, display?: string) {
  const slide = findSlide(slideId, p);
  if (!slide) return;
  if (s.kind === 'ov') {
    const o = slide.overlay.find((v) => v.id === s.id);
    if (o) o.box = { ...o.box, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) };
  } else {
    const o = (slide.over[s.path] ??= {});
    o.dx = Math.round(r.x);
    o.dy = Math.round(r.y);
    o.w = Math.round(r.w);
    o.h = Math.round(r.h);
    if (display === 'inline') o.display = 'inline-block';
  }
}

interface DragState {
  mode: 'move' | 'resize' | 'rot';
  handle?: string;
  sel: Sel;
  x0: number;
  y0: number;
  rect0: Rect;
  base: Rect & { rot: number };
  display?: string;
  targets: Rect[];
  moved: boolean;
}

/* ───────── рамка выделения с маркерами ───────── */
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const CURSOR: Record<string, string> = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };

function SelectionFrame({ wrap, onHandle, onMove, onUp, canRotate }: { wrap: React.RefObject<HTMLDivElement | null>; onHandle: (e: RPE, h: string) => void; onMove: (e: RPE) => void; onUp: () => void; canRotate: boolean }) {
  const sel = useUI((u) => u.sel);
  const [r, setR] = useState<Rect | null>(null);
  useEffect(() => {
    let raf = 0;
    let last = '';
    const tick = () => {
      const n = selectedNode();
      const w = wrap.current?.getBoundingClientRect();
      if (n && w) {
        const b = n.getBoundingClientRect();
        const next = { x: b.left - w.left, y: b.top - w.top, w: b.width, h: b.height };
        const k = `${next.x | 0},${next.y | 0},${next.w | 0},${next.h | 0}`;
        if (k !== last) {
          last = k;
          setR(next);
        }
      } else if (last !== 'none') {
        last = 'none';
        setR(null);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [sel, wrap]);
  if (!sel || !r) return null;
  const pos = (h: string) => ({
    left: h.includes('w') ? -6 : h.includes('e') ? r.w - 6 : r.w / 2 - 6,
    top: h.includes('n') ? -6 : h.includes('s') ? r.h - 6 : r.h / 2 - 6,
  });
  return (
    <div className="pointer-events-none absolute z-[300]" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
      <div className="absolute inset-0 rounded-[2px] outline outline-2 outline-[#7b5cff]" />
      <div className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-[#7b5cff] px-2 py-0.5 text-[11px] font-semibold text-white">
        {Math.round(r.w)} × {Math.round(r.h)}
      </div>
      {HANDLES.map((h) => (
        <div
          key={h}
          className="pointer-events-auto absolute h-3 w-3 rounded-[3px] border-2 border-[#7b5cff] bg-white shadow"
          style={{ ...pos(h), cursor: CURSOR[h] }}
          onPointerDown={(e) => onHandle(e, h)}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
      ))}
      {canRotate && (
        <div className="pointer-events-auto absolute left-1/2 -top-10 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border-2 border-[#7b5cff] bg-white shadow" title="Повернуть (Shift — шаг 15°)" onPointerDown={(e) => onHandle(e, 'rot')} onPointerMove={onMove} onPointerUp={onUp} />
      )}
    </div>
  );
}

/* ───────── редактор текста поверх слайда ───────── */
interface TextEditState {
  rect: Rect;
  value: string;
  font: string;
  size: number;
  align: string;
  hint: string;
  commit: (v: string) => void;
}
function TextEditor({ st, onDone }: { st: TextEditState; onDone: (v: string | null) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [v, setV] = useState(st.value);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const lines = Math.max(1, v.split('\n').length);
  return (
    <div className="absolute z-[400]" style={{ left: st.rect.x - 6, top: st.rect.y - 6 }}>
      <div className="mb-1 inline-block rounded-md bg-[#1d1b3a] px-2 py-0.5 text-[11px] font-semibold text-white">{st.hint} · Enter — готово, Shift+Enter — новая строка, Esc — отмена</div>
      <textarea
        ref={ref}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onDone(v)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') onDone(null);
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onDone(v);
          }
        }}
        className="block resize rounded-lg border-2 border-[#7b5cff] bg-white/95 p-1 text-[#1d1b3a] shadow-xl outline-none"
        style={{ font: st.font, fontSize: Math.max(12, st.size), width: st.rect.w + 12, minHeight: Math.max(st.rect.h + 12, Math.max(12, st.size) * 1.4 * lines + 12), textAlign: st.align as 'left' }}
      />
    </div>
  );
}

/* ───────── поиск строки в данных ───────── */
type P = (string | number)[];
function findString(obj: unknown, want: string, norm: (s: string) => string, path: P = []): P | null {
  if (typeof obj === 'string') return norm(obj) === want ? path : null;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const r = findString(obj[i], want, norm, [...path, i]);
      if (r) return r;
    }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const r = findString(v, want, norm, [...path, k]);
      if (r) return r;
    }
  }
  return null;
}
export function getIn(obj: unknown, path: P): unknown {
  return path.reduce<unknown>((o, k) => (o as Record<string | number, unknown>)?.[k], obj);
}
export function setIn(obj: unknown, path: P, v: unknown) {
  const last = path[path.length - 1];
  const parent = getIn(obj, path.slice(0, -1)) as Record<string | number, unknown>;
  parent[last] = v;
}
