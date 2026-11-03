import * as lesson from '../data/lesson';
import { teams } from '../data/teams';
import { settings } from '../config/settings';

/**
 * Данные заданий, которые можно менять в редакторе.
 * Объекты из data/lesson.ts меняются «на месте», поэтому все слайды (и их логика проверки ответов)
 * сразу работают с новыми текстами — код слайдов не трогаем.
 */
type Obj = Record<string, unknown>;

export const CONTENT: Record<string, Obj | unknown[]> = {
  ...(Object.fromEntries(Object.entries(lesson).filter(([, v]) => v && typeof v === 'object')) as Record<string, Obj>),
  teams: teams as unknown as unknown[],
  settings: settings as unknown as Obj,
};

/** Какие наборы данных относятся к слайду */
export const SLIDE_CONTENT: Record<string, string[]> = {
  title: ['titleSlide', 'settings'],
  mood: ['moodSlide'],
  teams: ['teamsSlide', 'teams'],
  plickers: ['plickersSlide'],
  puzzle: ['puzzleSlide'],
  goals: ['goalsSlide'],
  'ai-video': ['aiVideoSlide'],
  explain: ['explainSlide'],
  individual: ['individualSlide'],
  pair: ['pairSlide'],
  break: ['breakSlide'],
  teamwork: ['teamWorkSlide'],
  reflection: ['reflectionSlide'],
  homework: ['homeworkSlide'],
  finale: ['finaleSlide'],
};

export const CONTENT_LABEL: Record<string, string> = {
  settings: 'Общие настройки',
  teams: 'Команды',
};

/** JSON-копия без функций (иконки команд и т.п.) */
export function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_, x) => (typeof x === 'function' ? undefined : x)));
}

const DEFAULTS: Record<string, unknown> = Object.fromEntries(Object.entries(CONTENT).map(([k, v]) => [k, plain(v)]));
export const contentDefault = (key: string) => plain(DEFAULTS[key]);

/** Записать значение в исходный объект, сохраняя то, чего нет в JSON (функции, иконки) */
function assign(target: unknown, src: unknown): unknown {
  if (Array.isArray(src)) {
    const t = Array.isArray(target) ? target : [];
    const keep = [...t];
    t.length = 0;
    src.forEach((s, i) => t.push(isObj(s) && isObj(keep[i]) ? assign(keep[i], s) : isObj(s) && isObj(keep[0]) ? assign({ ...(keep[0] as Obj) }, s) : s));
    return t;
  }
  if (isObj(src)) {
    const t = (isObj(target) ? target : {}) as Obj;
    for (const [k, v] of Object.entries(src)) t[k] = isObj(v) || Array.isArray(v) ? assign(t[k], v) : v;
    return t;
  }
  return src;
}
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** Применить сохранённые изменения проекта (и откатить то, что было изменено раньше, но удалено) */
export function applyContent(content: Record<string, unknown>) {
  for (const key of Object.keys(CONTENT)) {
    const value = key in content ? content[key] : DEFAULTS[key];
    assign(CONTENT[key], plain(value));
  }
}

/** Применить видео проекта к settings.videos */
const VIDEO_DEFAULTS = { ...settings.videos } as Record<string, string>;
export function applyVideos(map: Record<string, string>, resolve: (assetId: string) => string | undefined) {
  const v = settings.videos as Record<string, string>;
  for (const k of Object.keys(VIDEO_DEFAULTS)) v[k] = (map[k] && resolve(map[k])) || VIDEO_DEFAULTS[k];
}
export const VIDEO_KEYS: Record<string, string> = {
  cyberbullying: 'Кибербуллинг (слайд «Психологиялық ахуал»)',
  aiLesson: 'ЖИ бейнеролигі',
  teacher: 'Мұғалім бейнесі (слайд «Жаңа тақырып»)',
  break: 'Сергіту сәті',
};
export const SLIDE_VIDEOS: Record<string, string[]> = { mood: ['cyberbullying'], 'ai-video': ['aiLesson'], explain: ['teacher'], break: ['break'] };
