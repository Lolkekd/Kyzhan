import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Film, Maximize, Minimize, Pause, Play, RefreshCw, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { cn, formatTime } from '../../lib/cn';
import { playSound } from '../../lib/sound';

interface Props {
  src: string;
  title?: string;
  /** подпись ожидаемой длительности, например «1:21» (для заглушки) */
  expectedDuration?: string;
  className?: string;
  accent?: string;
}

/**
 * Видеоплеер со своими элементами управления.
 * Если файла нет — показывает аккуратную заглушку с именем ожидаемого файла (без ошибок).
 */
export function VideoPlayer({ src, title, expectedDuration, className, accent = '#22d3ee' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [missing, setMissing] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number>();
  const fileName = src.split('/').pop() ?? src;

  // Если источник так и не загрузился (нет файла) — показываем заглушку
  useEffect(() => {
    const t = window.setTimeout(() => {
      const v = videoRef.current;
      if (v && v.readyState === 0 && (v.networkState === 3 || v.error)) setMissing(true);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [src, missing]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const poke = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
    poke();
  };

  const seekBy = (d: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d));
    poke();
  };

  const toggleFullscreen = () => {
    playSound('click');
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const retry = () => {
    playSound('click');
    setMissing(false);
    setReady(false);
    window.setTimeout(() => videoRef.current?.load(), 30);
  };

  if (missing) {
    return (
      <div
        className={cn('relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-[32px] border-2 border-dashed border-white/15 bg-white/[0.03] text-center', className)}
        data-no-swipe
      >
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 50% 40%, ${accent}22, transparent 60%)` }} />
        <div
          className="anim-float relative mb-6 grid h-28 w-28 place-items-center rounded-[28px] border border-white/15 bg-white/[0.06]"
          style={{ boxShadow: `0 0 60px -10px ${accent}` }}
        >
          <Film size={54} style={{ color: accent }} />
        </div>
        <div className="relative font-display text-[34px] font-semibold text-snow">Бейне әлі қосылмаған</div>
        {title && <div className="relative mt-2 text-[24px] text-snow/60">{title}</div>}
        <div className="relative mt-6 rounded-2xl border border-white/10 bg-ink/60 px-6 py-3 font-mono text-[22px] text-cyan">
          public/videos/{fileName}
        </div>
        <div className="relative mt-3 text-[18px] text-snow/40">
          Положите файл с этим именем в папку public/videos{expectedDuration ? ` · ${expectedDuration}` : ''}
        </div>
        <button
          type="button"
          onClick={retry}
          className="relative mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 font-display text-[19px] text-snow/80 hover:bg-white/[0.12]"
        >
          <RefreshCw size={20} /> Қайта тексеру
        </button>
      </div>
    );
  }

  const fill = duration ? (current / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      data-no-swipe
      onPointerMove={poke}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key.toLowerCase() === 'k') {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }
      }}
      className={cn(
        'group relative overflow-hidden bg-black outline-none',
        fullscreen ? 'h-full w-full' : 'aspect-video rounded-[32px] border border-white/10 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]',
        className,
      )}
      style={!fullscreen ? { boxShadow: `0 40px 100px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px -30px ${accent}` } : undefined}
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        className="h-full w-full object-contain"
        onClick={toggle}
        onError={() => setMissing(true)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          setReady(true);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => {
          setPlaying(true);
          poke();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onEnded={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
      />

      {/* Большая кнопка Play */}
      <AnimatePresence>
        {!playing && (
          <motion.button
            type="button"
            aria-label="Ойнату"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            onClick={() => {
              playSound('click');
              toggle();
            }}
            className="absolute left-1/2 top-1/2 grid h-32 w-32 place-items-center rounded-full text-white"
            style={{ x: '-50%', y: '-50%', background: `radial-gradient(circle at 30% 30%, ${accent}, #6d28d9)`, boxShadow: `0 0 0 14px rgba(255,255,255,0.08), 0 0 80px ${accent}` }}
          >
            <span className="animate-pulse-ring absolute inset-0 rounded-full border-4" style={{ borderColor: accent }} />
            <Play size={56} className="ml-2" fill="white" />
          </motion.button>
        )}
      </AnimatePresence>

      {!ready && !playing && (
        <div className="pointer-events-none absolute left-8 top-6 font-display text-[20px] text-white/50">Жүктелуде…</div>
      )}

      {/* Панель управления */}
      <motion.div
        animate={{ opacity: controlsVisible || !playing ? 1 : 0, y: controlsVisible || !playing ? 0 : 20 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-7 pb-5 pt-14"
      >
        <CtrlButton label={playing ? 'Кідірту' : 'Ойнату'} onClick={toggle}>
          {playing ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
        </CtrlButton>
        <CtrlButton label="10 секунд артқа" onClick={() => seekBy(-10)}>
          <RotateCcw size={24} />
        </CtrlButton>
        <CtrlButton label="10 секунд алға" onClick={() => seekBy(10)}>
          <RotateCw size={24} />
        </CtrlButton>
        <span className="shrink-0 whitespace-nowrap font-mono text-[20px] tabular-nums text-white/85">
          {formatTime(current)} / {formatTime(duration)}
        </span>
        <input
          type="range"
          aria-label="Уақыт"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => {
            const v = videoRef.current;
            if (v) v.currentTime = Number(e.target.value);
            setCurrent(Number(e.target.value));
            poke();
          }}
          className="h-6 min-w-0 flex-1"
          style={{ ['--fill' as string]: `${fill}%` }}
        />
        <CtrlButton
          label={muted ? 'Дыбысты қосу' : 'Дыбысты өшіру'}
          onClick={() => {
            const v = videoRef.current;
            if (v) v.muted = !v.muted;
          }}
        >
          {muted || volume === 0 ? <VolumeX size={26} /> : <Volume2 size={26} />}
        </CtrlButton>
        <input
          type="range"
          aria-label="Дыбыс деңгейі"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = videoRef.current;
            if (!v) return;
            v.volume = Number(e.target.value);
            v.muted = Number(e.target.value) === 0;
          }}
          className="h-6 w-[130px] shrink-0"
          style={{ ['--fill' as string]: `${(muted ? 0 : volume) * 100}%` }}
        />
        {document.fullscreenEnabled && (
          <CtrlButton label="Толық экран" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize size={26} /> : <Maximize size={26} />}
          </CtrlButton>
        )}
      </motion.div>
    </div>
  );
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white transition hover:bg-white/15 active:scale-90"
    >
      {children}
    </button>
  );
}
