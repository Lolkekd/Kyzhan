import type { ComponentType } from 'react';
import { TitleSlide } from '../slides/TitleSlide';
import { MoodSlide } from '../slides/MoodSlide';
import { TeamsSlide } from '../slides/TeamsSlide';
import { PlickersSlide } from '../slides/PlickersSlide';
import { PuzzleSlide } from '../slides/puzzle/PuzzleSlide';
import { GoalsSlide } from '../slides/GoalsSlide';
import { AiVideoSlide } from '../slides/AiVideoSlide';
import { ExplainSlide } from '../slides/ExplainSlide';
import { IndividualSlide } from '../slides/IndividualSlide';
import { PairSlide } from '../slides/PairSlide';
import { BreakSlide } from '../slides/BreakSlide';
import { TeamWorkSlide } from '../slides/TeamWorkSlide';
import { ReflectionSlide } from '../slides/ReflectionSlide';
import { HomeworkSlide } from '../slides/HomeworkSlide';
import { FinaleSlide } from '../slides/FinaleSlide';

/**
 * ПОРЯДОК СЛАЙДОВ И ЭТАПЫ УРОКА
 * title — название в навигации и панели учителя; group — блок урока на индикаторе прогресса;
 * palette — цвета живого фона на этом слайде.
 */

export const groups = [
  { id: 'start', label: 'Ұйымдастыру', color: '#7b5cff' },
  { id: 'check', label: 'Тексеру', color: '#00a08a' },
  { id: 'new', label: 'Жаңа білім', color: '#ff5a5f' },
  { id: 'practice', label: 'Практика', color: '#d63384' },
  { id: 'end', label: 'Қорытынды', color: '#e08a00' },
] as const;

export type GroupId = (typeof groups)[number]['id'];

export interface SlideDef {
  id: string;
  title: string;
  group: GroupId;
  component: ComponentType;
  palette: [string, string, string];
  /** скрыть верхнюю строку с названием этапа (для титульного/финального экрана) */
  bare?: boolean;
}

const P = {
  blue: ['#7b5cff', '#00c2a8', '#ff5a5f'] as [string, string, string],
  violet: ['#ff5a5f', '#7b5cff', '#00c2a8'] as [string, string, string],
  cyan: ['#00c2a8', '#ff8fa3', '#7b5cff'] as [string, string, string],
  warm: ['#ff8a3d', '#ff5a5f', '#7b5cff'] as [string, string, string],
  green: ['#2bd18b', '#7b5cff', '#ff5a5f'] as [string, string, string],
};

export const slides: SlideDef[] = [
  { id: 'title', title: 'Бастау', group: 'start', component: TitleSlide, palette: P.blue, bare: true },
  { id: 'mood', title: 'Психологиялық ахуал', group: 'start', component: MoodSlide, palette: P.violet },
  { id: 'teams', title: 'Топқа бөлу', group: 'start', component: TeamsSlide, palette: P.cyan },
  { id: 'plickers', title: 'Үй тапсырмасын тексеру', group: 'check', component: PlickersSlide, palette: P.blue },
  { id: 'puzzle', title: 'Жасырын тақырып', group: 'new', component: PuzzleSlide, palette: P.violet },
  { id: 'goals', title: 'Мақсат пен жоспар', group: 'new', component: GoalsSlide, palette: P.cyan },
  { id: 'ai-video', title: 'ЖИ бейнеролигі', group: 'new', component: AiVideoSlide, palette: P.violet },
  { id: 'explain', title: 'Жаңа тақырып', group: 'new', component: ExplainSlide, palette: P.blue },
  { id: 'individual', title: 'Жеке жұмыс', group: 'practice', component: IndividualSlide, palette: P.cyan },
  { id: 'pair', title: 'Жұптық жұмыс', group: 'practice', component: PairSlide, palette: P.violet },
  { id: 'break', title: 'Сергіту сәті', group: 'practice', component: BreakSlide, palette: P.warm },
  { id: 'teamwork', title: 'Топтық жұмыс', group: 'practice', component: TeamWorkSlide, palette: P.blue },
  { id: 'reflection', title: 'Рефлексия', group: 'end', component: ReflectionSlide, palette: P.green },
  { id: 'homework', title: 'Үй тапсырмасы', group: 'end', component: HomeworkSlide, palette: P.cyan },
  { id: 'finale', title: 'Сабақтың соңы', group: 'end', component: FinaleSlide, palette: P.violet, bare: true },
];
