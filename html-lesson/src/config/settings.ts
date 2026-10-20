/**
 * ОБЩИЕ НАСТРОЙКИ ПРЕЗЕНТАЦИИ
 * Здесь меняются: ссылка Plickers, видеофайлы, длительность таймеров, звук по умолчанию.
 */

const base = import.meta.env.BASE_URL;

export const settings = {
  /** Ссылка на конкретный тест Plickers. Можно также вставить её прямо в «Панели учителя». */
  plickersUrl: 'https://www.plickers.com/',

  /** Звуковые эффекты включены при первом запуске */
  soundEnabledByDefault: true,

  /** Необязательные подписи на титульном экране (оставьте пустыми, чтобы скрыть) */
  teacherName: '',
  schoolName: '',

  /** Видео: положите файлы в папку public/videos/ с такими именами */
  videos: {
    cyberbullying: `${base}videos/cyberbullying.mp4`,
    aiLesson: `${base}videos/ai-lesson.mp4`,
    teacher: `${base}videos/teacher.mp4`,
    break: `${base}videos/break.mp4`,
  },

  /** Длительность таймеров по умолчанию (в минутах) */
  timers: {
    individual: 7,
    pair: 8,
    team: 12,
  },
};
