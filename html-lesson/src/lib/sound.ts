import { lessonStore } from '../store/lessonStore';

/**
 * Звуковые эффекты синтезируются прямо в браузере (Web Audio API) —
 * никаких внешних файлов и интернета не нужно. Громкость намеренно мягкая.
 */

export type SoundName =
  | 'click'
  | 'nav'
  | 'flip'
  | 'success'
  | 'reveal'
  | 'plus'
  | 'minus'
  | 'alarm'
  | 'bell'
  | 'pop';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.5, slideTo?: number) {
  const c = audio();
  if (!c || !master) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function whoosh(dur = 0.35, vol = 0.18) {
  const c = audio();
  if (!c || !master) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  const t = c.currentTime;
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.exponentialRampToValueAtTime(2400, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start();
}

const library: Record<SoundName, () => void> = {
  click: () => tone(900, 0, 0.06, 'sine', 0.25),
  pop: () => tone(520, 0, 0.12, 'triangle', 0.35, 880),
  nav: () => whoosh(0.32, 0.12),
  flip: () => {
    whoosh(0.25, 0.1);
    tone(523, 0.02, 0.12, 'triangle', 0.3);
    tone(784, 0.1, 0.18, 'triangle', 0.3);
  },
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.32, 'triangle', 0.32)),
  reveal: () => {
    whoosh(0.9, 0.16);
    tone(220, 0, 0.9, 'sine', 0.25, 660);
    [523, 659, 784, 988, 1175].forEach((f, i) => tone(f, 0.55 + i * 0.07, 0.9, 'sine', 0.2));
  },
  plus: () => {
    tone(660, 0, 0.1, 'triangle', 0.32);
    tone(990, 0.07, 0.16, 'triangle', 0.32);
  },
  minus: () => tone(440, 0, 0.18, 'triangle', 0.28, 300),
  alarm: () => [0, 0.32, 0.64].forEach((s) => tone(880, s, 0.22, 'square', 0.12)),
  bell: () => {
    tone(784, 0, 1.2, 'sine', 0.3);
    tone(1568, 0, 0.8, 'sine', 0.1);
    tone(2352, 0, 0.5, 'sine', 0.05);
  },
};

export function playSound(name: SoundName) {
  if (!lessonStore.get().sound) return;
  try {
    library[name]();
  } catch {
    /* звук — необязательная часть */
  }
}
