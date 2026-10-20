/** @type {import('tailwindcss').Config} */
// Цвета берутся из CSS-переменных в src/styles/theme.css — меняйте палитру там.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: v('ink'),
        navy: v('navy'),
        deep: v('deep'),
        electric: v('electric'),
        cyan: v('cyan'),
        violet: v('violet'),
        magenta: v('magenta'),
        mint: v('mint'),
        amber: v('amber'),
        rose: v('rose'),
        snow: v('snow'),
      },
      fontFamily: {
        display: ['"Geologica Variable"', 'Segoe UI', 'sans-serif'],
        body: ['"Onest Variable"', 'Segoe UI', 'sans-serif'],
        mono: ['"Fira Code Variable"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
