import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Hammer, Info, Maximize2, SkipForward, Video } from 'lucide-react';
import { explainSlide as T } from '../data/lesson';
import { settings } from '../config/settings';
import { SlideHeader } from '../components/ui/SlideHeader';
import { GlowButton } from '../components/ui/GlowButton';
import { Modal } from '../components/ui/Modal';
import { RichText } from '../components/ui/RichText';
import { CodeBlock } from '../components/code/CodeBlock';
import { BrowserFrame, EditorFrame } from '../components/code/Frames';
import { HtmlTablePreview, type TableFocus } from '../components/code/HtmlTablePreview';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { buildTableLines, totalSteps, type CodeLine, type TagKey } from '../lib/htmlTable';
import { useLessonState } from '../store/lessonStore';
import { playSound } from '../lib/sound';

const TAG_COLORS: Record<TagKey, { hex: string; rgb: string }> = {
  table: { hex: '#38bdf8', rgb: '56 189 248' },
  tr: { hex: '#f59e0b', rgb: '245 158 11' },
  th: { hex: '#a78bfa', rgb: '167 139 250' },
  td: { hex: '#34d399', rgb: '52 211 153' },
};
const TAG_ORDER: TagKey[] = ['table', 'tr', 'th', 'td'];

const lines = buildTableLines(T.example);
const STEPS = totalSteps(T.example);

export function ExplainSlide() {
  const [focus, setFocus] = useLessonState<TableFocus>('explain.focus', { tag: null });
  const [step, setStep] = useLessonState<number | null>('explain.step', null);
  const [videoOpen, setVideoOpen] = useState(false);
  const building = step !== null;

  const pickTag = (tag: TagKey) => {
    playSound('pop');
    setFocus(focus.tag === tag && focus.row === undefined ? { tag: null } : { tag });
  };

  const pickLine = (line: CodeLine) => {
    playSound('click');
    if (line.tag === 'table') setFocus({ tag: 'table' });
    else if (line.tag === 'tr') setFocus({ tag: 'tr', row: line.row });
    else setFocus({ tag: line.tag, row: line.row, col: line.col });
  };

  const highlight = (line: CodeLine): 0 | 1 | 2 => {
    if (!focus.tag) return 0;
    if (focus.tag === 'table') return line.tag === 'table' ? 2 : 0;
    if (focus.tag === 'tr') {
      if (line.tag === 'tr') return focus.row === undefined || focus.row === line.row ? 2 : 0;
      return focus.row !== undefined && focus.row === line.row ? 1 : 0;
    }
    if (line.tag !== focus.tag) return 0;
    if (focus.row === undefined) return 2;
    return focus.row === line.row && (focus.col === undefined || focus.col === line.col) ? 2 : 0;
  };

  const color = focus.tag ? TAG_COLORS[focus.tag] : TAG_COLORS.table;
  const tagInfo = focus.tag ? T.tags[focus.tag] : null;

  return (
    <div className="relative flex h-full flex-col px-[100px] pt-6">
      <SlideHeader
        eyebrow={T.eyebrow}
        title={T.title}
        size="md"
        right={
          <div className="flex items-center gap-3">
            {TAG_ORDER.map((tag) => {
              const on = focus.tag === tag;
              return (
                <motion.button
                  key={tag}
                  type="button"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => pickTag(tag)}
                  className="h-16 rounded-[20px] border-2 px-6 font-mono text-[28px] font-semibold transition-colors [font-variant-ligatures:none]"
                  style={{
                    borderColor: TAG_COLORS[tag].hex,
                    color: on ? '#030614' : TAG_COLORS[tag].hex,
                    backgroundColor: on ? TAG_COLORS[tag].hex : 'rgba(255,255,255,0.04)',
                    boxShadow: on ? `0 0 30px ${TAG_COLORS[tag].hex}` : 'none',
                  }}
                >
                  &lt;{tag}&gt;
                </motion.button>
              );
            })}
            <span className="mx-2 h-10 w-px bg-white/15" />
            <GlowButton variant="glass" icon={Video} onClick={() => setVideoOpen(true)}>
              {T.teacherVideo}
            </GlowButton>
          </div>
        }
      />

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[1fr_1fr] gap-10 pb-6">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="min-h-0">
          <EditorFrame className="h-full" right={<span className="font-mono text-[16px] text-snow/40">HTML</span>}>
            <CodeBlock
              lines={lines}
              fontSize={24}
              isVisible={(l) => step === null || l.step <= step}
              highlight={highlight}
              onLineClick={pickLine}
              highlightColor={color.rgb}
              dimOthers={!!focus.tag}
            />
          </EditorFrame>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="flex min-h-0 flex-col gap-5">
          <BrowserFrame className="min-h-0 flex-1">
            <div className="flex h-full items-center justify-center p-8">
              <HtmlTablePreview data={T.example} step={step ?? undefined} focus={focus} fontSize={32} />
            </div>
          </BrowserFrame>

          {/* Пояснение + управление построением */}
          <div className="glass flex h-[150px] shrink-0 items-center gap-5 rounded-[28px] px-6">
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={building ? `s${step}` : focus.tag ?? 'hint'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {building ? (
                    <>
                      <div className="font-display text-[20px] font-semibold text-cyan">
                        {step} / {STEPS} қадам
                      </div>
                      <RichText text={T.steps[Math.min(step!, T.steps.length - 1)]} className="mt-1 block text-[24px] leading-snug text-snow" />
                    </>
                  ) : tagInfo ? (
                    <>
                      <div className="flex items-center gap-3 font-display text-[24px] font-bold" style={{ color: color.hex }}>
                        <span className="font-mono">{tagInfo.name}</span> — {tagInfo.title}
                      </div>
                      <div className="mt-1 text-[22px] leading-snug text-snow/85">{tagInfo.text}</div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-[23px] text-snow/70">
                      <Info className="shrink-0 text-cyan" size={28} />
                      {T.tagHint}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {building ? (
                <>
                  <GlowButton
                    size="sm"
                    icon={SkipForward}
                    sound="pop"
                    disabled={step! >= STEPS}
                    onClick={() => {
                      setFocus({ tag: null });
                      setStep((s) => Math.min(STEPS, (s ?? 0) + 1));
                    }}
                  >
                    {T.nextStep}
                  </GlowButton>
                  <GlowButton size="sm" variant="glass" icon={Maximize2} onClick={() => setStep(null)}>
                    {T.showFull}
                  </GlowButton>
                </>
              ) : (
                <GlowButton
                  size="md"
                  icon={Hammer}
                  onClick={() => {
                    setFocus({ tag: null });
                    setStep(0);
                  }}
                >
                  {T.buildButton}
                </GlowButton>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <Modal open={videoOpen} onClose={() => setVideoOpen(false)} title={T.teacherVideo} width={1400}>
        <VideoPlayer src={settings.videos.teacher} title={T.teacherVideo} />
      </Modal>
    </div>
  );
}
