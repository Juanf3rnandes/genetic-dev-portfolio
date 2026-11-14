/**
 * Notas técnicas: artigos em Markdown (content/notes/<slug>.<pt|en>.md) com
 * página própria em #/notes/<slug>. Sem dependência: o Markdown usado nos
 * artigos é simples (títulos, parágrafos, listas, código, ênfase, links).
 */

import { getLang, locale, t } from '../i18n';

const files = import.meta.glob<string>('../../content/notes/*.md', { query: '?raw', import: 'default', eager: true });

export interface Note {
  slug: string;
  lang: 'pt' | 'en';
  title: string;
  date: string;
  summary: string;
  body: string;
  minutes: number;
}

function parse(path: string, raw: string): Note {
  const [, slug, lang] = path.match(/([\w-]+)\.(pt|en)\.md$/)!;
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta: Record<string, string> = {};
  for (const line of (m?.[1] ?? '').split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  const body = m?.[2] ?? raw;
  const words = body.split(/\s+/).length;
  return { slug, lang: lang as 'pt' | 'en', title: meta.title ?? slug, date: meta.date ?? '', summary: meta.summary ?? '', body, minutes: Math.max(1, Math.round(words / 200)) };
}

const all = Object.entries(files).map(([p, raw]) => parse(p, raw));

/** Notas no idioma atual, da mais recente para a mais antiga. */
export function notes(): Note[] {
  return all.filter((n) => n.lang === getLang()).sort((a, b) => b.date.localeCompare(a.date));
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
}

export const noteMeta = (n: Note): string => `${formatDate(n.date)} · ${t('notes.minutes', { n: n.minutes })}`;

// ---------- Markdown mínimo ----------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text: string, href: string) => {
      const ext = /^https?:/.test(href);
      return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    });
}

export function markdown(src: string): string {
  const out: string[] = [];
  const lines = src.replace(/\r/g, '').split('\n');
  let para: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{2,3}) (.+)$/);
    if (h) {
      flush();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    const ul = line.match(/^- (.+)$/);
    const ol = line.match(/^\d+\. (.+)$/);
    if (ul || ol) {
      if (para.length) flush();
      const tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) {
        flush();
        list = { tag, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    if (line.startsWith('> ')) {
      flush();
      out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    if (list) flush();
    para.push(line.trim());
  }
  flush();
  return out.join('\n');
}

// ---------- página da nota ----------

const ROUTE = /^#\/notes\/([\w-]+)$/;
let current: string | null = null;

function jump(fn: () => void): void {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  fn();
  html.style.scrollBehavior = prev;
}

function render(slug: string): boolean {
  const list = notes();
  const n = list.find((x) => x.slug === slug);
  if (!n) return false;
  const root = document.querySelector<HTMLElement>('[data-note]')!;
  const idx = list.indexOf(n);
  const next = list[(idx + 1) % list.length];
  root.innerHTML = `
    <div class="case-inner note-inner">
      <a class="case-back mono" href="#notas"></a>
      <header class="case-head">
        <span class="eyebrow mono"></span>
        <h1 class="display" tabindex="-1"></h1>
        <p class="lede"></p>
      </header>
      <div class="note-body">${markdown(n.body)}</div>
      ${list.length > 1 ? `<a class="case-next" href="#/notes/${next.slug}"><span class="eyebrow mono"></span><span class="display"></span></a>` : ''}
    </div>`;
  root.querySelector('.case-back')!.textContent = t('notes.back');
  root.querySelector('.case-head .eyebrow')!.textContent = `${t('notes.eyebrow')} · ${noteMeta(n)}`;
  root.querySelector('.case-head h1')!.textContent = n.title;
  root.querySelector('.case-head .lede')!.textContent = n.summary;
  const nx = root.querySelector('.case-next');
  if (nx) {
    nx.querySelector('.eyebrow')!.textContent = `${t('notes.next')} →`;
    nx.querySelector('.display')!.textContent = next.title;
  }
  document.title = `${n.title} — Juan Fernandes`;
  return true;
}

function open(slug: string): void {
  if (!render(slug)) return close();
  current = slug;
  document.body.classList.add('note-open');
  document.querySelector<HTMLElement>('[data-note]')!.hidden = false;
  jump(() => window.scrollTo(0, 0));
  document.querySelector<HTMLElement>('[data-note] h1')?.focus({ preventScroll: true });
}

function close(): void {
  if (current === null) return;
  current = null;
  document.body.classList.remove('note-open');
  const root = document.querySelector<HTMLElement>('[data-note]')!;
  root.hidden = true;
  root.innerHTML = '';
  document.title = t('meta.title');
}

function route(): void {
  const m = location.hash.match(ROUTE);
  if (m) return open(m[1]);
  const wasOpen = current !== null;
  close();
  if (wasOpen && location.hash.length > 1 && !location.hash.startsWith('#/')) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    requestAnimationFrame(() => jump(() => target?.scrollIntoView()));
  }
}

export function initNotes(): void {
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) location.hash = '#notas';
  });
  route();
}

/** Troca de idioma com uma nota aberta. */
export function rerenderNote(): void {
  if (current && !render(current)) location.hash = '#notas';
}
