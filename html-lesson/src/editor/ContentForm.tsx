import { Plus, Trash2 } from 'lucide-react';
import { commit, useProject } from './store';
import { CONTENT, CONTENT_LABEL, contentDefault, plain } from './content';
import { Btn, Hint, Section, Text, cx } from './ui';
import { setIn } from './Canvas';

/** Подписи полей данных задания (остальные показываются как есть) */
const LABELS: Record<string, string> = {
  eyebrow: 'Надзаголовок',
  title: 'Заголовок',
  subtitle: 'Подзаголовок',
  text: 'Текст',
  task: 'Задание',
  hint: 'Подсказка',
  question: 'Вопрос',
  questions: 'Вопросы',
  q: 'Вопрос',
  a: 'Правильный ответ',
  answer: 'Ответ',
  answerCode: 'Код правильного ответа',
  answerHtml: 'HTML правильного ответа',
  answerNote: 'Подпись к ответу',
  code: 'Код',
  targetHtml: 'HTML образца',
  minutes: 'Минут на таймере',
  mode: 'Формат работы',
  label: 'Подпись',
  sub: 'Подпись (мелкая)',
  items: 'Элементы (в правильном порядке)',
  pairs: 'Пары (элемент → описание)',
  pieces: 'Кусочки кода (в правильном порядке)',
  lines: 'Строки кода',
  fix: 'Исправленная строка',
  why: 'Объяснение ошибки',
  criteria: 'Критерии',
  points: 'Баллы',
  requirements: 'Требования',
  rows: 'Строки таблицы',
  headers: 'Заголовки таблицы',
  tasks: 'Задания',
  tabs: 'Вкладки',
  showAnswer: 'Кнопка «показать ответ»',
  hideAnswer: 'Кнопка «скрыть ответ»',
  name: 'Название',
  motto: 'Девиз',
  color: 'Цвет',
  members: 'Учеников',
  number: 'Номер',
  link: 'Ссылка',
  goal: 'Мақсаты',
  process: 'Барысы',
  teacherName: 'Имя преподавателя',
  schoolName: 'Учебное заведение',
  plickersUrl: 'Ссылка Plickers',
  steps: 'Шаги',
  topic: 'Тема урока',
  reply: 'Ответ-отклик',
  lights: 'Сигналы светофора',
};
const HIDE = new Set(['id', 'icon', 'videos', 'timers', 'soundEnabledByDefault', 'kind', 'tag', 'rgb']);

type Path = (string | number)[];

/** Форма данных задания: вопросы, ответы, коды, критерии — логика слайда сразу работает с новыми значениями */
export function ContentForm({ keys }: { keys: string[] }) {
  useProject((p) => p.content);
  if (!keys.length) return <Hint>У этого слайда нет данных задания — меняйте его элементы мышкой.</Hint>;
  return (
    <>
      <Hint>Здесь меняются тексты заданий и правильные ответы. Интерактив (проверка, игры, баллы) сразу использует новые данные.</Hint>
      {keys.map((key) => (
        <DataBlock key={key} k={key} />
      ))}
    </>
  );
}

function DataBlock({ k }: { k: string }) {
  const value = plain(CONTENT[k]);
  const change = (path: Path, v: unknown, merge = true) => {
    commit(
      (p) => {
        const obj = (p.content[k] as object) ?? plain(CONTENT[k]);
        if (path.length === 0) p.content[k] = v;
        else {
          setIn(obj, path, v);
          p.content[k] = obj;
        }
      },
      merge ? { merge: `content:${k}:${path.join('.')}` } : {},
    );
  };
  const reset = () =>
    commit((p) => {
      delete p.content[k];
    });
  const lockArrays = k === 'teams';
  return (
    <Section title={CONTENT_LABEL[k] ?? 'Данные задания'} right={<button type="button" className="text-[12px] text-[#7b5cff] hover:underline" onClick={reset} title={JSON.stringify(contentDefault(k)).length > 0 ? 'Вернуть исходные данные' : ''}>Исходные</button>}>
      <Field value={value} path={[]} change={change} lockArrays={lockArrays} depth={0} />
    </Section>
  );
}

