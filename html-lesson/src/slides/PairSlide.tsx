import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, PartyPopper, RotateCcw } from 'lucide-react';
import { pairSlide as T } from '../data/lesson';
import { SlideHeader } from '../components/ui/SlideHeader';
import { Timer } from '../components/timer/Timer';
import { HtmlCode, LiveHtml, Reveal, SubtaskTabs, TaskCard } from '../components/tasks/Practice';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { cn, hexToRgba } from '../lib/cn';

const PAIR_COLORS = ['#7b5cff', '#ff5a5f', '#00a08a', '#e69500', '#d63384', '#0284c7', '#12a06a'];

/** Детерминированное перемешивание (одинаковое при каждом открытии) */
function shuffled<T>(arr: T[], seed: number): number[] {
  const idx = arr.map((_, i) => i);
  let s = seed;
  for (let i = idx.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/** Жұптық жұмыс: 2.1 — две игры LearningApps прямо в презентации, 2.2 — веб-парақша */
export function PairSlide() {
  const [tab, setTab] = useLessonState<string>('pair.tab', T.tabs[0].id);
  const cur = T.tabs.find((t) => t.id === tab) ?? T.tabs[0];

  return (
    <div className="relative flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} right={<Timer key={cur.id} id={`pair-${cur.id}`} minutes={cur.minutes} showPresets={false} />} />
      <div className="mt-4">
        <SubtaskTabs items={T.tabs} value={tab} onChange={setTab} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={cur.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="mt-5 min-h-0 flex-1 pb-6">
          {cur.id === '2.1' ? (
            <div className="grid h-full grid-cols-[700px_1fr] gap-7">
              <OrderGame />
              <MatchGame />
            </div>
          ) : (
            <WebTask />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function GameHeader({ title, hint, link, done, onReset }: { title: string; hint: string; link: string; done: boolean; onReset: () => void }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="font-display text-[23px] font-bold leading-tight">{title}</div>
        <div className={cn('mt-1 text-[18px]', done ? 'font-semibold text-mint' : 'text-snow/55')}>{done ? T.doneLabel : hint}</div>
      </div>
      <a href={link} target="_blank" rel="noreferrer" title="LearningApps (интернет керек)" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-white text-snow hover:bg-[rgb(var(--c-sun))]">
        <ExternalLink size={20} />
      </a>
      <button type="button" onClick={onReset} title={T.restart} aria-label={T.restart} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-white text-snow hover:bg-[rgb(var(--c-sun))]">
        <RotateCcw size={20} />
      </button>
    </div>
  );
}

/** 1-сурет: элементы HTML-документа по порядку */
function OrderGame() {
  const items = T.order.items;
  const order = shuffled(items, 7);
  const [placed, setPlaced] = useLessonState<number>('pair.order', 0);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = placed >= items.length;

  const tap = (i: number) => {
    if (i === placed) {
      playSound(placed + 1 === items.length ? 'success' : 'pop');
      setPlaced(placed + 1);
    } else {
      playSound('minus');
      setWrong(i);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <div className="glass flex min-h-0 flex-col rounded-[30px] p-5" data-no-swipe>
      <GameHeader title={T.order.title} hint={T.order.hint} link={T.order.link} done={done} onReset={() => setPlaced(0)} />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_250px] gap-4">
        <div className="relative flex flex-col justify-between">
          <span className="absolute bottom-3 left-[23px] top-3 w-[4px] rounded-full bg-ink/15" />
          {items.map((it, i) => (
            <div key={i} className="relative flex items-center gap-3">
              <span className={cn('z-10 grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border-[3px] font-display text-[20px] font-bold', i < placed ? 'border-ink bg-electric text-white' : 'border-ink/25 bg-white text-snow/40')}>
                {i + 1}
              </span>
              <AnimatePresence>
                {i < placed && (
                  <motion.span initial={{ opacity: 0, x: 40, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} className="truncate rounded-xl border-[3px] border-ink bg-white px-3 py-1 font-mono text-[19px] font-semibold shadow-[3px_3px_0_rgb(var(--c-ink))]">
                    {it}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center gap-2">
          {done ? (
            <div className="grid place-items-center gap-3 text-center">
              <PartyPopper size={64} className="text-mint" />
            </div>
          ) : (
            order
              .filter((i) => i >= placed)
              .map((i) => (
                <motion.button
                  key={i}
                  type="button"
                  layout
                  onClick={() => tap(i)}
                  animate={wrong === i ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className={cn('rounded-xl border-[3px] px-3 py-1.5 text-left font-mono text-[17px] font-semibold leading-tight', wrong === i ? 'border-rose bg-rose/15' : 'border-ink bg-[#fff1c9] hover:bg-[rgb(var(--c-sun))]')}
                >
                  {items[i]}
                </motion.button>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

/** 2-сурет: элемент ↔ сипаттама */
function MatchGame() {
  const pairs = T.match.pairs;
  const right = shuffled(pairs, 3);
  const [matched, setMatched] = useLessonState<number[]>('pair.match', []);
  const [sel, setSel] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = matched.length === pairs.length;
  const colorOf = (i: number) => PAIR_COLORS[matched.indexOf(i) % PAIR_COLORS.length];

  const pickRight = (i: number) => {
    if (sel === null || matched.includes(i)) return;
    if (i === sel) {
      playSound(matched.length + 1 === pairs.length ? 'success' : 'pop');
      setMatched([...matched, i]);
      setSel(null);
    } else {
      playSound('minus');
      setWrong(i);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <div className="glass flex min-h-0 flex-col rounded-[30px] p-5" data-no-swipe>
      <GameHeader
        title={T.match.title}
        hint={T.match.hint}
        link={T.match.link}
        done={done}
        onReset={() => {
          setMatched([]);
          setSel(null);
        }}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[190px_1fr] gap-x-4">
        <div className="flex flex-col justify-between gap-2">
          {pairs.map(([term], i) => {
            const ok = matched.includes(i);
            return (
              <button
                key={i}
                type="button"
                disabled={ok}
                onClick={() => {
                  playSound('click');
                  setSel(sel === i ? null : i);
                }}
                className={cn('flex-1 rounded-xl border-[3px] border-ink px-3 font-mono text-[21px] font-bold transition-colors', ok ? 'text-white' : sel === i ? 'bg-electric text-white shadow-[3px_3px_0_rgb(var(--c-ink))]' : 'bg-white hover:bg-[rgb(var(--c-sun))]')}
                style={ok ? { background: colorOf(i) } : undefined}
              >
                {term}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col justify-between gap-2">
          {right.map((i) => {
            const ok = matched.includes(i);
            return (
              <motion.button
                key={i}
                type="button"
                disabled={ok}
                onClick={() => pickRight(i)}
                animate={wrong === i ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={cn('flex flex-1 items-center rounded-xl border-[3px] px-3 text-left text-[17px] font-semibold leading-tight', ok ? 'border-ink' : wrong === i ? 'border-rose bg-rose/15' : 'border-ink/30 bg-white hover:border-ink')}
                style={ok ? { background: hexToRgba(colorOf(i), 0.18), boxShadow: `inset 6px 0 0 ${colorOf(i)}` } : undefined}
              >
                {ok && <span className="mr-2 shrink-0 font-mono font-bold" style={{ color: colorOf(i) }}>{pairs[i][0]} →</span>}
                {pairs[i][1]}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 2.2: набрать код и открыть как веб-страницу */
function WebTask() {
  const [open, setOpen] = useLessonState<boolean>('pair.webAnswer', false);
  return (
    <div className="grid h-full grid-cols-[1fr_900px] gap-7">
      <TaskCard code="2.2-тапсырма" mode={T.web.mode} text={T.web.text}>
        <div className="mt-4 font-display text-[20px] font-semibold uppercase tracking-[0.12em] text-snow/55">{T.web.targetLabel}</div>
        <div className="mt-3 min-h-0 flex-1">
          <LiveHtml html={T.web.code} fontSize={30} className="h-full" />
        </div>
      </TaskCard>
      <Reveal open={open} onToggle={() => setOpen(!open)} showLabel={T.showAnswer} hideLabel={T.hideAnswer}>
        <HtmlCode code={T.web.code} fontSize={16} className="h-full" />
      </Reveal>
    </div>
  );
}
