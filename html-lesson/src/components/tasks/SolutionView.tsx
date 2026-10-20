import type { TableData } from '../../data/lesson';
import { buildCompactTableLines, buildTableLines } from '../../lib/htmlTable';
import { CodeBlock } from '../code/CodeBlock';
import { BrowserFrame, EditorFrame } from '../code/Frames';
import { HtmlTablePreview } from '../code/HtmlTablePreview';

/**
 * Образец решения: код + результат в браузере (модальное окно «Жауапты көрсету»).
 * Небольшая таблица — код «по тегу на строку» рядом с результатом;
 * большая — компактный код (строка таблицы = строка кода) рядом с результатом, чтобы всё поместилось на экране.
 */
export function SolutionView({ data }: { data: TableData }) {
  const full = buildTableLines(data);
  if (full.length <= 17) {
    return (
      <div className="grid grid-cols-[1.05fr_1fr] gap-8">
        <EditorFrame>
          <CodeBlock lines={full} fontSize={22} />
        </EditorFrame>
        <BrowserFrame>
          <div className="flex h-full items-center justify-center p-8">
            <HtmlTablePreview data={data} fontSize={28} />
          </div>
        </BrowserFrame>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[900px_1fr] gap-6">
      <EditorFrame>
        <CodeBlock lines={buildCompactTableLines(data)} fontSize={20} />
      </EditorFrame>
      <BrowserFrame>
        <div className="flex h-full items-center justify-center p-5">
          <HtmlTablePreview data={data} fontSize={22} />
        </div>
      </BrowserFrame>
    </div>
  );
}
