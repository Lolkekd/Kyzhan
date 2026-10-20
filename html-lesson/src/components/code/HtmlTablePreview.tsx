import { motion } from 'motion/react';
import type { TableData } from '../../data/lesson';
import { cellStep, rowStep, type TagKey } from '../../lib/htmlTable';

export interface TableFocus {
  tag: TagKey | null;
  /** конкретная строка/ячейка (при клике по строке кода) */
  row?: number;
  col?: number;
}

interface Props {
  data: TableData;
  /** шаг пошагового построения; undefined — показать всё */
  step?: number;
  focus?: TableFocus;
  fontSize?: number;
}

const HL = '#2563eb';
const ROW_COLORS = ['#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9'];

/**
 * Таблица в том виде, как её показывает браузер для <table border="1">.
 * Умеет подсвечивать table / tr / th / td и строиться пошагово.
 */
export function HtmlTablePreview({ data, step, focus, fontSize = 30 }: Props) {
  const all = [data.headers, ...data.rows];
  const show = (s: number) => step === undefined || step >= s;
  const f = focus ?? { tag: null };

  const rowHighlighted = (r: number) => f.tag === 'tr' && (f.row === undefined || f.row === r);
  const cellHighlighted = (r: number, c: number) => {
    const isTh = r === 0;
    if (f.tag === 'th' && isTh) return f.row === undefined || (f.row === r && (f.col === undefined || f.col === c));
    if (f.tag === 'td' && !isTh) return f.row === undefined || (f.row === r && (f.col === undefined || f.col === c));
    return false;
  };
  const tableHighlighted = f.tag === 'table';

  if (!show(1)) {
    return (
      <div className="flex h-full items-center justify-center font-body text-[26px] text-slate-400">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Бет әзірге бос…
        </motion.span>
      </div>
    );
  }

  return (
    <motion.table
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: tableHighlighted ? `0 0 0 6px ${HL}, 0 0 40px 6px rgba(37,99,235,0.45)` : '0 0 0 0px rgba(0,0,0,0)',
      }}
      transition={{ duration: 0.4 }}
      className="border-collapse text-[#111]"
      style={{ fontSize, fontFamily: '"Times New Roman", Times, serif', border: '2px solid #777', minWidth: '62%' }}
    >
      <tbody>
        {all.map((cells, r) => {
          if (!show(rowStep(r))) return null;
          const isHeader = r === 0;
          const rowOn = rowHighlighted(r);
          const rowColor = ROW_COLORS[r % ROW_COLORS.length];
          return (
            <motion.tr key={r} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {show(cellStep(r)) ? (
                cells.map((value, c) => {
                  const on = cellHighlighted(r, c);
                  const Cell = isHeader ? 'th' : 'td';
                  return (
                    <Cell
                      key={c}
                      className="relative border border-[#888] px-5 py-3 transition-all duration-300"
                      style={{
                        textAlign: isHeader ? 'center' : 'left',
                        fontWeight: isHeader ? 700 : 400,
                        background: on ? 'rgba(37,99,235,0.18)' : rowOn ? `${rowColor}33` : undefined,
                        boxShadow: on
                          ? `inset 0 0 0 4px ${HL}`
                          : rowOn
                            ? `inset 0 4px 0 ${rowColor}, inset 0 -4px 0 ${rowColor}${c === 0 ? `, inset 4px 0 0 ${rowColor}` : ''}${c === cells.length - 1 ? `, inset -4px 0 0 ${rowColor}` : ''}`
                            : undefined,
                      }}
                    >
                      <motion.span
                        className="block"
                        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.35, delay: c * 0.12 }}
                      >
                        {value}
                      </motion.span>
                    </Cell>
                  );
                })
              ) : (
                <td
                  colSpan={data.headers.length}
                  className="border-2 border-dashed border-[#9aa] px-5"
                  style={{
                    height: fontSize * 2,
                    background: rowOn ? `${rowColor}33` : 'rgba(0,0,0,0.03)',
                    boxShadow: rowOn ? `inset 0 0 0 4px ${rowColor}` : undefined,
                  }}
                >
                  <span className="font-mono text-[18px] text-slate-400">&lt;tr&gt; … &lt;/tr&gt;</span>
                </td>
              )}
            </motion.tr>
          );
        })}
      </tbody>
    </motion.table>
  );
}
