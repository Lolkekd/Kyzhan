import { useCallback, useSyncExternalStore } from 'react';
import { settings } from '../config/settings';

/**
 * Единое хранилище состояния урока.
 * Всё (текущий слайд, пазл, баллы, таймеры, открытые ответы) сохраняется в localStorage,
 * поэтому при переходе между слайдами и даже при случайной перезагрузке страницы ничего не теряется.
 * Полный сброс — в панели учителя («Жаңа сабаққа дайындау»).
 */

const STORAGE_KEY = 'html-lesson:v1';

export interface LessonState {
  slide: number;
  sound: boolean;
  lite: boolean;
  plickersUrl: string;
  /** Состояние интерактивных элементов: ключ → значение */
  kv: Record<string, unknown>;
}

const defaults: LessonState = {
  slide: 0,
  sound: settings.soundEnabledByDefault,
  lite: false,
  plickersUrl: settings.plickersUrl,
  kv: {},
};

function load(): LessonState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<LessonState>;
    return { ...defaults, ...parsed, kv: { ...(parsed.kv ?? {}) } };
  } catch {
    return defaults;
  }
}

let state: LessonState = load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function persist() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* localStorage недоступен — работаем без сохранения */
    }
  }, 150);
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const lessonStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  update(patch: Partial<LessonState> | ((s: LessonState) => Partial<LessonState>)) {
    const p = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...p };
    emit();
  },
  setKV(key: string, value: unknown) {
    state = { ...state, kv: { ...state.kv, [key]: value } };
    emit();
  },
  /** Сбросить все ключи, начинающиеся с указанных префиксов */
  resetPrefixes(...prefixes: string[]) {
    const kv = Object.fromEntries(
      Object.entries(state.kv).filter(([k]) => !prefixes.some((p) => k.startsWith(p))),
    );
    state = { ...state, kv };
    emit();
  },
  /** Полный сброс результатов (настройки — звук, ссылка Plickers — сохраняются) */
  resetAll() {
    state = { ...state, kv: {}, slide: 0 };
    emit();
  },
};

export function useLesson<T>(selector: (s: LessonState) => T): T {
  return useSyncExternalStore(lessonStore.subscribe, () => selector(lessonStore.get()));
}

type SetStateAction<T> = T | ((prev: T) => T);

/** Как useState, но значение живёт в общем хранилище урока и не теряется при смене слайдов */
export function useLessonState<T>(key: string, initial: T): [T, (v: SetStateAction<T>) => void] {
  const value = useSyncExternalStore(lessonStore.subscribe, () => lessonStore.get().kv[key]) as T | undefined;
  const set = useCallback(
    (v: SetStateAction<T>) => {
      const prev = (lessonStore.get().kv[key] as T | undefined) ?? initial;
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      lessonStore.setKV(key, next);
    },
    // initial намеренно не в зависимостях: это значение по умолчанию
    [key],
  );
  return [value === undefined ? initial : value, set];
}
