import { memo } from 'react';

/**
 * Светлый «конфетный» фон: кремовая бумага в точку и крупные цветные фигуры-наклейки по краям.
 * Цвета фигур берутся из палитры слайда; фигуры медленно покачиваются (только CSS transform).
 */
export const Background = memo(function Background({ palette }: { palette: [string, string, string] }) {
  const [a, b, c] = palette;
  const ink = 'rgb(var(--c-ink))';
  const shape = (style: React.CSSProperties, cls: string, dur: string, delay = '0s') => (
    <div
      data-bg-anim
      className={`absolute ${cls}`}
      style={{ border: `4px solid ${ink}`, boxShadow: `6px 6px 0 ${ink}`, transition: 'background-color 1s ease', ['--dur' as string]: dur, ['--delay' as string]: delay, ...style }}
    />
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(var(--c-cream))',
          backgroundImage: 'radial-gradient(rgb(var(--c-ink) / 0.09) 2.5px, transparent 2.5px)',
          backgroundSize: '36px 36px',
        }}
      />
      {/* мягкие цветные пятна в углах */}
      <div className="absolute -left-[260px] -top-[260px] h-[620px] w-[620px] rounded-full opacity-25 blur-[2px]" style={{ background: `radial-gradient(circle, ${a} 0%, transparent 65%)`, transition: 'background 1s ease' }} />
      <div className="absolute -bottom-[300px] -right-[220px] h-[680px] w-[680px] rounded-full opacity-25" style={{ background: `radial-gradient(circle, ${b} 0%, transparent 65%)`, transition: 'background 1s ease' }} />

      {/* фигуры-наклейки по краям экрана */}
      {shape({ width: 120, height: 120, borderRadius: '50%', background: a, top: -46, right: 360 }, 'anim-float', '7s')}
      {shape({ width: 86, height: 86, borderRadius: 22, background: c, bottom: 120, left: -34, rotate: '18deg' }, 'anim-float', '9s', '1s')}
      {shape({ width: 64, height: 64, borderRadius: '50%', background: b, bottom: -30, left: 280 }, 'anim-float', '6s', '0.5s')}
      {shape({ width: 150, height: 60, borderRadius: 999, background: 'rgb(var(--c-sun))', top: 300, right: -70, rotate: '-24deg' }, 'anim-float', '8s', '2s')}
      <svg data-bg-anim className="anim-float absolute left-[380px] top-[22px]" style={{ ['--dur' as string]: '10s' }} width="150" height="40" viewBox="0 0 150 40">
        <path d="M4 20 Q 22 2 40 20 T 76 20 T 112 20 T 146 20" fill="none" stroke={c} strokeWidth="9" strokeLinecap="round" />
      </svg>
      <svg data-bg-anim className="anim-float absolute left-[4px] top-[470px]" style={{ ['--dur' as string]: '11s', ['--delay' as string]: '1.5s' }} width="70" height="70" viewBox="0 0 70 70">
        <path d="M35 4 L42 28 L66 35 L42 42 L35 66 L28 42 L4 35 L28 28 Z" fill={a} stroke="rgb(29 27 58)" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    </div>
  );
});
