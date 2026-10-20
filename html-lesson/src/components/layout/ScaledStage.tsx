import { useEffect, useState, type ReactNode } from 'react';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/**
 * Вся презентация свёрстана на «холсте» 1920×1080 и пропорционально масштабируется
 * под любой экран (1366×768, проектор, интерактивная доска) — ничего не обрезается и не «съезжает».
 */
export function ScaledStage({ children }: { children: ReactNode }) {
  const [box, setBox] = useState(() => calc());

  useEffect(() => {
    const onResize = () => setBox(calc());
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink">
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(${box.x}px, ${box.y}px) scale(${box.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function calc() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min(w / STAGE_W, h / STAGE_H);
  return { scale, x: (w - STAGE_W * scale) / 2, y: (h - STAGE_H * scale) / 2 };
}