function Field({ value, path, change, lockArrays, depth, label }: { value: unknown; path: Path; change: (p: Path, v: unknown, merge?: boolean) => void; lockArrays: boolean; depth: number; label?: string }) {
  if (typeof value === 'string') {
    const long = value.length > 46 || value.includes('\n');
    const isColor = /^#[0-9a-f]{6}$/i.test(value);
    return (
      <div className="flex flex-col gap-1">
        {label && <span className="text-[12px] font-semibold text-[#6b6788]">{label}</span>}
        <div className="flex items-center gap-1.5">
          {isColor && <input type="color" value={value} onChange={(e) => change(path, e.target.value)} className="h-8 w-9 cursor-pointer rounded border-0 p-0" />}
          <div className="flex-1">
            <Text value={value} onChange={(v) => change(path, v)} area={long} mono={/[<>]/.test(value) && long} />
          </div>
        </div>
      </div>
    );
  }
  if (typeof value === 'number')
    return (
      <label className="flex items-center gap-2 text-[13px]">
        <span className="flex-1 text-[12px] font-semibold text-[#6b6788]">{label}</span>
        <input type="number" value={value} onChange={(e) => change(path, Number(e.target.value))} className="h-8 w-24 rounded-md border border-[#dcd9ea] px-2 text-[13px] outline-none focus:border-[#7b5cff]" onKeyDown={(e) => e.stopPropagation()} />
      </label>
    );
  if (typeof value === 'boolean')
    return (
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={value} onChange={(e) => change(path, e.target.checked, false)} />
        {label}
      </label>
    );
  if (Array.isArray(value)) {
    const canEdit = !lockArrays;
    const template = value[value.length - 1];
    return (
      <div className={cx('flex flex-col gap-2', depth > 0 && 'rounded-xl border border-[#ecebf3] p-2.5')}>
        {label && <span className="text-[12px] font-bold text-[#3b3858]">{label}</span>}
        {value.map((item, i) => (
          <div key={i} className="relative flex gap-1.5">
            <span className="w-5 shrink-0 pt-2 text-right text-[11px] font-semibold text-[#9a96b4]">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <Field value={item} path={[...path, i]} change={change} lockArrays={lockArrays} depth={depth + 1} />
            </div>
            {canEdit && (
              <button type="button" title="Удалить" onClick={() => change(path, value.filter((_, j) => j !== i), false)} className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#b0acc8] hover:bg-[#ffe9ea] hover:text-[#d6303a]">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {canEdit && template !== undefined && (
          <Btn small icon={Plus} onClick={() => change(path, [...value, blank(template)], false)}>
            Добавить
          </Btn>
        )}
      </div>
    );
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([k]) => !HIDE.has(k));
    return (
      <div className={cx('flex flex-col gap-2.5', depth > 1 && 'rounded-xl bg-[#faf9fd] p-2.5')}>
        {label && <span className="text-[12px] font-bold text-[#3b3858]">{label}</span>}
        {entries.map(([k, v]) => (
          <Field key={k} value={v} path={[...path, k]} change={change} lockArrays={lockArrays} depth={depth + 1} label={LABELS[k] ?? k} />
        ))}
      </div>
    );
  }
  return null;
}

/** Пустой элемент той же формы, что и образец (для кнопки «Добавить») */
function blank(t: unknown): unknown {
  if (typeof t === 'string') return '';
  if (typeof t === 'number') return 0;
  if (typeof t === 'boolean') return false;
  if (Array.isArray(t)) return t.map(blank);
  if (t && typeof t === 'object') return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, k === 'id' ? `${v}-${Date.now() % 1000}` : blank(v)]));
  return t;
}
