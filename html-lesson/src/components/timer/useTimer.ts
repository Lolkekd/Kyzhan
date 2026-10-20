import { useEffect, useState } from 'react';
import { lessonStore, useLessonState } from '../../store/lessonStore';
import { playSound } from '../../lib/sound';

export interface TimerState {
  duration: number; // секунд
  running: boolean;
  endsAt: number | null; // timestamp, когда таймер закончится (если запущен)
  remaining: number; // секунд (если на паузе)
  finished: boolean;
}

export const timerKey = (id: string) => `timer:${id}`;
const MIN = 60;
const MAX = 60 * 60;

/**
 * Таймер хранит время окончания (endsAt), поэтому продолжает идти,
 * даже если учитель переключился на другой слайд.
 */
export function useTimer(id: string, defaultMinutes: number) {
  const initial: TimerState = {
    duration: defaultMinutes * 60,
    running: false,
    endsAt: null,
    remaining: defaultMinutes * 60,
    finished: false,
  };
  const [t, setT] = useLessonState<TimerState>(timerKey(id), initial);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!t.running) return;
    const iv = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(iv);
  }, [t.running]);

  const remaining = t.running && t.endsAt ? Math.max(0, (t.endsAt - now) / 1000) : t.remaining;

  return {
    ...t,
    remaining,
    progress: t.duration > 0 ? remaining / t.duration : 0,
    start() {
      setT((p) => {
        const rem = p.finished || p.remaining <= 0 ? p.duration : p.remaining;
        return { ...p, running: true, finished: false, remaining: rem, endsAt: Date.now() + rem * 1000 };
      });
      setNow(Date.now());
    },
    pause() {
      setT((p) => ({
        ...p,
        running: false,
        endsAt: null,
        remaining: p.endsAt ? Math.max(0, (p.endsAt - Date.now()) / 1000) : p.remaining,
      }));
    },
    reset() {
      setT((p) => ({ ...p, running: false, endsAt: null, remaining: p.duration, finished: false }));
    },
    adjust(deltaSec: number) {
      setT((p) => {
        const duration = Math.min(MAX, Math.max(MIN, p.duration + deltaSec));
        const applied = duration - p.duration;
        if (p.running && p.endsAt) {
          const endsAt = Math.max(Date.now() + 1000, p.endsAt + applied * 1000);
          return { ...p, duration, endsAt };
        }
        if (p.finished) return { ...p, duration, remaining: duration, finished: false };
        return { ...p, duration, remaining: Math.max(0, Math.min(duration, p.remaining + applied)) };
      });
    },
    setMinutes(min: number) {
      setT((p) => ({ ...p, duration: min * 60, remaining: min * 60, running: false, endsAt: null, finished: false }));
    },
  };
}

/** Глобальный «наблюдатель»: завершает таймеры и подаёт сигнал, на каком бы слайде ни был учитель */
export function useTimerWatcher() {
  useEffect(() => {
    const iv = window.setInterval(() => {
      const { kv } = lessonStore.get();
      for (const [key, value] of Object.entries(kv)) {
        if (!key.startsWith('timer:')) continue;
        const t = value as TimerState;
        if (t.running && t.endsAt && t.endsAt <= Date.now()) {
          lessonStore.setKV(key, { ...t, running: false, endsAt: null, remaining: 0, finished: true });
          lessonStore.setKV('ui.timerAlert', { id: key.slice('timer:'.length), at: Date.now() });
          playSound('alarm');
        }
      }
    }, 400);
    return () => window.clearInterval(iv);
  }, []);
}
