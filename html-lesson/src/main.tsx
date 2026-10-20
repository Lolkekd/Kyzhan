import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Заранее подгружаем шрифты с казахскими буквами, чтобы они не «мигали» при первом показе
const sample = 'Аа Әә Ғғ Ққ Ңң Өө Ұұ Үү Һһ Іі <table>';
for (const font of ['400 1em "Onest Variable"', '700 1em "Onest Variable"', '700 1em "Geologica Variable"', '800 1em "Geologica Variable"', '400 1em "Fira Code Variable"']) {
  void document.fonts?.load(font, sample).catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
