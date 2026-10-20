import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck, Crown, Hand, Minus, Plus, Scale, Trophy, Users } from 'lucide-react';
import { teamWorkSlide as T } from '../data/lesson';
import { teams, type Team } from '../data/teams';
import { settings } from '../config/settings';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { Segmented } from '../components/ui/Segmented';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { Modal } from '../components/ui/Modal';
import { RichText } from '../components/ui/RichText';
import { Timer } from '../components/timer/Timer';
import { Burst } from '../components/animations/Burst';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { cn, hexToRgba } from '../lib/cn';

type Tab = 'tasks' | 'board';
type Scores = Record<Team['id'], number[]>;

const emptyScores = (): Scores => Object.fromEntries(teams.map((t) => [t.id, T.criteria.map(() => 0)])) as Scores;
const MAX_TOTAL = T.criteria.reduce((s, c) => s + c.points, 0);

export function TeamWorkSlide() {
  const [tab, setTab] = useLessonState<Tab>('teamwork.tab', 'tasks');
  const [open, setOpen] = useLessonState<number | null>('teamwork.open', null);
  const [scores, setScores] = useLessonState<Scores>('scores.values', emptyScores());
  const [winnerOpen, setWinnerOpen] = useState(false);

  const totals = teams.map((t) => (scores[t.id] ?? []).reduce((s, v) => s + v, 0));
  const best = Math.max(...totals);
  const leaders = best > 0 ? teams.filter((_, i) => totals[i] === best) : [];

  return (
    <div className="relative flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        right={
          <div className="flex items-center gap-6">
            <Segmented
              layoutId="team-tabs"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'tasks', label: T.tabs.tasks },
                { value: 'board', label: T.tabs.board },
              ]}
            />
            <Timer id="team" minutes={settings.timers.team} showPresets={false} />
          </div>
        }
      />

      <div className="mt-6 min-h-0 flex-1 pb-6">
        <AnimatePresence mode="wait">
          {tab === 'tasks' ? (
            <motion.div key="tasks" className="flex h-full gap-7" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {teams.map((team, i) => (
                <TaskCard
                  key={team.id}
                  team={team}
                  index={i}
                  open={open === i}
                  dimmed={open !== null && open !== i}
                  onToggle={() => {
                    playSound('flip');
                    setOpen(open === i ? null : i);
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div key="board" className="flex h-full flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={winnerOpen} onClose={() => setWinnerOpen(false)} width={1500}>
        <WinnerView leaders={leaders} best={best} />
      </Modal>
    </div>
  );
}

function TaskCard({ team, index, open, dimmed, onToggle }: { team: Team; index: number; open: boolean; dimmed: boolean; onToggle: () => void }) {
  const task = T.tasks[index];
  const Icon = team.icon;
  return (
    <motion.button
      type="button"
      layout
      onClick={onToggle}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: dimmed ? 0.6 : 1, y: 0 }}
      transition={{ layout: { type: 'spring', stiffness: 200, damping: 26 }, delay: open || dimmed ? 0 : 0.2 + index * 0.1 }}
      className="relative flex min-w-0 flex-col overflow-hidden rounded-[36px] p-8 text-left"
      style={{
        flex: open ? 2.3 : 1,
        background: `linear-gradient(160deg, ${hexToRgba(team.color, open ? 0.25 : 0.16)}, rgba(10,16,48,0.88) 60%)`,
        boxShadow: `inset 0 0 0 2px ${hexToRgba(team.color, open ? 0.8 : 0.35)}, 0 30px 80px -40px ${team.color}`,
      }}
    >
      <Icon size={300} strokeWidth={1.2} className="pointer-events-none absolute -bottom-12 -right-12" style={{ color: team.color, opacity: 0.07 }} />
      <motion.div layout="position" className="flex items-center gap-5">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px]" style={{ background: team.color, boxShadow: `0 0 40px ${hexToRgba(team.color, 0.6)}` }}>
          <Icon size={44} className="text-ink" />
        </span>
        <div className="min-w-0">
          <div className="font-display text-[20px] font-semibold uppercase tracking-[0.18em]" style={{ color: team.color }}>
            {team.number}-топ
          </div>
          <div className="font-display text-[30px] font-bold leading-tight text-white">{team.name}</div>
        </div>
      </motion.div>

      <motion.div layout="position" className="mt-7 font-display text-[44px] font-extrabold leading-tight text-white">
        «{task.title}»
      </motion.div>

      <AnimatePresence mode="popLayout">
        {open ? (
          <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.15 }} className="mt-5 grid flex-1 grid-cols-[1.25fr_1fr] gap-8">
            <div>
              <p className="text-[27px] leading-snug text-snow/90">{task.text}</p>
              <ul className="mt-5 space-y-3">
                {task.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3 text-[23px] leading-snug text-snow/85">
                    <CircleCheck size={26} className="mt-0.5 shrink-0" style={{ color: team.color }} />
                    <RichText text={r} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[26px] bg-white/[0.05] p-6">
              <div className="mb-4 flex items-center gap-3 font-display text-[24px] font-semibold">
                <Users size={28} style={{ color: team.color }} /> {T.rolesTitle}
              </div>
              <ul className="space-y-3">
                {T.roles.map((r) => (
                  <li key={r} className="rounded-xl bg-white/[0.06] px-4 py-2 text-[22px] text-snow/90">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex flex-1 flex-col">
            {!dimmed && <p className="text-[26px] leading-snug text-snow/75">{task.text}</p>}
            <div className="mt-auto flex items-center gap-3 text-[22px] text-snow/55">
              <Hand size={26} style={{ color: team.color }} />
              {T.tapToOpen}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
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
        background: `linear-gradient(170deg, ${hexToRgba(team.color, 0.18)}, rgba(10,16,48,0.88) 55%)`,
        boxShadow: leader ? `inset 0 0 0 3px ${team.color}, 0 0 60px -10px ${team.color}` : `inset 0 0 0 2px ${hexToRgba(team.color, 0.3)}`,
      }}
    >
      <AnimatePresence>
        {leader && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.5 }}
            className="absolute -top-6 left-1/2 flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-[18px] font-bold text-ink"
            style={{ x: '-50%', background: team.color, boxShadow: `0 0 30px ${team.color}` }}
          >
            <Crown size={22} /> {T.leader}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-[20px]" style={{ background: team.color }}>
          <Icon size={36} className="text-ink" />
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
          animate={{ scale: 1, color: '#ffffff' }}
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
