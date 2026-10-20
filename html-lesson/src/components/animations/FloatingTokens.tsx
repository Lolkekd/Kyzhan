import { memo } from 'react';

// Только «нейтральные» теги — тема урока не раскрывается раньше времени!
const TOKENS = ['<html>', '</>', '<body>', '{ }', '<h1>', '<p>', 'href=""', '<div>', '<head>', '#fff', '<!-- -->', '<a>', '<br>', 'class=""', '<ul>', '<img>'];

/** Плавающие полупрозрачные фрагменты кода на фоне */
export const FloatingTokens = memo(function FloatingTokens({ count = 14, opacity = 0.22, className = 'inset-0' }: { count?: number; opacity?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute overflow-hidden ${className}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 137.5) % 100;
        const top = 20 + ((i * 53) % 70);
        const dur = 14 + ((i * 7) % 10);
        const delay = -((i * 3.3) % dur);
        const size = 18 + ((i * 5) % 14);
        return (
          <span
            key={i}
            data-bg-anim
            className="absolute font-mono text-electric"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              fontSize: size,
              opacity,
              animation: `token-float ${dur}s linear ${delay}s infinite`,
            }}
          >
            {TOKENS[i % TOKENS.length]}
          </span>
        );
      })}
    </div>
  );
});
