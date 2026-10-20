import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, Plus, Sparkles, Undo2, UsersRound } from 'lucide-react';
import { reflectionSlide as T } from '../data/lesson';
import { teams } from '../data/teams';
import { SlideHeader } from '../components/ui/SlideHeader';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { cn, hexToRgba } from '../lib/cn';

type LightId = (typeof T.lights)[number]['id'];
type Vote = LightId | null;
interface Note {
  id: number;
  name: string;
  text: string;
  light: LightId;
  question: number;
}

/** Сколько учеников в классе — по составу команд */
const SEATS = teams.reduce((n, t) => n + t.members, 0);
const ink = 'rgb(29 27 58)';
const lightById = (id: LightId) => T.lights.find((l) => l.id === id)!;

/**
 * Рефлексия «Бағдаршам» для всего класса.
 * Каждый ученик отмечает свой цвет (кнопка сигнала заполняет следующее свободное место, клик по номеру — меняет цвет),
 * а на «стене пікірлер» оставляет короткий ответ на один из вопросов. Всё сохраняется между слайдами.
 */
export function ReflectionSlide() {
  const [votes, setVotes] = useLessonState<Vote[]>('reflection.votes', Array(SEATS).fill(null));
  const [notes, setNotes] = useLessonState<Note[]>('reflection.notes', []);
  const [last, setLast] = useLessonState<LightId | null>('reflection.last', null);

  const counts = Object.fromEntries(T.lights.map((l) => [l.id, votes.filter((v) => v === l.id).length])) as Record<LightId, number>;
  const answered = votes.filter(Boolean).length;
  const reply = last ? lightById(last) : null;

  const addVote = (id: LightId) => {
    const i = votes.findIndex((v) => v === null);
    if (i < 0) return;
    playSound('bell');
    setVotes(votes.map((v, k) => (k === i ? id : v)));
    setLast(id);
  };
  const cycleSeat = (i: number) => {
    const order: Vote[] = [null, ...T.lights.map((l) => l.id)];
    const next = order[(order.indexOf(votes[i]) + 1) % order.length];
    playSound(next ? 'pop' : 'click');
    setVotes(votes.map((v, k) => (k === i ? next : v)));
    if (next) setLast(next);
  };
  const undo = () => {
    const i = votes.map((v) => v !== null).lastIndexOf(true);
    if (i < 0) return;
    playSound('minus');
    setVotes(votes.map((v, k) => (k === i ? null : v)));
  };

  return (
    <div className="flex h-full flex-col px-[90px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        right={
          <div className="chip">
            <Sparkles size={22} className="text-[#c26a00]" /> {T.method}
          </div>
        }
      />

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[230px_610px_1fr] gap-10 pb-6">
        {/* Светофор: каждое нажатие — голос следующего ученика */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 140, damping: 18 }}
          className="flex flex-col items-center justify-around rounded-[60px] border-4 border-ink bg-[#1d1b3a] py-6 shadow-[8px_8px_0_rgb(var(--c-electric))]"
        >
          {T.lights.map((l) => (
            <motion.button
              key={l.id}
              type="button"
              aria-label={`${l.label}: +1`}
              title={l.label}
              onClick={() => addVote(l.id)}
              disabled={answered >= SEATS}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="relative grid h-[150px] w-[150px] place-items-center rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 30%, #ffffffcc, ${l.color} 32%, ${hexToRgba(l.color, 0.9)} 72%)`,
                boxShadow: last === l.id ? `0 0 0 6px #fff, 0 0 50px 10px ${hexToRgba(l.color, 0.8)}` : `0 0 26px ${hexToRgba(l.color, 0.5)}`,
              }}
            >
              <motion.span
                key={counts[l.id]}
                initial={{ scale: 1.6 }}
                animate={{ scale: 1 }}
                className="font-display text-[56px] font-black text-white [text-shadow:3px_3px_0_rgb(29_27_58)]"
              >
                {counts[l.id]}
              </motion.span>
              <span className="absolute -right-2 -top-2 grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink bg-white text-snow">
                <Plus size={24} strokeWidth={3} />
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Класс: место каждого ученика + сводка */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex min-h-0 flex-col gap-4">
          <div className="glass rounded-[28px] px-6 py-4">
            <div className="flex items-baseline gap-3 font-display">
              <UsersRound size={30} className="self-center text-electric" />
              <span className="text-[44px] font-black tabular-nums">{answered}</span>
              <span className="text-[28px] font-semibold text-snow/50">/ {SEATS}</span>
              <span className="text-[24px] font-semibold text-snow/70">{T.answeredLabel}</span>
            </div>
            <div className="mt-3 flex h-6 overflow-hidden rounded-full border-[3px] border-ink bg-white">
              {T.lights.map((l) => (
                <motion.span key={l.id} className="h-full" animate={{ width: `${(counts[l.id] / SEATS) * 100}%` }} style={{ background: l.color }} />
              ))}
            </div>
            <div className="mt-3 flex gap-5 text-[20px]">
              {T.lights.map((l) => (
                <span key={l.id} className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-ink" style={{ background: l.color }} />
                  {answered ? Math.round((counts[l.id] / answered) * 100) : 0}%
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3">
            {votes.map((v, i) => {
              const c = v ? lightById(v).color : null;
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => cycleSeat(i)}
                  aria-label={`${i + 1}-оқушы`}
                  whileTap={{ scale: 0.88 }}
                  animate={{ scale: v ? [1.18, 1] : 1 }}
                  className={cn('grid h-[74px] place-items-center rounded-[22px] border-[3px] font-display text-[26px] font-bold', v ? 'border-ink text-white' : 'border-dashed border-ink/30 bg-white/70 text-snow/40')}
                  style={c ? { background: c, boxShadow: `4px 4px 0 ${ink}` } : undefined}
                >
                  {i + 1}
                </motion.button>
              );
            })}
          </div>

          <div className="relative min-h-[70px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={reply?.id ?? 'hint'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 rounded-[22px] px-5 py-3 font-display text-[23px] font-semibold"
                style={reply ? { color: reply.color, background: hexToRgba(reply.color, 0.12) } : undefined}
              >
                {reply ? (
                  <>
                    <Sparkles size={28} className="shrink-0" /> {reply.reply}
                  </>
                ) : (
                  <span className="font-body text-[21px] font-normal text-snow/55">
                    {T.addHint}. {T.seatsHint}.
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto flex gap-3">
            <button
              type="button"
              onClick={undo}
              disabled={!answered}
              className="glass flex h-12 items-center gap-2 rounded-2xl px-5 font-display text-[19px] font-semibold disabled:opacity-40"
            >
              <Undo2 size={20} /> {T.undo}
            </button>
            <ConfirmButton
              label={T.clear}
              onConfirm={() => {
                setVotes(Array(SEATS).fill(null));
                setLast(null);
              }}
            />
          </div>
        </motion.div>

        <NotesWall notes={notes} setNotes={setNotes} />
      </div>
    </div>
  );
}

/** «Пікірлер қабырғасы»: каждый ученик пишет короткий ответ на выбранный вопрос */
function NotesWall({ notes, setNotes }: { notes: Note[]; setNotes: (v: Note[] | ((p: Note[]) => Note[])) => void }) {
  const [question, setQuestion] = useLessonState<number>('reflection.question', 0);
  const [light, setLight] = useState<LightId>(T.lights[0].id);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  const add = () => {
    const t = text.trim();
    if (!t) return;
    playSound('pop');
    setNotes((p) => [...p, { id: Date.now(), name: name.trim(), text: t, light, question }]);
    setText('');
    setName('');
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass flex min-h-0 flex-col rounded-[32px] p-6" data-no-swipe>
      <div className="flex items-center gap-3 font-display text-[28px] font-bold">
        <MessageCircle size={30} className="text-rose" /> {T.wallTitle}
        <span className="ml-auto rounded-full border-[3px] border-ink bg-[rgb(var(--c-sun))] px-3 text-[20px]">
          {notes.length} {T.notesLabel}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {T.questions.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setQuestion(i)}
            className={cn(
              'flex-1 rounded-2xl border-[3px] px-3 py-2 text-left font-display text-[18px] font-semibold leading-tight transition-colors',
              question === i ? 'border-ink bg-electric text-white shadow-[3px_3px_0_rgb(var(--c-ink))]' : 'border-ink/25 bg-white text-snow/70',
            )}
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={T.namePlaceholder}
          maxLength={24}
          className="h-14 w-[150px] rounded-2xl border-[3px] border-ink/30 bg-white px-4 text-[20px] outline-none focus:border-ink"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={T.textPlaceholder}
          maxLength={90}
          className="h-14 min-w-0 flex-1 rounded-2xl border-[3px] border-ink/30 bg-white px-4 text-[20px] outline-none focus:border-ink"
        />
        {T.lights.map((l) => (
          <button
            key={l.id}
            type="button"
            title={l.label}
            aria-label={l.label}
            onClick={() => setLight(l.id)}
            className="h-10 w-10 shrink-0 rounded-full border-[3px] border-ink"
            style={{ background: l.color, boxShadow: light === l.id ? `0 0 0 4px #fff, 0 0 0 7px ${ink}` : undefined }}
          />
        ))}
        <button type="submit" disabled={!text.trim()} className="btn-candy h-14 shrink-0 rounded-2xl bg-electric px-5 font-display text-[20px] font-bold text-white disabled:opacity-40">
          {T.addNote}
        </button>
      </form>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-[22px] text-snow/45">{T.noNotes}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {[...notes].reverse().map((n, k) => {
                const l = lightById(n.light);
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: k % 2 ? 1.2 : -1.2 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="group relative rounded-[18px] border-[3px] border-ink px-4 py-3"
                    style={{ background: hexToRgba(l.color, 0.16), boxShadow: `4px 4px 0 ${l.color}` }}
                  >
                    <div className="text-[15px] font-semibold text-snow/55">{T.questions[n.question]}</div>
                    <div className="mt-1 text-[21px] font-semibold leading-snug">{n.text}</div>
                    {n.name && <div className="mt-1 text-[17px] text-snow/60">— {n.name}</div>}
                    <button
                      type="button"
                      aria-label="×"
                      onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))}
                      className="absolute -right-2 -top-2 hidden h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white text-[18px] leading-none group-hover:grid"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
