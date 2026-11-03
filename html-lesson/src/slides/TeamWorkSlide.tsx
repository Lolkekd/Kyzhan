import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck, Crown, Eye, Minus, Plus, RotateCcw, Scale, Search, Trophy } from 'lucide-react';
import { teamWorkSlide as T } from '../data/lesson';
import { teams, type Team } from '../data/teams';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { Modal } from '../components/ui/Modal';
import { Timer } from '../components/timer/Timer';
import { Burst } from '../components/animations/Burst';
import { CodeBlock } from '../components/code/CodeBlock';
import { EditorFrame } from '../components/code/Frames';
import { LiveHtml, SubtaskTabs } from '../components/tasks/Practice';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { cn, hexToRgba } from '../lib/cn';

type Scores = Record<Team['id'], number[]>;

const emptyScores = (): Scores => Object.fromEntries(teams.map((t) => [t.id, T.criteria.map(() => 0)])) as Scores;
const MAX_TOTAL = T.criteria.reduce((s, c) => s + c.points, 0);

export function TeamWorkSlide() {
  const [tab, setTab] = useLessonState<string>('teamwork.tab2', T.tabs[0].id);
  const cur = T.tabs.find((t) => t.id === tab) ?? T.tabs[0];

  return (
    <div className="relative flex h-full flex-col px-[100px] pt-6">
      <SlideHeader eyebrow={T.eyebrow} title={T.title} right={cur.id !== 'board' && <Timer key={cur.id} id={`team-${cur.id}`} minutes={cur.minutes} showPresets={false} />} />
      <div className="mt-4">
        <SubtaskTabs items={T.tabs} value={tab} onChange={setTab} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={cur.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="mt-5 min-h-0 flex-1 pb-6">
          {cur.id === '3.1' && <MixedCode />}
          {cur.id === '3.2' && <Detectives />}
          {cur.id === '3.3' && <Quest />}
          {cur.id === 'board' && <Board />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Мақсаты / Барысы / Топтың міндеті */
function Brief({ title, goal, process, task }: { title: string; goal: string; process: string; task: string }) {
  const row = (label: string, text: string, color: string) => (
    <div>
      <div className="font-display text-[19px] font-bold uppercase tracking-[0.14em]" style={{ color }}>
        {label}
      </div>
      <div className="mt-1 text-[23px] leading-snug">{text}</div>
    </div>
  );
  return (
    <div className="glass flex min-h-0 flex-col gap-5 rounded-[30px] p-7">
      <div className="font-display text-[34px] font-black">{title}</div>
      {row(T.goalLabel, goal, '#7b5cff')}
      {row(T.processLabel, process, '#d6303a')}
      {row(T.taskLabel, task, '#00897b')}
    </div>
  );
}

/** 3.1 «Аралас код»: демонстрация на доске — собрать кесінділер по порядку */
function MixedCode() {
  const M = T.mixed;
  const order = [5, 2, 7, 0, 3, 6, 1, 4];
  const [placed, setPlaced] = useLessonState<number>('teamwork.mixed', 0);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = placed >= M.pieces.length;
  const indent = (p: string) => (p.startsWith('<table') || p === '</table>' ? 0 : p === '<tr>' || p === '</tr>' ? 1 : 2);

  const tap = (i: number) => {
    if (i === placed) {
      playSound(i + 1 === M.pieces.length ? 'success' : 'pop');
      setPlaced(placed + 1);
    } else {
      playSound('minus');
      setWrong(i);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <div className="grid h-full grid-cols-[560px_1fr] gap-7">
      <Brief title={M.title} goal={M.goal} process={M.process} task={M.task} />
      <div className="glass flex min-h-0 flex-col rounded-[30px] p-6" data-no-swipe>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="font-display text-[26px] font-bold">{M.demoTitle}</div>
            <div className={cn('text-[19px]', done ? 'font-semibold text-mint' : 'text-snow/55')}>{done ? 'Дұрыс! Кесте дайын.' : M.demoHint}</div>
          </div>
          <button type="button" onClick={() => setPlaced(0)} aria-label="Қайта бастау" className="grid h-12 w-12 place-items-center rounded-xl border-[3px] border-ink bg-white hover:bg-[rgb(var(--c-sun))]">
            <RotateCcw size={22} />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {order
            .filter((i) => i >= placed)
            .map((i) => (
              <motion.button
                key={i}
                type="button"
                layout
                onClick={() => tap(i)}
                animate={wrong === i ? { x: [0, -10, 10, -6, 6, 0], rotate: 0 } : { x: 0, rotate: (i % 3) - 1 }}
                className={cn('rounded-lg border-[3px] px-4 py-2 font-mono text-[24px] font-semibold', wrong === i ? 'border-rose bg-rose/15' : 'border-ink bg-[#fff1c9] shadow-[3px_3px_0_rgb(var(--c-ink))] hover:bg-[rgb(var(--c-sun))]')}
              >
                {M.pieces[i]}
              </motion.button>
            ))}
        </div>
        <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-5">
          <EditorFrame>
            <CodeBlock lines={M.pieces.slice(0, placed).map((p) => ({ text: p, indent: indent(p) }))} fontSize={24} />
          </EditorFrame>
          {done ? <LiveHtml html={M.pieces.join('')} fontSize={48} /> : <div className="grid place-items-center rounded-[28px] border-[3px] border-dashed border-ink/25 bg-white/60 font-display text-[80px] font-black text-ink/15">?</div>}
        </div>
      </div>
    </div>
  );
}

/** 3.2 «IT детективтері»: найти 5 ошибок в коде */
function Detectives() {
  const D = T.detective;
  const errIdx = D.lines.map((l, i) => (l.fix ? i : -1)).filter((i) => i >= 0);
  const [found, setFound] = useLessonState<number[]>('teamwork.detective', []);
  const [miss, setMiss] = useState<number | null>(null);
  const lines = D.lines.map((l, i) => ({ text: found.includes(i) && l.fix ? l.fix.trimStart() : l.text.trimStart(), indent: Math.floor((l.text.match(/^ */)![0].length) / 2) }));

  const click = (i: number) => {
    if (found.includes(i)) return;
    if (D.lines[i].fix) {
      playSound(found.length + 1 === errIdx.length ? 'success' : 'pop');
      setFound([...found, i]);
    } else {
      playSound('minus');
      setMiss(i);
      window.setTimeout(() => setMiss(null), 600);
    }
  };

  return (
    <div className="grid h-full grid-cols-[480px_1fr_430px] gap-6">
      <Brief title={D.title} goal={D.goal} process={D.process} task={D.task} />
      <div className="flex min-h-0 flex-col" data-no-swipe>
        <div className="mb-3 flex items-center gap-2 text-[19px] text-snow/60">
          <Search size={22} /> {D.hint}
        </div>
        <EditorFrame className="min-h-0 flex-1" file="tauarlar.html">
          <CodeBlock
            lines={lines}
            fontSize={23}
            onLineClick={(_, i) => click(i)}
            highlight={(_, i) => (found.includes(i) ? 2 : miss === i ? 1 : 0)}
            highlightColor={miss !== null ? '255 90 95' : '52 211 153'}
          />
        </EditorFrame>
      </div>
      <div className="glass flex min-h-0 flex-col rounded-[30px] p-6">
        <div className="font-display text-[22px] font-bold">{D.found}</div>
        <div className="mt-1 font-display text-[64px] font-black leading-none">
          {found.length}
          <span className="text-[34px] text-snow/40"> / {errIdx.length}</span>
        </div>
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          <AnimatePresence>
            {[...found].sort((a, b) => a - b).map((i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-[18px] leading-snug">
                <CircleCheck size={22} className="mt-0.5 shrink-0 text-mint" />
                <span>
                  <b>{i + 1}-жол:</b> {D.lines[i].why}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-3 flex gap-2">
          <GlowButton size="sm" variant="success" icon={Eye} className="flex-1" onClick={() => setFound(errIdx)}>
            {D.showAll}
          </GlowButton>
          <button type="button" onClick={() => setFound([])} aria-label={D.reset} className="grid h-12 w-12 place-items-center rounded-xl border-[3px] border-ink bg-white hover:bg-[rgb(var(--c-sun))]">
            <RotateCcw size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** 3.3 Квест: 5 сұрақ, жауап басқанда ашылады */
function Quest() {
  const Q = T.quest;
  const [open, setOpen] = useLessonState<number[]>('teamwork.quest', []);
  const colors = ['#7b5cff', '#ff5a5f', '#00a08a', '#e69500', '#d63384'];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-4 text-[22px]">
        <span className="font-display text-[26px] font-bold">{Q.title}</span>
        <span className="text-snow/60">{Q.text}</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-5 gap-5">
        {Q.questions.map((it, i) => {
          const on = open.includes(i);
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => {
                playSound(on ? 'click' : 'flip');
                setOpen(on ? open.filter((x) => x !== i) : [...open, i]);
              }}
              whileHover={{ y: -4 }}
              className="flex flex-col rounded-[28px] border-[3px] border-ink p-5 text-left"
              style={{ background: on ? hexToRgba(colors[i], 0.16) : '#ffffff', boxShadow: `6px 6px 0 ${colors[i]}` }}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-ink font-display text-[28px] font-black text-white" style={{ background: colors[i] }}>
                {i + 1}
              </span>
              <span className="mt-4 font-display text-[25px] font-bold leading-snug">{it.q}</span>
              <AnimatePresence>
                {on ? (
                  <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-auto rounded-2xl bg-white px-4 py-3 text-[20px] font-semibold leading-snug" style={{ boxShadow: `inset 4px 0 0 ${colors[i]}` }}>
                    {it.a}
                  </motion.span>
                ) : (
                  <span className="mt-auto text-[17px] text-snow/45">{Q.hint}</span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/** Ұпай тақтасы */
function Board() {
  const [scores, setScores] = useLessonState<Scores>('scores.values2', emptyScores());
  const [winnerOpen, setWinnerOpen] = useState(false);
  const totals = teams.map((t) => (scores[t.id] ?? []).reduce((s, v) => s + v, 0));
  const best = Math.max(...totals);
  const leaders = best > 0 ? teams.filter((_, i) => totals[i] === best) : [];
  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1 grid-cols-3 gap-7">
        {teams.map((team, i) => (
          <ScorePanel
            key={team.id}
            team={team}
            values={scores[team.id] ?? T.criteria.map(() => 0)}
            total={totals[i]}
            leader={leaders.length === 1 && leaders[0].id === team.id}
            onChange={(ci, delta) => {
              const cur = (scores[team.id] ?? T.criteria.map(() => 0))[ci];
              const nextVal = Math.max(0, Math.min(T.criteria[ci].points, cur + delta));
              if (nextVal === cur) return;
              playSound(delta > 0 ? 'plus' : 'minus');
              setScores((s) => {
                const arr = [...(s[team.id] ?? T.criteria.map(() => 0))];
                arr[ci] = nextVal;
                return { ...s, [team.id]: arr };
              });
            }}
          />
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-4">
        <GlowButton size="lg" icon={Trophy} sound="reveal" onClick={() => setWinnerOpen(true)}>
          {T.winnerButton}
        </GlowButton>
        <ConfirmButton label="Ұпайларды тазалау" onConfirm={() => setScores(emptyScores())} />
      </div>
      <Modal open={winnerOpen} onClose={() => setWinnerOpen(false)} width={1500}>
        <WinnerView leaders={leaders} best={best} />
      </Modal>
    </div>
  );
}

function ScorePanel({ team, values, total, leader, onChange }: { team: Team; values: number[]; total: number; leader: boolean; onChange: (criterion: number, delta: number) => void }) {
  const Icon = team.icon;
  const [floats, setFloats] = useState<{ id: number; ci: number; d: number }[]>([]);
  const fid = useRef(0);

  const change = (ci: number, d: number) => {
    const before = values[ci];
    onChange(ci, d);
    const after = Math.max(0, Math.min(T.criteria[ci].points, before + d));
    if (after === before) return;
    const id = ++fid.current;
    setFloats((f) => [...f, { id, ci, d }]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
  };

  return (
    <div
      className="relative flex flex-col rounded-[36px] p-7"
      style={{
        background: `linear-gradient(170deg, ${hexToRgba(team.color, 0.22)}, #ffffff 55%)`,
        boxShadow: leader ? `inset 0 0 0 4px rgb(29 27 58), 8px 8px 0 ${team.color}` : `inset 0 0 0 3px rgb(29 27 58), 5px 5px 0 rgb(29 27 58)`,
      }}
    >
      <AnimatePresence>
        {leader && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.5 }}
            className="absolute -top-6 left-1/2 flex items-center gap-2 rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-[18px] font-bold text-white"
            style={{ x: '-50%', background: team.color }}
          >
            <Crown size={22} /> {T.leader}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-[20px]" style={{ background: team.color }}>
          <Icon size={36} className="text-white" />
        </span>
        <div className="min-w-0">
          <div className="font-display text-[18px] uppercase tracking-[0.18em]" style={{ color: team.color }}>
            {team.number}-топ
          </div>
          <div className="truncate font-display text-[28px] font-bold">{team.name}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <motion.span
          key={total}
          initial={{ scale: 1.35, color: team.color }}
          animate={{ scale: 1, color: '#1d1b3a' }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="origin-bottom-left font-display text-[96px] font-extrabold leading-none tabular-nums"
        >
          {total}
        </motion.span>
        <span className="mb-3 text-[26px] text-snow/45">
          / {MAX_TOTAL} {T.points}
        </span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full" style={{ background: team.color, boxShadow: `0 0 16px ${team.color}` }} animate={{ width: `${(total / MAX_TOTAL) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>

      <div className="mt-5 flex flex-1 flex-col justify-between gap-3">
        {T.criteria.map((c, ci) => (
          <div key={ci} className="relative flex items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-2.5">
            <span className="flex-1 text-[21px] leading-tight text-snow/85">{c.text}</span>
            <button type="button" aria-label="−1" onClick={() => change(ci, -1)} className="grid h-12 w-12 place-items-center rounded-xl bg-white/[0.08] text-snow/80 transition hover:bg-white/[0.16] active:scale-90">
              <Minus size={24} />
            </button>
            <span className="w-[70px] text-center font-display text-[30px] font-bold tabular-nums">
              {values[ci]}
              <span className="text-[18px] text-snow/40">/{c.points}</span>
            </span>
            <button
              type="button"
              aria-label="+1"
              onClick={() => change(ci, 1)}
              className="grid h-12 w-12 place-items-center rounded-xl text-ink transition hover:brightness-110 active:scale-90"
              style={{ background: team.color }}
            >
              <Plus size={24} />
            </button>
            <AnimatePresence>
              {floats
                .filter((f) => f.ci === ci)
                .map((f) => (
                  <motion.span
                    key={f.id}
                    initial={{ opacity: 1, y: 0, scale: 0.8 }}
                    animate={{ opacity: 0, y: -60, scale: 1.3 }}
                    transition={{ duration: 0.9 }}
                    className={cn('pointer-events-none absolute right-6 top-0 font-display text-[32px] font-extrabold', f.d > 0 ? '' : 'text-rose')}
                    style={f.d > 0 ? { color: team.color } : undefined}
                  >
                    {f.d > 0 ? '+1' : '−1'}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinnerView({ leaders, best }: { leaders: Team[]; best: number }) {
  if (leaders.length === 0) {
    return <div className="py-16 text-center font-display text-[40px] text-snow/70">{T.noScores}</div>;
  }
  const tie = leaders.length > 1;
  return (
    <div className="relative flex flex-col items-center pb-6 text-center">
      <Burst count={50} radius={600} />
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="mb-4">
        {tie ? <Scale size={110} className="text-amber" /> : <Crown size={120} style={{ color: leaders[0].color, filter: `drop-shadow(0 0 30px ${leaders[0].color})` }} />}
      </motion.div>
      <div className="font-display text-[28px] uppercase tracking-[0.3em] text-snow/60">{tie ? T.tieTitle : T.winnerTitle}</div>
      {tie && <div className="mt-2 text-[24px] text-snow/60">{T.tieText}</div>}
      <div className={cn('mt-6 flex justify-center', tie ? 'flex-nowrap gap-4' : 'gap-6')}>
        {leaders.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={cn('flex items-center rounded-[30px]', tie ? 'gap-4 px-5 py-4' : 'gap-5 px-8 py-5')}
              style={{ background: hexToRgba(t.color, 0.15), boxShadow: `inset 0 0 0 2px ${t.color}` }}
            >
              <span className={cn('grid shrink-0 place-items-center rounded-[22px]', tie ? 'h-16 w-16' : 'h-20 w-20')} style={{ background: t.color }}>
                <Icon size={tie ? 36 : 44} className="text-ink" />
              </span>
              <div className="text-left">
                <div className="font-display text-[22px]" style={{ color: t.color }}>
                  {t.number}-топ
                </div>
                <div className={cn('font-display font-extrabold leading-tight', tie ? 'text-[32px]' : 'text-[44px]')}>{t.name}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-8 font-display text-[36px] font-bold text-amber">
        {best} {T.points}
      </div>
    </div>
  );
}
