import { Background } from '../components/animations/Background';
import { assetUrl } from './store';
import type { SlideInst } from './types';

/** Фон слайда: «живой» фон презентации или свой цвет / градиент / картинка из редактора */
export function SlideBackground({ inst, palette }: { inst: SlideInst; palette: [string, string, string] }) {
  const bg = inst.bg;
  if (!bg || bg.type === 'default') return <Background palette={palette} />;
  const style =
    bg.type === 'color'
      ? { background: bg.color ?? '#fff8ec' }
      : bg.type === 'gradient'
        ? { background: `linear-gradient(${bg.angle ?? 135}deg, ${bg.color ?? '#7b5cff'}, ${bg.color2 ?? '#ff5a5f'})` }
        : { background: `#1d1b3a url("${assetUrl(bg.asset) ?? ''}") center / cover no-repeat` };
  return <div className="pointer-events-none absolute inset-0" style={style} aria-hidden />;
}
