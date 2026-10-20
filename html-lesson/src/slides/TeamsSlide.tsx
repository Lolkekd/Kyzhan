import { useState } from 'react';
import { motion } from 'motion/react';
import { Hand, UserRound, Users } from 'lucide-react';
import { teamsSlide as T } from '../data/lesson';
import { teams, type Team } from '../data/teams';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';
import { hexToRgba } from '../lib/cn';

export function TeamsSlide() {
  const [revealed, setRevealed] = useLessonState<boolean[]>('teams.revealed', [false, false, false]);
  const [delays, setDelays] = useState<number[]>([0, 0, 0]);

  const revealOne = (i: number) => {
    if (revealed[i]) return;
    setDelays((d) => d.map((x, k) => (k === i ? 0 : x)));
    playSound('flip');
    setRevealed((r) => r.map((v, k) => (k === i ? true : v)));
  };

  const revealAll = () => {
    let n = 0;
    const d = revealed.map((v) => (v ? 0 : 0.55 * n++));
    setDelays(d);
    d.forEach((delay, i) => {
      if (!revealed[i]) window.setTimeout(() => playSound('flip'), delay * 1000);
    });
    setRevealed([true, true, true]);
  };

  return (
    <div className="flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        right={
          <div className="flex items-center gap-3">
            {!revealed.every(Boolean) && (
              <GlowButton icon={Users} onClick={revealAll} sound={null}>
                {T.revealAll}
              </GlowButton>
            )}
            <ConfirmButton compact onConfirm={() => setRevealed([false, false, false])} />
          </div>
        }
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center font-display text-[46px] font-bold tracking-tight"
      >
        <span className="text-gradient">{T.slogan}</span>
      </motion.div>

      <div className="mt-8 grid flex-1 grid-cols-3 gap-10 [perspective:1600px]">
        {teams.map((team, i) => (
          <TeamCard key={team.id} team={team} revealed={revealed[i]} delay={delays[i]} onReveal={() => revealOne(i)} index={i} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass mx-auto my-7 flex items-center gap-5 rounded-full py-3 pl-3 pr-8"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-amber/20 text-amber">
          <Hand size={30} className="animate-wave" />
        </span>
        <span className="font-display text-[24px] font-semibold text-amber">{T.greetingTitle}</span>
        <span className="h-6 w-px bg-white/20" />
        <span className="text-[23px] text-snow/80">{T.greetingText}</span>
      </motion.div>
    </div>
  );
}

function TeamCard({ team, revealed, delay, onReveal, index }: { team: Team; revealed: boolean; delay: number; onReveal: () => void; index: number }) {
  const Icon = team.icon;
  return (
    <motion.button
      type="button"
      onClick={onReveal}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.12 }}
      className="relative h-full w-full cursor-pointer text-left"
      aria-label={`${team.number}-топ`}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.9, delay, ease: [0.34, 1.3, 0.64, 1] }}
      >
        {/* Рубашка */}
        <div className="glass absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[36px] [backface-visibility:hidden]">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `linear-gradient(${hexToRgba(team.color, 0.25)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRgba(team.color, 0.25)} 1px, transparent 1px)`,
              backgroundSize: '44px 44px',
            }}
          />
          <div
            className="anim-pulse relative font-display text-[170px] font-black leading-none"
            style={{ color: team.color, textShadow: `0 0 60px ${team.color}`, ['--pulse' as string]: 1.08, ['--delay' as string]: `${index * 0.4}s` }}
          >
            ?
          </div>
          <div className="relative mt-4 font-display text-[34px] font-semibold text-snow/80">{team.number}-топ</div>
        </div>

        {/* Лицевая сторона */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[36px] px-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            background: `linear-gradient(160deg, ${hexToRgba(team.color, 0.28)}, rgba(10,16,48,0.85) 55%)`,
            boxShadow: `inset 0 0 0 2px ${hexToRgba(team.color, 0.6)}, 0 30px 80px -30px ${team.color}`,
          }}
        >
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full" style={{ background: `radial-gradient(circle, ${hexToRgba(team.color, 0.45)}, transparent 70%)` }} />
          <div className="relative">
            <span className="animate-pulse-ring absolute inset-0 rounded-[30px] border-2" style={{ borderColor: team.color }} />
            <div className="grid h-32 w-32 place-items-center rounded-[30px]" style={{ background: team.color, boxShadow: `0 0 60px ${team.color}` }}>
              <Icon size={68} className="text-ink" strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-7 font-display text-[24px] font-semibold uppercase tracking-[0.2em]" style={{ color: team.color }}>
            {team.number}-топ
          </div>
          <div className="mt-2 font-display text-[50px] font-bold leading-tight text-snow">{team.name}</div>
          <div className="mt-3 text-[28px] italic text-snow/75">«{team.motto}»</div>
          <div className="mt-7 flex items-center gap-1.5">
            {Array.from({ length: team.members }).map((_, k) => (
              <motion.span
                key={k}
                initial={{ scale: 0 }}
                animate={{ scale: revealed ? 1 : 0 }}
                transition={{ delay: delay + 0.6 + k * 0.05, type: 'spring' }}
              >
                <UserRound size={30} style={{ color: team.color }} />
              </motion.span>
            ))}
          </div>
          <div className="mt-2 text-[22px] text-snow/60">
            {team.members} {T.membersLabel}
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}
