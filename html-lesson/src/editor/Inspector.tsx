import { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  Bold,
  Eye,
  ImagePlus,
  Italic,
  Lock,
  LockOpen,
  RotateCcw,
  Trash2,
  Underline,
  Video,
  CornerLeftUp,
} from 'lucide-react';
import { addAssetFile, assetUrl, commit, findSlide, setUI, toast, useProject, useUI } from './store';
import { deleteSelection, editOver, editOverlay, editSlide, layer, resetSelection, selectParent, selectedNode } from './actions';
import { EFFECTS, FONTS } from './render';
import { SLIDE_CONTENT, SLIDE_VIDEOS, VIDEO_KEYS } from './content';
import { ContentForm } from './ContentForm';
import { Btn, Color, Hint, Num, Row, Section, Seg, Select, Text, cx } from './ui';
import type { Anim, Background, StyleProps, Transition } from './types';

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = accept;
    i.onchange = () => res(i.files?.[0] ?? null);
    i.click();
  });
}

/** Правая панель: свойства выбранного элемента или слайда */
export function Inspector() {
  const sel = useUI((u) => u.sel);
  const cur = useUI((u) => u.cur);
  const slide = useProject((p) => findSlide(cur, p));
  const [tab, setTab] = useState<'slide' | 'content'>('slide');
  if (!slide) return <aside className="w-[320px] shrink-0 border-l border-[#e3e1ee] bg-white" />;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[#e3e1ee] bg-white">
      {sel ? (
        <ElementPanel />
      ) : (
        <>
          <div className="flex gap-1 border-b border-[#ecebf3] p-2">
            {(
              [
                ['slide', 'Слайд'],
                ['content', 'Тексты и ответы'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={cx('h-8 flex-1 rounded-lg text-[13px] font-semibold', tab === k ? 'bg-[#efeaff] text-[#5b3ee0]' : 'text-[#6b6788] hover:bg-[#f6f5fb]')}>
                {l}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{tab === 'slide' ? <SlidePanelProps /> : <div className="flex flex-col gap-3 p-3"><ContentForm keys={slide.base ? SLIDE_CONTENT[slide.base] ?? [] : []} /></div>}</div>
        </>
      )}
    </aside>
  );
}

/* ───────── свойства слайда ───────── */
function SlidePanelProps() {
  const cur = useUI((u) => u.cur);
  const slide = useProject((p) => findSlide(cur, p))!;
  const assets = useProject((p) => p.assets);
  const videos = useProject((p) => p.videos);
  const bg: Background = slide.bg ?? { type: 'default' };
  const setBg = (patch: Partial<Background>) => editSlide((s) => void (s.bg = { ...(s.bg ?? { type: 'default' }), ...patch }), 'bg');
  const hiddenEls = Object.entries(slide.over).filter(([, o]) => o.hidden);
  const vids = slide.base ? SLIDE_VIDEOS[slide.base] ?? [] : [];

  return (
    <>
      <Section title="Слайд">
        <Row label="Название">
          <Text value={slide.title} onChange={(v) => editSlide((s) => void (s.title = v), 'title')} />
        </Row>
        <Row label="Показ">
          <Seg value={slide.hidden ? 'h' : 'v'} onChange={(v) => editSlide((s) => void (s.hidden = v === 'h'))} options={[{ value: 'v', label: 'Показывать' }, { value: 'h', label: 'Скрыть' }]} />
        </Row>
        <Row label="Переход">
          <Select<Transition>
            value={slide.transition ?? 'flip'}
            onChange={(v) => editSlide((s) => void (s.transition = v))}
            options={[
              { value: 'flip', label: 'Объёмный поворот' },
              { value: 'slide', label: 'Сдвиг' },
              { value: 'fade', label: 'Растворение' },
              { value: 'zoom', label: 'Приближение' },
              { value: 'none', label: 'Без перехода' },
            ]}
          />
        </Row>
        {!slide.base && <Hint>Это пустой слайд. Добавляйте текст, картинки, видео и фигуры кнопками сверху.</Hint>}
      </Section>

      <Section title="Фон">
        <Row label="Тип">
          <Select<Background['type']>
            value={bg.type}
            onChange={(v) => setBg({ type: v })}
            options={[
              { value: 'default', label: 'Живой фон презентации' },
              { value: 'color', label: 'Один цвет' },
              { value: 'gradient', label: 'Градиент' },
              { value: 'image', label: 'Картинка' },
            ]}
          />
        </Row>
        {bg.type === 'default' && (
          <>
            {[0, 1, 2].map((i) => (
              <Row key={i} label={`Фигуры ${i + 1}`}>
                <Color
                  value={bg.palette?.[i]}
                  onChange={(v) => {
                    const pal = [...(bg.palette ?? ['#7b5cff', '#00c2a8', '#ff5a5f'])] as [string, string, string];
                    pal[i] = v ?? pal[i];
                    setBg({ palette: pal });
                  }}
                />
              </Row>
            ))}
          </>
        )}
        {(bg.type === 'color' || bg.type === 'gradient') && (
          <Row label={bg.type === 'gradient' ? 'Цвет 1' : 'Цвет'}>
            <Color value={bg.color} onChange={(v) => setBg({ color: v })} allowEmpty={false} />
          </Row>
        )}
        {bg.type === 'gradient' && (
          <>
            <Row label="Цвет 2">
              <Color value={bg.color2} onChange={(v) => setBg({ color2: v })} allowEmpty={false} />
            </Row>
            <Row label="Угол">
              <Num value={bg.angle ?? 135} onChange={(v) => setBg({ angle: v })} suffix="°" />
            </Row>
          </>
        )}
        {bg.type === 'image' && (
          <Btn
            icon={ImagePlus}
            onClick={async () => {
              const f = await pickFile('image/*');
              if (f) setBg({ asset: await addAssetFile(f) });
            }}
          >
            {bg.asset ? 'Заменить картинку фона' : 'Выбрать картинку фона'}
          </Btn>
        )}
      </Section>

      {vids.length > 0 && (
        <Section title="Видео урока">
          {vids.map((k) => {
            const a = videos[k] ? assets[videos[k]] : undefined;
            return (
              <div key={k} className="flex flex-col gap-1.5 rounded-xl bg-[#faf9fd] p-2.5">
                <div className="text-[12px] font-semibold text-[#3b3858]">{VIDEO_KEYS[k]}</div>
                <div className="truncate text-[12px] text-[#6b6788]">{a ? `Файл: ${a.name}` : 'Стандартный файл из папки videos'}</div>
                <div className="flex gap-1.5">
                  <Btn
                    small
                    icon={Video}
                    onClick={async () => {
                      const f = await pickFile('video/*');
                      if (!f) return;
                      const id = await addAssetFile(f);
                      commit((p) => void (p.videos[k] = id));
                      toast('Видео заменено');
                    }}
                  >
                    {a ? 'Заменить' : 'Выбрать видео'}
                  </Btn>
                  {a && (
                    <Btn small onClick={() => commit((p) => void delete p.videos[k])}>
                      Стандартное
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      <Section title={`Мои элементы · ${slide.overlay.length}`} defaultOpen={slide.overlay.length > 0}>
        {slide.overlay.length === 0 && <Hint>Пока нет. Добавьте текст, картинку, видео, фигуру или кнопку на панели сверху.</Hint>}
        {[...slide.overlay]
          .sort((a, b) => b.z - a.z)
          .map((o) => (
            <button key={o.id} type="button" onClick={() => setUI({ sel: { kind: 'ov', id: o.id } })} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[#f6f5fb]">
              <span className="rounded bg-[#efeaff] px-1.5 text-[11px] font-semibold text-[#5b3ee0]">{KIND[o.kind]}</span>
              <span className="truncate">{o.name ?? o.text ?? (o.asset ? assets[o.asset]?.name : '') ?? ''}</span>
              {o.anim?.trigger === 'click' && <span className="ml-auto text-[11px] text-[#9a96b4]">клик {o.anim.order}</span>}
            </button>
          ))}
      </Section>

      {hiddenEls.length > 0 && (
        <Section title={`Скрытые элементы · ${hiddenEls.length}`}>
          {hiddenEls.map(([path]) => (
            <div key={path} className="flex items-center gap-2 text-[13px]">
              <span className="flex-1 truncate text-[#6b6788]">Элемент {path || 'слайда'}</span>
              <Btn small icon={Eye} onClick={() => editOver(path, (o) => void delete o.hidden)}>
                Показать
              </Btn>
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

const KIND: Record<string, string> = { text: 'Текст', image: 'Фото', video: 'Видео', shape: 'Фигура', button: 'Кнопка', html: 'Копия' };

/* ───────── свойства элемента ───────── */
function ElementPanel() {
  const sel = useUI((u) => u.sel)!;
  const cur = useUI((u) => u.cur);
  const slide = useProject((p) => findSlide(cur, p))!;
  const ov = sel.kind === 'ov' ? slide.overlay.find((o) => o.id === sel.id) : undefined;
  const over = sel.kind === 'el' ? slide.over[sel.path] ?? {} : undefined;
  if (sel.kind === 'ov' && !ov) return null;
  const style: StyleProps = (ov ? ov.style : over?.style) ?? {};
  const node = selectedNode();
  const isImg = node instanceof HTMLImageElement;
  const tag = sel.kind === 'el' ? describe(node) : KIND[ov!.kind];

  const setStyle = (patch: Partial<StyleProps>, merge = 'style') => {
    if (ov) editOverlay(ov.id, (o) => void (o.style = clean({ ...o.style, ...patch })), `${merge}:${ov.id}`);
    else if (sel.kind === 'el') editOver(sel.path, (o) => void (o.style = clean({ ...(o.style ?? {}), ...patch })), `${merge}:${sel.path}`);
  };
  const anim: Anim = (ov ? ov.anim : over?.anim) ?? { effect: 'none', duration: 0.6, delay: 0, trigger: 'auto', order: 1 };
  const setAnim = (patch: Partial<Anim>) => {
    const next = { ...anim, ...patch };
    const val = next.effect === 'none' && next.trigger === 'auto' && !next.hideAt ? undefined : next;
    if (ov) editOverlay(ov.id, (o) => void (o.anim = val), `anim:${ov.id}`);
    else if (sel.kind === 'el') editOver(sel.path, (o) => void (o.anim = val), `anim:${sel.path}`);
  };
  const isText = ov ? ov.kind === 'text' || ov.kind === 'button' : true;
  const cs = node ? getComputedStyle(node) : null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-[#ecebf3] px-4 py-3">
        <span className="rounded-md bg-[#efeaff] px-2 py-0.5 text-[12px] font-bold text-[#5b3ee0]">{tag}</span>
        <span className="flex-1 truncate text-[12px] text-[#9a96b4]">{sel.kind === 'el' ? 'элемент слайда' : 'мой элемент'}</span>
        {sel.kind === 'el' && (
          <button type="button" title="Выделить родительский блок (Esc)" onClick={selectParent} className="grid h-7 w-7 place-items-center rounded-md hover:bg-[#f1f0f7]">
            <CornerLeftUp size={15} />
          </button>
        )}
        {ov && (
          <button type="button" title={ov.locked ? 'Разблокировать' : 'Заблокировать перемещение'} onClick={() => editOverlay(ov.id, (o) => void (o.locked = !o.locked))} className="grid h-7 w-7 place-items-center rounded-md hover:bg-[#f1f0f7]">
            {ov.locked ? <Lock size={15} /> : <LockOpen size={15} />}
          </button>
        )}
      </div>

      {sel.kind === 'el' && <div className="px-4 pt-3"><Hint>Двойной щелчок по тексту — изменить его. Перетаскивайте мышкой, тяните за маркеры. Логика задания при этом не меняется.</Hint></div>}

      <Section title="Положение и размер">
        {ov ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Row compact label="X"><Num value={ov.box.x} onChange={(v) => editOverlay(ov.id, (o) => void (o.box.x = v ?? 0), 'bx')} /></Row>
              <Row compact label="Y"><Num value={ov.box.y} onChange={(v) => editOverlay(ov.id, (o) => void (o.box.y = v ?? 0), 'by')} /></Row>
              <Row compact label="Ширина"><Num value={ov.box.w} min={10} onChange={(v) => editOverlay(ov.id, (o) => void (o.box.w = Math.max(10, v ?? 10)), 'bw')} /></Row>
              <Row compact label="Высота"><Num value={ov.box.h} min={10} onChange={(v) => editOverlay(ov.id, (o) => void (o.box.h = Math.max(10, v ?? 10)), 'bh')} /></Row>
            </div>
            <Row label="Поворот"><Num value={ov.box.rot} suffix="°" onChange={(v) => editOverlay(ov.id, (o) => void (o.box.rot = v ?? 0), 'rot')} /></Row>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Row compact label="Сдвиг X"><Num value={over?.dx ?? 0} onChange={(v) => editOver(sel.kind === 'el' ? sel.path : '', (o) => void (o.dx = v || undefined), 'dx')} /></Row>
            <Row compact label="Сдвиг Y"><Num value={over?.dy ?? 0} onChange={(v) => editOver(sel.kind === 'el' ? sel.path : '', (o) => void (o.dy = v || undefined), 'dy')} /></Row>
            <Row compact label="Ширина"><Num value={over?.w} placeholder={node ? String(Math.round(node.offsetWidth)) : 'авто'} onChange={(v) => editOver(sel.kind === 'el' ? sel.path : '', (o) => void (o.w = v), 'w')} /></Row>
            <Row compact label="Высота"><Num value={over?.h} placeholder={node ? String(Math.round(node.offsetHeight)) : 'авто'} onChange={(v) => editOver(sel.kind === 'el' ? sel.path : '', (o) => void (o.h = v), 'h')} /></Row>
          </div>
        )}
      </Section>

      {isText && (
        <Section title="Текст">
          {ov && (ov.kind === 'text' || ov.kind === 'button') && <Text area value={ov.text ?? ''} onChange={(v) => editOverlay(ov.id, (o) => void (o.text = v), `text:${ov.id}`)} />}
          {sel.kind === 'el' && <Hint>Чтобы изменить сам текст — дважды щёлкните по нему на слайде.</Hint>}
          <Row label="Шрифт">
            <Select value={style.fontFamily ?? ''} onChange={(v) => setStyle({ fontFamily: v || undefined })} options={FONTS} />
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Row compact label="Размер"><Num value={style.fontSize} placeholder={cs ? String(Math.round(parseFloat(cs.fontSize))) : ''} suffix="px" onChange={(v) => setStyle({ fontSize: v })} /></Row>
            <Row compact label="Интервал"><Num value={style.lineHeight} step={0.1} placeholder="авто" onChange={(v) => setStyle({ lineHeight: v })} /></Row>
          </div>
          <Row label="Цвет текста"><Color value={style.color} onChange={(v) => setStyle({ color: v })} /></Row>
          <div className="flex gap-1.5">
            <Seg value={style.align} onChange={(v) => setStyle({ align: v })} options={[{ value: 'left', icon: AlignLeft, title: 'Влево' }, { value: 'center', icon: AlignCenter, title: 'По центру' }, { value: 'right', icon: AlignRight, title: 'Вправо' }]} />
            <button type="button" title="Жирный" onClick={() => setStyle({ fontWeight: (style.fontWeight ?? 400) >= 700 ? 400 : 800 })} className={cx('grid h-8 w-8 place-items-center rounded-lg', (style.fontWeight ?? 0) >= 700 ? 'bg-[#7b5cff] text-white' : 'bg-[#f1f0f7]')}><Bold size={15} /></button>
            <button type="button" title="Курсив" onClick={() => setStyle({ italic: !style.italic || undefined })} className={cx('grid h-8 w-8 place-items-center rounded-lg', style.italic ? 'bg-[#7b5cff] text-white' : 'bg-[#f1f0f7]')}><Italic size={15} /></button>
            <button type="button" title="Подчёркнутый" onClick={() => setStyle({ underline: !style.underline || undefined })} className={cx('grid h-8 w-8 place-items-center rounded-lg', style.underline ? 'bg-[#7b5cff] text-white' : 'bg-[#f1f0f7]')}><Underline size={15} /></button>
          </div>
        </Section>
      )}

      {(ov?.kind === 'image' || isImg) && (
        <Section title="Картинка">
          <Btn
            icon={ImagePlus}
            onClick={async () => {
              const f = await pickFile('image/*');
              if (!f) return;
              const id = await addAssetFile(f);
              if (ov) editOverlay(ov.id, (o) => void (o.asset = id));
              else if (sel.kind === 'el') editOver(sel.path, (o) => void (o.imgAsset = id));
            }}
          >
            {ov?.asset || over?.imgAsset ? 'Заменить картинку' : 'Выбрать картинку'}
          </Btn>
          {ov && (
            <Row label="Вписать">
              <Seg value={ov.fit ?? 'contain'} onChange={(v) => editOverlay(ov.id, (o) => void (o.fit = v))} options={[{ value: 'contain', label: 'Целиком' }, { value: 'cover', label: 'Заполнить' }]} />
            </Row>
          )}
        </Section>
      )}

      {ov?.kind === 'video' && (
        <Section title="Видео">
          <Btn
            icon={Video}
            onClick={async () => {
              const f = await pickFile('video/*');
              if (!f) return;
              const id = await addAssetFile(f);
              editOverlay(ov.id, (o) => void (o.asset = id));
            }}
          >
            {ov.asset ? 'Заменить видео' : 'Выбрать видео'}
          </Btn>
          {ov.asset && <div className="truncate text-[12px] text-[#6b6788]">{assetUrl(ov.asset) ? 'Видео подключено' : 'Файл не найден на этом компьютере'}</div>}
        </Section>
      )}

      {ov?.kind === 'shape' && (
        <Section title="Фигура">
          <Seg value={ov.shape ?? 'rect'} onChange={(v) => editOverlay(ov.id, (o) => void (o.shape = v))} options={[{ value: 'rect', label: 'Прямоуг.' }, { value: 'ellipse', label: 'Круг' }, { value: 'pill', label: 'Капсула' }, { value: 'line', label: 'Линия' }]} />
        </Section>
      )}

      {ov?.kind === 'button' && (
        <Section title="Действие кнопки">
          <Row label="При нажатии">
            <Select
              value={ov.action?.type ?? 'none'}
              onChange={(v) => editOverlay(ov.id, (o) => void (o.action = { type: v as 'next', value: o.action?.value }))}
              options={[
                { value: 'none', label: 'Ничего' },
                { value: 'next', label: 'Следующий шаг / слайд' },
                { value: 'prev', label: 'Назад' },
                { value: 'goto', label: 'Перейти к слайду №' },
                { value: 'url', label: 'Открыть ссылку' },
              ]}
            />
          </Row>
          {(ov.action?.type === 'goto' || ov.action?.type === 'url') && (
            <Row label={ov.action.type === 'goto' ? 'Номер слайда' : 'Ссылка'}>
              <Text value={ov.action.value ?? ''} onChange={(v) => editOverlay(ov.id, (o) => void (o.action = { ...(o.action ?? { type: 'url' }), value: v }), 'act')} />
            </Row>
          )}
        </Section>
      )}

      <Section title="Заливка, рамка, тень">
        <Row label="Фон"><Color value={style.bg} onChange={(v) => setStyle({ bg: v })} /></Row>
        <Row label="Рамка">
          <Color value={style.borderColor} onChange={(v) => setStyle({ borderColor: v })} />
          <div className="w-16"><Num value={style.borderWidth} suffix="px" min={0} onChange={(v) => setStyle({ borderWidth: v })} /></div>
        </Row>
        <Row label="Скругление"><Num value={style.radius} suffix="px" min={0} onChange={(v) => setStyle({ radius: v })} /></Row>
        <Row label="Отступ"><Num value={style.padding} suffix="px" min={0} onChange={(v) => setStyle({ padding: v })} /></Row>
        <Row label="Тень">
          <Select value={style.shadow ?? ''} onChange={(v) => setStyle({ shadow: (v || undefined) as StyleProps['shadow'] })} options={[{ value: '', label: 'Как в слайде' }, { value: 'none', label: 'Без тени' }, { value: 'soft', label: 'Мягкая' }, { value: 'hard', label: 'Наклейка' }, { value: 'glow', label: 'Свечение' }]} />
        </Row>
        <Row label="Прозрачность">
          <input type="range" min={0} max={1} step={0.05} value={style.opacity ?? 1} onChange={(e) => setStyle({ opacity: Number(e.target.value) === 1 ? undefined : Number(e.target.value) }, 'opacity')} className="flex-1" style={{ ['--fill' as string]: `${(style.opacity ?? 1) * 100}%` }} />
          <span className="w-9 text-right text-[12px]">{Math.round((style.opacity ?? 1) * 100)}%</span>
        </Row>
      </Section>

      <Section title="Анимация и порядок появления">
        <Row label="Эффект">
          <Select value={anim.effect} onChange={(v) => setAnim({ effect: v })} options={EFFECTS} />
        </Row>
        <Row label="Появление">
          <Seg value={anim.trigger} onChange={(v) => setAnim({ trigger: v })} options={[{ value: 'auto', label: 'Сразу' }, { value: 'click', label: 'По клику' }]} />
        </Row>
        {anim.trigger === 'click' && (
          <Row label="Номер клика"><Num value={anim.order} min={1} onChange={(v) => setAnim({ order: Math.max(1, v ?? 1) })} /></Row>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Row compact label="Длит."><Num value={anim.duration} step={0.1} min={0.1} suffix="с" onChange={(v) => setAnim({ duration: v ?? 0.6 })} /></Row>
          <Row compact label="Задержка"><Num value={anim.delay} step={0.1} min={0} suffix="с" onChange={(v) => setAnim({ delay: v ?? 0 })} /></Row>
        </div>
        <Row label="Скрыть на клике"><Num value={anim.hideAt || undefined} min={1} placeholder="не скрывать" onChange={(v) => setAnim({ hideAt: v || undefined })} /></Row>
        <Hint>«По клику» — элемент появится, когда учитель нажмёт «Келесі» / стрелку. Номер клика задаёт очередь появления.</Hint>
      </Section>

      <Section title="Слой">
        <div className="grid grid-cols-4 gap-1.5">
          <Btn small icon={ArrowUpToLine} onClick={() => layer('top')}>{''}</Btn>
          <Btn small icon={ArrowUp} onClick={() => layer('up')}>{''}</Btn>
          <Btn small icon={ArrowDown} onClick={() => layer('down')}>{''}</Btn>
          <Btn small icon={ArrowDownToLine} onClick={() => layer('bottom')}>{''}</Btn>
        </div>
      </Section>

      <div className="flex flex-col gap-2 p-4">
        {sel.kind === 'el' && (
          <Btn icon={RotateCcw} onClick={resetSelection}>
            Сбросить изменения элемента
          </Btn>
        )}
        <Btn danger icon={Trash2} onClick={deleteSelection}>
          {sel.kind === 'el' ? 'Скрыть элемент' : 'Удалить элемент'}
        </Btn>
      </div>
    </div>
  );
}

function clean(s: StyleProps): StyleProps {
  return Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined && v !== '')) as StyleProps;
}

function describe(n: Element | null): string {
  if (!n) return 'Элемент';
  const t = n.tagName.toLowerCase();
  if (t === 'button') return 'Кнопка';
  if (t === 'img') return 'Картинка';
  if (t === 'svg') return 'Значок';
  if (t === 'video') return 'Видео';
  if (t === 'iframe') return 'Окно браузера';
  if (/^h\d$/.test(t)) return 'Заголовок';
  if (t === 'p' || t === 'span' || (n.children.length === 0 && n.textContent?.trim())) return 'Текст';
  return 'Блок';
}
