/**
 * Gera o currículo em PDF (PT e EN) em public/cv/.
 *
 *   npm run cv
 *
 * Nome, contato, stack, projetos e "sobre" vêm de src/content.ts (os mesmos do
 * site); experiência, formação e idiomas vêm de scripts/cv-data.ts.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import { about, profile, projects, skills } from '../src/content';
import type { Lang, Localized } from '../src/i18n';
import { education, experience, languages, type CvEntry } from './cv-data';

const A4: [number, number] = [595.28, 841.89];
const M = 42; // margem
const INK = rgb(0.1, 0.11, 0.14);
const MUTED = rgb(0.42, 0.45, 0.52);
const ACCENT = rgb(0.06, 0.55, 0.45);
const RULE = rgb(0.85, 0.87, 0.9);

const LABELS = {
  pt: {
    summary: 'Resumo',
    experience: 'Experiência',
    projects: 'Projetos',
    skills: 'Habilidades',
    education: 'Formação',
    languages: 'Idiomas',
    example: 'exemplo',
    exampleNote: 'Itens marcados como "exemplo" são ilustrativos e serão substituídos.',
    portfolio: 'Portfólio e estudos de caso',
  },
  en: {
    summary: 'Summary',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    education: 'Education',
    languages: 'Languages',
    example: 'example',
    exampleNote: 'Items marked "example" are placeholders and will be replaced.',
    portfolio: 'Portfolio and case studies',
  },
};

// fontes padrão do PDF só têm WinAnsi: troca o que não cabe
const clean = (s: string) => s.replace(/→/g, '->').replace(/[↗✓▮]/g, '').replace(/\s+/g, ' ').trim();

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(
    private doc: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
  ) {
    this.newPage();
  }

  newPage(): void {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - M;
  }

  ensure(h: number): void {
    if (this.y - h < M) this.newPage();
  }

  /** Quebra o texto em linhas que cabem na largura. */
  wrap(text: string, size: number, width: number, font = this.regular): string[] {
    const words = clean(text).split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  text(s: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; width?: number; gap?: number } = {}): void {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.bold : this.regular;
    const x = opts.x ?? M;
    const width = opts.width ?? A4[0] - M - x;
    const lh = size * 1.32;
    for (const line of this.wrap(s, size, width, font)) {
      this.ensure(lh);
      this.y -= lh;
      this.page.drawText(line, { x, y: this.y + size * 0.28, size, font, color: opts.color ?? INK });
    }
    this.y -= opts.gap ?? 0;
  }

  bullet(s: string): void {
    const size = 9.5;
    this.ensure(size * 1.4);
    const top = this.y;
    this.page.drawText('•', { x: M + 4, y: top - size * 1.32 + size * 0.28, size, font: this.regular, color: ACCENT });
    this.text(s, { size, x: M + 16, color: INK });
  }

  section(title: string): void {
    // título + pelo menos uma linha de conteúdo, para não ficar órfão no fim da página
    this.ensure(64);
    this.y -= 10;
    this.page.drawText(clean(title).toUpperCase(), { x: M, y: this.y - 9, size: 9.5, font: this.bold, color: ACCENT });
    this.y -= 16;
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4[0] - M, y: this.y }, thickness: 0.6, color: RULE });
    this.y -= 6;
  }

  /** Título à esquerda + texto à direita na mesma linha. */
  row(left: string, right: string, opts: { tag?: string } = {}): void {
    const size = 10.5;
    this.ensure(size * 1.6);
    this.y -= size * 1.5;
    const l = clean(left);
    this.page.drawText(l, { x: M, y: this.y, size, font: this.bold, color: INK });
    if (opts.tag) {
      const w = this.bold.widthOfTextAtSize(l, size);
      this.page.drawText(`(${opts.tag})`, { x: M + w + 6, y: this.y, size: 8, font: this.regular, color: MUTED });
    }
    const r = clean(right);
    this.page.drawText(r, { x: A4[0] - M - this.regular.widthOfTextAtSize(r, 9), y: this.y, size: 9, font: this.regular, color: MUTED });
  }
}

async function build(lang: Lang): Promise<Uint8Array> {
  const tr = (l: Localized) => l[lang];
  const txt = (v: string | Localized) => (typeof v === 'string' ? v : tr(v));
  const T = LABELS[lang];
  const doc = await PDFDocument.create();
  doc.setTitle(`${profile.name} — ${tr(profile.role)}`);
  doc.setAuthor(profile.name);
  doc.setLanguage(lang === 'pt' ? 'pt-BR' : 'en-US');
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, regular, bold);

  // cabeçalho
  w.page.drawRectangle({ x: 0, y: A4[1] - 6, width: A4[0], height: 6, color: ACCENT });
  w.text(profile.name, { size: 24, bold: true });
  w.text(`${tr(profile.role)} · ${tr(profile.location)}`, { size: 11, color: ACCENT, gap: 4 });
  const contact = [profile.email, profile.github.replace('https://', '')];
  if (!/linkedin\.com\/in\/?$/.test(profile.linkedin)) contact.push(profile.linkedin.replace('https://www.', ''));
  w.text(contact.join('   ·   '), { size: 9, color: MUTED });
  w.text(`${T.portfolio}: github.com/Juanf3rnandes/genetic-dev-portfolio`, { size: 9, color: MUTED, gap: 2 });

  w.section(T.summary);
  w.text(tr(about.paragraphs[0]), { size: 10 });

  const entry = (e: CvEntry) => {
    w.row(`${tr(e.title)} — ${tr(e.org)}`, tr(e.period), { tag: e.example ? T.example : undefined });
    for (const b of e.bullets) w.bullet(tr(b));
  };

  w.section(T.experience);
  experience.forEach(entry);

  w.section(T.projects);
  for (const p of projects) {
    w.row(p.title, p.tags.map(txt).join(' · '), { tag: p.status ? tr(p.status) : undefined });
    w.text(tr(p.description), { size: 9.5, color: MUTED });
    for (const h of p.highlights) w.bullet(tr(h));
  }

  w.section(T.skills);
  for (const g of skills) {
    w.text(`${tr(g.group)}: ${g.items.map(txt).join(', ')}`, { size: 9.5 });
  }

  w.section(T.education);
  education.forEach(entry);

  w.section(T.languages);
  w.text(languages.map((l) => `${tr(l.name)} — ${tr(l.level)}${l.example ? ` (${T.example})` : ''}`).join('   ·   '), { size: 9.5 });

  const hasExamples = experience.some((e) => e.example) || education.some((e) => e.example) || languages.some((l) => l.example);
  if (hasExamples) {
    w.y -= 10;
    w.text(T.exampleNote, { size: 8, color: MUTED });
  }

  return doc.save();
}

const out = new URL('../public/cv/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const lang of ['pt', 'en'] as const) {
  const bytes = await build(lang);
  const file = new URL(`juan-fernandes-cv-${lang}.pdf`, out);
  writeFileSync(file, bytes);
  console.log(`${file.pathname}  ${(bytes.length / 1024).toFixed(1)} kB`);
}
