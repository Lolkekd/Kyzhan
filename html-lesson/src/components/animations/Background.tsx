import { memo } from 'react';

/**
 * Живой фон презентации: медленно плывущие цветные «орбы», перспективная сетка и мерцающие точки.
 * Анимируются только transform/opacity — это лёгкая нагрузка даже для школьного компьютера.
 */
export const Background = memo(function Background({ palette }: { palette: [string, string, string] }) {
  const orb = (color: string, cls: string, anim: string, size: number) => (
    <div
      data-bg-anim
      className={`absolute rounded-full ${cls}`}
      style={{
        width: size,
        height: size,
        color,
        background: 'radial-gradient(circle at center, currentColor 0%, transparent 68%)',
        opacity: 0.55,
        transition: 'color 1.4s ease',
        animation: anim,
      }}
    />
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(16_26_74)_0%,rgb(7_12_38)_45%,rgb(3_6_20)_100%)]" />
      {orb(palette[0], '-left-[300px] -top-[340px]', 'orb-drift-a 34s ease-in-out infinite', 1100)}
      {orb(palette[1], '-right-[320px] top-[180px]', 'orb-drift-b 40s ease-in-out infinite', 1000)}
      {orb(palette[2], 'left-[520px] -bottom-[520px]', 'orb-drift-c 46s ease-in-out infinite', 1000)}

      {/* перспективная сетка «пола» */}
      <div className="absolute inset-x-[-20%] bottom-[-10%] h-[55%] [perspective:900px]">
        <div
          data-bg-anim
          className="h-full w-full origin-bottom [transform:rotateX(68deg)]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(120,160,255,0.16) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(120,160,255,0.16) 1.5px, transparent 1.5px)',
            backgroundSize: '80px 80px',
            animation: 'grid-flow 6s linear infinite',
            maskImage: 'linear-gradient(to top, black 10%, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 90%)',
          }}
        />
      </div>

      {/* мелкие звёзды */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(1.5px 1.5px at 10% 20%, white, transparent), radial-gradient(1.5px 1.5px at 80% 12%, white, transparent), radial-gradient(1px 1px at 45% 70%, white, transparent), radial-gradient(1.5px 1.5px at 65% 40%, white, transparent), radial-gradient(1px 1px at 25% 85%, white, transparent), radial-gradient(1px 1px at 92% 75%, white, transparent), radial-gradient(1.5px 1.5px at 35% 35%, white, transparent), radial-gradient(1px 1px at 5% 60%, white, transparent)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
});
