import { AnimatePresence, motion } from 'motion/react';
import { Code2, EyeOff, MessageCircleQuestion } from 'lucide-react';
import { attrsSlide as T } from '../data/lesson';
import { SlideHeader } from '../components/ui/SlideHeader';
import { CodeBlock } from '../components/code/CodeBlock';
import { EditorFrame } from '../components/code/Frames';
import { codeLines, LiveHtml } from '../components/tasks/Practice';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { cn } from '../lib/cn';

const COLORS = ['#7b5cff', '#ff5a5f', '#00a08a', '#0284c7', '#d63384', '#12a06a', '#e07b00', '#5b5bd6'];

/**
 * Кестені безендіру: сначала ученики смотрят на готовую таблицу («Тақтада не көріп тұрсыңдар?»),
 * затем учитель открывает код и по одному показывает caption, colspan, rowspan и атрибуты.
 */
export function AttrsSlide() {
  const [show, setShow] = useLessonState<boolean>('attrs.code', false);
  const [sel, setSel] = useLessonState<string | null>('attrs.sel', null);
  const item = T.items.find((i) => i.key === sel) ?? null;
  const lines = codeLines(T.code);
  const color = item ? COLORS[T.items.indexOf(item) % COLORS.length] : '#7b5cff';
  const rgb = hexRgb(color);
  const hit = (text: string) => {
    if (!item) return false;
    const t = text.toLowerCase();
    if (item.key === 'border') return /\sborder="/.test(t);
    return t.includes(item.match);
  };

  return (
    <div className="flex h-full flex-col px-[90px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        size="md"
        right={
          <button
            type="button"
            onClick={() => {
              playSound(show ? 'click' : 'reveal');
              setShow(!show);
            }}
            className={cn('btn-candy flex h-16 items-center gap-3 rounded-[20px] px-7 font-display text-[24px] font-bold', show ? 'bg-white text-snow' : 'bg-electric text-white')}
          >
            {show ? <EyeOff size={26} /> : <Code2 size={26} />} {show ? T.hideCode : T.showCode}
          </button>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2.5" data-no-swipe>
        <span className="mr-2 flex items-center gap-2 rounded-full border-[3px] border-ink bg-[rgb(var(--c-sun))] px-4 py-1.5 font-display text-[21px] font-bold">
          <MessageCircleQuestion size={24} /> {T.question}
        </span>
        {T.items.map((it, i) => {
          const on = sel === it.key;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => {
                playSound('pop');
                setSel(on ? null : it.key);
                if (!show) setShow(true);
              }}
              className="rounded-xl border-[3px] px-3.5 py-1 font-mono text-[20px] font-bold transition-colors"
              style={{ borderColor: COLORS[i], color: on ? '#fff' : COLORS[i], background: on ? COLORS[i] : '#fff' }}
            >
              {it.name}
            </button>
          );
        })}
      </div>

      <div className="mt-3 min-h-[64px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={item?.key ?? 'hint'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl px-5 py-2.5 text-[22px] font-semibold leading-snug"
            style={item ? { background: `rgb(${rgb} / 0.12)`, boxShadow: `inset 5px 0 0 ${color}` } : undefined}
          >
            {item ? item.text : <span className="font-normal text-snow/55">{T.hint}</span>}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={cn('mt-3 grid min-h-0 flex-1 gap-7 pb-6', show ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-1')}>
        <AnimatePresence>
          {show && (
            <motion.div key="code" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="min-h-0">
              <EditorFrame className="h-full" file="aj-01-26.html">
                <div className="h-full overflow-auto">
                  <CodeBlock lines={lines} fontSize={17} highlight={(l) => (hit(l.text) ? 2 : 0)} highlightColor={rgb} dimOthers={!!item} />
                </div>
              </EditorFrame>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div layout className="min-h-0">
          <LiveHtml html={T.code} fontSize={28} className="h-full" url="aj-01-26.html" />
        </motion.div>
      </div>
    </div>
  );
}

function hexRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
