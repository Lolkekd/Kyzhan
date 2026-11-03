/**
 * МОДЕЛЬ ПРОЕКТА РЕДАКТОРА
 * Всё, что меняет учитель в редакторе, хранится в одном JSON-объекте Project.
 * Исходные слайды (React-компоненты) не меняются: поверх них накладываются
 *  - over   — стили/положение/скрытие существующих элементов (по «пути» в DOM слайда),
 *  - texts  — замены текста существующих элементов,
 *  - overlay — новые элементы (текст, картинка, видео, фигура, кнопка, копия элемента),
 *  - content — изменённые данные заданий (вопросы, ответы, коды) из data/lesson.ts.
 */

export type Effect = 'none' | 'fade' | 'up' | 'down' | 'left' | 'right' | 'zoom' | 'bounce' | 'flip';
export type Transition = 'flip' | 'fade' | 'slide' | 'zoom' | 'none';

export interface Anim {
  effect: Effect;
  duration: number; // сек
  delay: number; // сек
  /** auto — сразу при показе слайда; click — по нажатию «Келесі» в порядке order */
  trigger: 'auto' | 'click';
  order: number;
  /** скрыть элемент на шаге (нажатии) с этим номером; 0 — не скрывать */
  hideAt?: number;
}

export interface StyleProps {
  color?: string;
  bg?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  shadow?: 'none' | 'soft' | 'hard' | 'glow';
  opacity?: number;
  padding?: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
}

export type OverlayKind = 'text' | 'image' | 'video' | 'shape' | 'button' | 'html';

export interface Action {
  type: 'none' | 'next' | 'prev' | 'goto' | 'url';
  value?: string;
}

export interface OverlayEl {
  id: string;
  kind: OverlayKind;
  box: Box;
  z: number;
  style: StyleProps;
  text?: string;
  /** копия существующего элемента (статический HTML) */
  html?: string;
  /** исходный размер скопированного элемента */
  nat?: { w: number; h: number };
  asset?: string;
  shape?: 'rect' | 'ellipse' | 'pill' | 'line';
  fit?: 'cover' | 'contain';
  action?: Action;
  anim?: Anim;
  locked?: boolean;
  name?: string;
}

/** Изменения существующего элемента слайда */
export interface ElOverride {
  dx?: number;
  dy?: number;
  w?: number;
  h?: number;
  z?: number;
  hidden?: boolean;
  style?: StyleProps;
  anim?: Anim;
  /** замена картинки (<img>) */
  imgAsset?: string;
  /** inline-элементам для изменения размера нужен inline-block */
  display?: string;
  label?: string;
}

export interface Background {
  type: 'default' | 'color' | 'gradient' | 'image';
  color?: string;
  color2?: string;
  angle?: number;
  asset?: string;
  /** цвета «живого» фона по умолчанию */
  palette?: [string, string, string];
}

export interface SlideInst {
  id: string;
  /** ключ исходного слайда из config/slides.ts; null — пустой слайд */
  base: string | null;
  title: string;
  hidden?: boolean;
  bg?: Background;
  transition?: Transition;
  /** путь элемента → изменения */
  over: Record<string, ElOverride>;
  /** «путь#индекс текстового узла» → { o: исходный, t: новый } */
  texts: Record<string, { o: string; t: string }>;
  overlay: OverlayEl[];
}

export interface Asset {
  id: string;
  name: string;
  mime: string;
  kind: 'image' | 'video';
  /** картинки хранятся прямо в проекте (data:URL) */
  data?: string;
  /** видео лежат файлом рядом: media/<file> */
  path?: string;
  size?: number;
}

export interface Project {
  v: 1;
  pid: string;
  name: string;
  updated: number;
  slides: SlideInst[];
  /** изменённые данные заданий: имя набора → значение */
  content: Record<string, unknown>;
  /** видео урока: ключ settings.videos → id ассета */
  videos: Record<string, string>;
  assets: Record<string, Asset>;
}

export const uid = (p = 'e') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
