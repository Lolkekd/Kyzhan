import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Feather, Keyboard, Link, Puzzle, Sparkles, Timer, Trophy, Volume2, X } from 'lucide-react';
import { groups, slides } from '../../config/slides';
import { settings } from '../../config/settings';
import { cn } from '../../lib/cn';
import { playSound } from '../../lib/sound';
import { lessonStore, useLesson } from '../../store/lessonStore';
import { ConfirmButton } from '../ui/ConfirmButton';
import { IconButton } from '../ui/GlowButton';
import { useNav } from './NavContext';

/** Панель учителя: быстрый переход к этапу, настройки и сброс результатов */
export function TeacherPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { index, goTo } = useNav();
  const sound = useLesson((s) => s.sound);
  const lite = useLesson((s) => s.lite);
  const plickersUrl = useLesson((s) => s.plickersUrl);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-ink/75 p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-no-swipe
        >
          <motion.div
            className="glass-strong relative grid h-full w-full grid-cols-[1fr_520px] gap-10 rounded-[40px] p-10"
            initial={{ y: 50, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Этапы */}
            <div className="flex min-h-0 flex-col">
              <div className="mb-2 font-display text-[40px] font-bold">Мұғалім панелі</div>
              <div className="mb-6 text-[19px] text-snow/50">Кезеңді таңдаңыз · Выберите этап для быстрого перехода</div>
              <div className="grid flex-1 grid-cols-5 content-start gap-4">
                {slides.map((s, i) => {
                  const g = groups.find((x) => x.id === s.group)!;
                  const cur = i === index;
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        goTo(i);
                        onClose();
                      }}
                      className={cn(
                        'flex h-[150px] flex-col justify-between rounded-[24px] border p-5 text-left transition-colors',
                        cur ? 'border-transparent bg-white/[0.14]' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.09]',
                      )}
                      style={{ boxShadow: cur ? `0 0 0 3px ${g.color}, 0 0 40px -10px ${g.color}` : 'none' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[30px] font-semibold" style={{ color: g.color }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="h-3 w-3 rounded-full" style={{ background: g.color }} />
                      </div>
                      <div className="font-display text-[20px] font-semibold leading-tight text-snow">{s.title}</div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center gap-3 text-[17px] text-snow/50">
                <Keyboard size={22} />
                <Kbd>←</Kbd>
                <Kbd>→</Kbd> слайдтар ·<Kbd>F</Kbd> толық экран ·<Kbd>T</Kbd> панель ·<Kbd>M</Kbd> дыбыс ·<Kbd>Home</Kbd>
                <Kbd>End</Kbd>
              </div>
            </div>

            {/* Настройки */}
            <div className="absolute right-8 top-8">
              <IconButton icon={X} label="Жабу (Esc)" onClick={onClose} size={60} />
            </div>
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1 pt-20">

              <Section title="Баптаулар" hint="Настройки">
                <Toggle icon={Volume2} label="Дыбыс эффектілері" hint="Звуковые эффекты" value={sound} onChange={(v) => lessonStore.update({ sound: v })} />
                <Toggle
                  icon={Feather}
                  label="Жеңіл режим"
                  hint="Для слабого компьютера: меньше эффектов"
                  value={lite}
                  onChange={(v) => lessonStore.update({ lite: v })}
                />
              </Section>

              <Section title="Plickers сілтемесі" hint="Ссылка на ваш тест в Plickers">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink/60 px-4">
                  <Link size={20} className="shrink-0 text-snow/40" />
                  <input
                    type="url"
                    value={plickersUrl}
                    onChange={(e) => lessonStore.update({ plickersUrl: e.target.value })}
                    placeholder={settings.plickersUrl}
                    className="h-14 min-w-0 flex-1 bg-transparent font-mono text-[17px] text-snow outline-none placeholder:text-snow/30"
                  />
                  <a href={plickersUrl || settings.plickersUrl} target="_blank" rel="noreferrer" title="Ашу" className="text-cyan">
                    <ExternalLink size={22} />
                  </a>
                </div>
              </Section>

              <Section title="Тазалау" hint="Сброс результатов (нажмите дважды для подтверждения)">
                <div className="grid grid-cols-2 gap-3">
                  <ConfirmButton icon={Puzzle} label="Пазл" onConfirm={() => lessonStore.resetPrefixes('puzzle.')} className="justify-center" />
                  <ConfirmButton icon={Trophy} label="Ұпайлар" onConfirm={() => lessonStore.resetPrefixes('scores.', 'teamwork.')} className="justify-center" />
                  <ConfirmButton icon={Timer} label="Таймерлер" onConfirm={() => lessonStore.resetPrefixes('timer:')} className="justify-center" />
                  <ConfirmButton icon={Sparkles} label="Plickers" onConfirm={() => lessonStore.resetPrefixes('plickers.')} className="justify-center" />
                </div>
                <ConfirmButton
                  label="Жаңа сабаққа дайындау"
                  confirmLabel="Барлығын тазалау?"
                  onConfirm={() => {
                    lessonStore.resetAll();
                    playSound('success');
                    onClose();
                  }}
                  className="mt-3 h-16 w-full justify-center border-rose/30 text-[20px] text-rose/90"
                />
                <div className="mt-2 text-[16px] text-snow/40">Полный сброс перед новым уроком</div>
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-5">
      <div className="font-display text-[24px] font-semibold">{title}</div>
      {hint && <div className="mb-4 text-[16px] text-snow/45">{hint}</div>}
      {children}
    </div>
  );
}

function Toggle({ icon: Icon, label, hint, value, onChange }: { icon: typeof Volume2; label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        onChange(!value);
        playSound('click');
      }}
      className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left hover:bg-white/[0.04]"
    >
      <Icon size={26} className={value ? 'text-cyan' : 'text-snow/40'} />
      <div className="flex-1">
        <div className="font-display text-[20px]">{label}</div>
        <div className="text-[15px] text-snow/45">{hint}</div>
      </div>
      <span className={cn('relative h-9 w-16 rounded-full transition-colors', value ? 'bg-cyan/80' : 'bg-white/15')}>
        <motion.span className="absolute top-1 h-7 w-7 rounded-full bg-white" animate={{ left: value ? 32 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </span>
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-lg border border-white/20 bg-white/[0.06] px-2 py-0.5 font-mono text-[16px] text-snow/80">{children}</kbd>;
}
