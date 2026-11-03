import favicon from '../../public/favicon.svg?raw';
import { attachAssetBlob, assetBlobUrl, getFilePid, getProject, loadProject, PRISTINE_HTML, saveNow, toast } from './store';
import { blobGet } from './idb';
import { VIDEO_KEYS } from './content';
import { download, makeZip, readZip, type ZipEntry } from './zip';
import { uid, type Project } from './types';

const OPEN_BAT = '@echo off\r\nrem Открыть презентацию в браузере (без интернета и без установки программ)\r\nstart "" "%~dp0index.html"\r\n';

const README = (missing: string[]) =>
  [
    'ПРЕЗЕНТАЦИЯ ОТКРЫТОГО УРОКА',
    '',
    'Как открыть:',
    '  1. Распакуйте архив (правой кнопкой -> «Извлечь всё»). Не запускайте изнутри архива.',
    '  2. Дважды нажмите OPEN.bat (или index.html).',
    '  3. Клавиша F — полный экран, стрелки — листать, E — редактор.',
    '',
    'Все изменения редактора уже внутри index.html. Видео, добавленные в редакторе, лежат в папке media.',
    'Интернет не нужен (кроме внешних ссылок: Plickers, LearningApps и т.п.).',
    ...(missing.length
      ? ['', 'Видео урока, которые не были добавлены в редакторе (положите их в папку videos с такими именами):', ...missing.map((m) => `  videos/${m}`)]
      : []),
    '',
  ].join('\r\n');

function embed(p: Project) {
  const json = JSON.stringify(p).replace(/</g, '\\u003c');
  return PRISTINE_HTML.replace(/<head([^>]*)>/i, `<head$1>\n<script id="ashyq-project" type="application/json">${json}</script>`);
}

async function videoBlob(id: string): Promise<Blob | undefined> {
  const b = await blobGet(id);
  if (b) return b;
  const u = assetBlobUrl(id);
  if (u) return fetch(u).then((r) => r.blob()).catch(() => undefined);
  return undefined;
}

/** Видео проекта, у которых нет файла в этом браузере (например, презентацию открыли на другом компьютере) */
export async function missingVideos(): Promise<string[]> {
  const p = getProject();
  const out: string[] = [];
  for (const a of Object.values(p.assets)) if (a.kind === 'video' && !(await videoBlob(a.id))) out.push(a.id);
  return out;
}

/** Подключить файлы из папки media (если презентацию редактируют на другом компьютере) */
export async function attachMediaFiles(files: FileList | File[]) {
  const p = getProject();
  let n = 0;
  for (const f of Array.from(files)) {
    const a = Object.values(p.assets).find((x) => x.path && x.path.split('/').pop() === f.name);
    if (a) {
      await attachAssetBlob(a.id, f);
      n++;
    }
  }
  toast(n ? `Подключено видео: ${n}` : 'Файлы не подошли — выберите папку media из архива');
  return n;
}

/** Экспорт всей презентации в ZIP: index.html (со всеми правками) + OPEN.bat + media/ */
export async function exportZip() {
  await saveNow();
  const p = structuredClone(getProject());
  const out: Project = { ...p, pid: uid('p'), updated: Date.now() };
  const folder = `AshyqSabaq-${new Date().toISOString().slice(0, 10)}`;
  const entries: ZipEntry[] = [
    { name: `${folder}/index.html`, data: embed(out) },
    { name: `${folder}/OPEN.bat`, data: OPEN_BAT },
    { name: `${folder}/favicon.svg`, data: favicon },
  ];
  let skipped = 0;
  for (const a of Object.values(p.assets)) {
    if (a.kind !== 'video' || !a.path) continue;
    const b = await videoBlob(a.id);
    if (b) entries.push({ name: `${folder}/${a.path}`, data: b });
    else skipped++;
  }
  const notAttached = Object.keys(VIDEO_KEYS)
    .filter((k) => !p.videos[k])
    .map((k) => ({ cyberbullying: 'cyberbullying.mp4', aiLesson: 'ai-lesson.mp4', teacher: 'teacher.mp4', break: 'break.mp4' })[k] as string);
  entries.push({ name: `${folder}/README.txt`, data: README(notAttached) });
  entries.push({ name: `${folder}/videos/README.txt`, data: 'Сюда можно положить стандартные видео урока:\r\n' + notAttached.map((m) => '  ' + m).join('\r\n') + '\r\n' });
  const zip = await makeZip(entries);
  download(zip, `${folder}.zip`);
  toast(skipped ? `ZIP скачан, но ${skipped} видео без файла — подключите папку media` : 'ZIP скачан — его можно открыть на любом компьютере');
}

/** Импорт ранее сохранённой презентации: .zip, index.html или .json */
export async function importFile(file: File) {
  let project: Project | null = null;
  const files = new Map<string, Blob>();
  const lower = file.name.toLowerCase();
  const parseHtml = (html: string) => {
    const el = new DOMParser().parseFromString(html, 'text/html').getElementById('ashyq-project');
    return el?.textContent ? (JSON.parse(el.textContent) as Project) : null;
  };
  if (lower.endsWith('.zip')) {
    const z = await readZip(file);
    z.forEach((v, k) => files.set(k, v));
    const html = [...z.keys()].filter((k) => k.toLowerCase().endsWith('index.html')).sort((a, b) => a.length - b.length)[0];
    if (html) project = parseHtml(await z.get(html)!.text());
  } else if (lower.endsWith('.html') || lower.endsWith('.htm')) project = parseHtml(await file.text());
  else if (lower.endsWith('.json')) project = JSON.parse(await file.text()) as Project;
  if (!project) {
    toast('В файле нет сохранённой презентации редактора');
    return false;
  }
  for (const a of Object.values(project.assets ?? {})) {
    if (a.kind !== 'video' || !a.path) continue;
    const key = [...files.keys()].find((k) => k.endsWith(a.path!));
    if (key) await attachAssetBlob(a.id, files.get(key)!);
  }
  await loadProject({ ...project, pid: getFilePid(), updated: Date.now() });
  toast('Презентация загружена');
  return true;
}
