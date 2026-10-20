import type { TableData } from '../data/lesson';

/**
 * Генерирует HTML-код таблицы из данных — поэтому код на слайде
 * и отрисованная таблица всегда точно соответствуют друг другу.
 */

export type LineKind = 'table-open' | 'table-close' | 'tr-open' | 'tr-close' | 'th' | 'td';
export type TagKey = 'table' | 'tr' | 'th' | 'td';

export interface CodeLine {
  text: string;
  indent: number;
  kind: LineKind;
  tag: TagKey;
  /** индекс строки таблицы (0 — заголовочная) */
  row?: number;
  col?: number;
  /** на каком шаге пошагового построения появляется строка кода */
  step: number;
}

/** шаг, на котором появляется строка таблицы row (0 — заголовок) */
export const rowStep = (row: number) => (row === 0 ? 2 : 3 + row);
/** шаг, на котором появляются ячейки строки row */
export const cellStep = (row: number) => (row === 0 ? 3 : 3 + row);
export const totalSteps = (data: TableData) => 3 + data.rows.length;

/** Компактная запись: каждая строка таблицы — одна строка кода (для образцов решения) */
export function buildCompactTableLines(data: TableData, border = true): CodeLine[] {
  const lines: CodeLine[] = [];
  lines.push({ text: border ? '<table border="1">' : '<table>', indent: 0, kind: 'table-open', tag: 'table', step: 1 });
  [data.headers, ...data.rows].forEach((cells, r) => {
    const t = r === 0 ? 'th' : 'td';
    const inner = cells.map((v) => `<${t}>${v}</${t}>`).join(' ');
    lines.push({ text: `<tr> ${inner} </tr>`, indent: 1, kind: 'tr-open', tag: 'tr', row: r, step: rowStep(r) });
  });
  lines.push({ text: '</table>', indent: 0, kind: 'table-close', tag: 'table', step: 1 });
  return lines;
}

export function buildTableLines(data: TableData, border = true): CodeLine[] {
  const lines: CodeLine[] = [];
  lines.push({ text: border ? '<table border="1">' : '<table>', indent: 0, kind: 'table-open', tag: 'table', step: 1 });
  const all = [data.headers, ...data.rows];
  all.forEach((cells, r) => {
    const cellTag = r === 0 ? 'th' : 'td';
    lines.push({ text: '<tr>', indent: 1, kind: 'tr-open', tag: 'tr', row: r, step: rowStep(r) });
    cells.forEach((value, c) => {
      lines.push({
        text: `<${cellTag}>${value}</${cellTag}>`,
        indent: 2,
        kind: cellTag,
        tag: cellTag,
        row: r,
        col: c,
        step: cellStep(r),
      });
    });
    lines.push({ text: '</tr>', indent: 1, kind: 'tr-close', tag: 'tr', row: r, step: rowStep(r) });
  });
  lines.push({ text: '</table>', indent: 0, kind: 'table-close', tag: 'table', step: 1 });
  return lines;
}

/* ── Простейшая подсветка синтаксиса HTML ── */
export type TokenType = 'punct' | 'tag' | 'attr' | 'value' | 'text';
export interface Token {
  t: string;
  type: TokenType;
}

const TAG_RE = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-]+(?:="[^"]*")?)*)\s*(\/?>)/;
const ATTR_RE = /(\s+)([a-zA-Z-]+)(?:(=)("[^"]*"))?/g;

export function tokenizeHtml(line: string): Token[] {
  const out: Token[] = [];
  let rest = line;
  while (rest.length) {
    const lt = rest.indexOf('<');
    if (lt === -1) {
      out.push({ t: rest, type: 'text' });
      break;
    }
    if (lt > 0) out.push({ t: rest.slice(0, lt), type: 'text' });
    rest = rest.slice(lt);
    const m = TAG_RE.exec(rest);
    if (!m) {
      out.push({ t: '<', type: 'text' });
      rest = rest.slice(1);
      continue;
    }
    out.push({ t: '<' + m[1], type: 'punct' });
    out.push({ t: m[2], type: 'tag' });
    if (m[3]) {
      for (const a of m[3].matchAll(ATTR_RE)) {
        out.push({ t: a[1], type: 'text' });
        out.push({ t: a[2], type: 'attr' });
        if (a[3]) {
          out.push({ t: a[3], type: 'punct' });
          out.push({ t: a[4], type: 'value' });
        }
      }
    }
    out.push({ t: m[4], type: 'punct' });
    rest = rest.slice(m[0].length);
  }
  return out;
}
