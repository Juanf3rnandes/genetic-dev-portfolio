import { GENE_KEYS, GENE_SPEC, type Genome } from '../ga/genome';
import { fitnessOf, MUTATION_RATE, POP_SIZE, ELITISM, type Evolution } from '../ga/engine';
import { about, education, experience, highlights, principles, profile, projects, skills, skillsNote } from '../content';
import { noteMeta, notes } from '../projects/notes';
import { locale, t, tr, type Localized } from '../i18n';

const txt = (v: string | Localized): string => (typeof v === 'string' ? v : tr(v));
import { mountViz } from '../projects/viz';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`elemento não encontrado: ${sel}`);
  return el;
};

const fmt = (k: keyof Genome, v: Genome[keyof Genome]): string => {
  if (typeof v !== 'number') return String(v);
  if (k === 'hue' || k === 'hue2') return `${v.toFixed(0)}°`;
  if (k === 'particles') return v.toLocaleString(locale());
  if (k === 'cardRadius') return `${v.toFixed(0)}px`;
  if (k === 'fontWeight') return String(v);
  return v.toFixed(2);
};

const PROJECT_KEY = 'gdp:projects:v1';

/** Pontuação por projeto (cliques) — fenótipo de ordem dos cards. */
export function loadProjectScores(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}
export function bumpProject(id: string): void {
  const s = loadProjectScores();
  s[id] = (s[id] ?? 0) + 1;
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function renderStatic(onProjectClick: (id: string) => void, onContactClick: () => void): void {
  $('[data-handle]').textContent = profile.handle;
  $('[data-lede]').textContent = tr(profile.lede);
  $('[data-hero-kicker]').textContent = tr(profile.location);

  const aboutEl = $('[data-about]');
  aboutEl.innerHTML = '';
  for (const para of about.paragraphs) {
    const el = document.createElement('p');
    el.textContent = tr(para);
    aboutEl.appendChild(el);
  }
  const facts = $('[data-facts]');
  facts.innerHTML = '';
  for (const [k, v] of about.facts) {
    const dt = document.createElement('dt');
    dt.textContent = tr(k);
    const dd = document.createElement('dd');
    dd.textContent = tr(v);
    facts.append(dt, dd);
  }
  $('[data-year]').textContent = String(new Date().getFullYear());

  // números de destaque no hero
  const hl = $('[data-highlights]');
  hl.innerHTML = '';
  for (const h of highlights) {
    const div = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = h.value;
    const dd = document.createElement('dd');
    dd.textContent = tr(h.label);
    div.append(dt, dd);
    hl.appendChild(div);
  }

  // experiência profissional (mesma fonte do currículo em PDF)
  const jobs = $('[data-experience]');
  jobs.innerHTML = '';
  for (const j of experience) {
    const li = document.createElement('li');
    li.className = 'job';
    li.innerHTML = `
      <div class="job-meta mono"><span class="job-period"></span></div>
      <div class="job-body">
        <h3 class="job-title"><span class="job-role"></span> <span class="job-at">·</span> <span class="job-company"></span></h3>
        <p class="job-context muted"></p>
        <ul class="job-points">${j.bullets.map(() => '<li></li>').join('')}</ul>
        <div class="chips">${j.stack.map(() => '<span class="chip"></span>').join('')}</div>
      </div>`;
    li.querySelector('.job-period')!.textContent = tr(j.period);
    li.querySelector('.job-role')!.textContent = tr(j.role);
    li.querySelector('.job-company')!.textContent = j.company;
    li.querySelector('.job-context')!.textContent = tr(j.context);
    li.querySelectorAll('.job-points li').forEach((el, i) => (el.textContent = tr(j.bullets[i])));
    li.querySelectorAll('.chip').forEach((el, i) => (el.textContent = j.stack[i]));
    jobs.appendChild(li);
  }
  const edu = $('[data-education]');
  edu.innerHTML = '<span class="edu-label accent"></span><span class="edu-text"></span>';
  edu.querySelector('.edu-label')!.textContent = t('experience.education');
  edu.querySelector('.edu-text')!.textContent = `${tr(education.degree)} · ${education.school} · ${tr(education.period)}`;

  const scores = loadProjectScores();
  const ordered = [...projects].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const cards = $('[data-projects]');
  cards.innerHTML = '';
  ordered.forEach((p, idx) => {
    const a = document.createElement('a');
    a.className = 'card project';
    a.href = `#/case/${p.id}`;
    // card compacto: animação, título, uma frase, as 2 tecnologias principais e o CTA.
    // Os destaques e a stack completa ficam no estudo de caso (#/case/<id>).
    const tags = p.tags.slice(0, 2);
    a.innerHTML = `
      <div class="card-bar mono" aria-hidden="true"><span></span></div>
      <div class="project-viz"><canvas aria-hidden="true"></canvas></div>
      <div class="project-body">
        <div class="card-head mono"><span class="num"></span><span class="status"></span></div>
        <h3></h3>
        <p class="project-desc"></p>
        <div class="project-foot">
          <div class="chips">${tags.map(() => `<span class="chip"></span>`).join('')}</div>
          <span class="card-link"><span class="lbl"></span> <span class="arrow" aria-hidden="true">→</span></span>
        </div>
      </div>`;
    a.querySelector('.card-bar span')!.textContent = `~/projects/${p.id}`;
    a.querySelector('.num')!.textContent = t('card.num', { n: String(idx + 1).padStart(2, '0') });
    a.querySelector('.status')!.textContent = p.status ? tr(p.status) : '';
    a.querySelector('h3')!.textContent = p.title;
    a.querySelector('.project-desc')!.textContent = tr(p.description);
    a.querySelectorAll('.chip').forEach((c, i) => (c.textContent = txt(tags[i])));
    a.querySelector('.card-link .lbl')!.textContent = t('card.cta');
    a.addEventListener('click', () => onProjectClick(p.id));
    cards.appendChild(a);
    mountViz(a.querySelector('canvas')!, p.viz);
  });

  const sk = $('[data-skills]');
  sk.innerHTML = '';
  for (const g of skills) {
    const div = document.createElement('div');
    div.className = 'skill-group';
    const h = document.createElement('h3');
    h.textContent = tr(g.group);
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const it of g.items) {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = txt(it);
      chips.appendChild(c);
    }
    div.append(h, chips);
    sk.appendChild(div);
  }

  $('[data-skills-note]').textContent = tr(skillsNote);

  // princípios: afirmação + prova + link para conferir
  const pr = $('[data-principles]');
  pr.innerHTML = '';
  principles.forEach((p, i) => {
    const el = document.createElement('article');
    el.className = 'panel principle';
    el.innerHTML = `<span class="eyebrow mono"></span><h3 class="display"></h3><p class="principle-text"></p>
      <p class="principle-proof mono"><span class="lbl"></span> <span class="txt"></span></p><a class="card-link principle-link"></a>`;
    el.querySelector('.eyebrow')!.textContent = String(i + 1).padStart(2, '0');
    el.querySelector('h3')!.textContent = tr(p.title);
    el.querySelector('.principle-text')!.textContent = tr(p.text);
    el.querySelector('.principle-proof .lbl')!.textContent = `${t('principles.proof')}:`;
    el.querySelector('.principle-proof .txt')!.textContent = tr(p.proof);
    const a = el.querySelector<HTMLAnchorElement>('.principle-link')!;
    a.href = p.href;
    a.innerHTML = '<span class="lbl"></span> <span>→</span>';
    a.querySelector('.lbl')!.textContent = t('principles.see');
    pr.appendChild(el);
  });

  // notas técnicas
  const nl = $('[data-notes]');
  nl.innerHTML = '';
  for (const n of notes()) {
    const a = document.createElement('a');
    a.className = 'card note-card';
    a.href = `#/notes/${n.slug}`;
    a.innerHTML = `<span class="eyebrow mono"></span><h3></h3><p></p><span class="card-link"><span class="lbl"></span> <span>→</span></span>`;
    a.querySelector('.eyebrow')!.textContent = noteMeta(n);
    a.querySelector('h3')!.textContent = n.title;
    a.querySelector('p')!.textContent = n.summary;
    a.querySelector('.card-link .lbl')!.textContent = t('notes.read');
    nl.appendChild(a);
  }

  const links = $('[data-contact-links]');
  links.innerHTML = '';
  const mk = (label: string, href: string, primary = false) => {
    const a = document.createElement('a');
    a.className = `btn ${primary ? 'btn-primary' : 'btn-ghost'}`;
    a.href = href;
    a.textContent = label;
    if (!href.startsWith('mailto:')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.addEventListener('click', onContactClick);
    return a;
  };
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'btn btn-ghost';
  copy.textContent = t('contact.copy');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      toast(t('contact.copied', { e: profile.email }));
    } catch {
      toast(profile.email);
    }
    onContactClick();
  });
  const cv = document.createElement('button');
  cv.type = 'button';
  cv.className = 'btn btn-ghost cv-btn';
  cv.dataset.cvDownload = '';
  cv.innerHTML = '<span class="cv-ico" aria-hidden="true">↓</span> ';
  cv.append(t('cv.download'));
  links.append(mk(t('contact.send'), `mailto:${profile.email}`, true), cv, copy, mk('GitHub', profile.github), mk('LinkedIn', profile.linkedin));
  const mail = $('[data-contact-mail]');
  mail.innerHTML = '';
  const ma = document.createElement('a');
  ma.href = `mailto:${profile.email}`;
  ma.textContent = profile.email;
  ma.addEventListener('click', onContactClick);
  mail.append(ma);
  const navContact = $('[data-contact]');
  if (!navContact.dataset.bound) {
    navContact.dataset.bound = '1';
    navContact.addEventListener('click', onContactClick);
  }

  $('[data-ga-params]').innerHTML = [
    t('lab.params.pop', { n: POP_SIZE }),
    t('lab.params.elite', { n: ELITISM }),
    t('lab.params.cross'),
    t('lab.params.mut', { n: (MUTATION_RATE * 100).toFixed(0) }),
  ]
    .map((s) => `<span>${s}</span>`)
    .join('');
}

/** Estado da formação (mutação que começa em 100% e cai conforme o visitante interage). */
const formation = { rate: MUTATION_RATE, progress: 0 };
let shown: Genome | null = null;

let lastFit: number | null = null;

function hudText(evo: Evolution, fit: number | null): string {
  const st = evo.state;
  if (fit !== null) lastFit = fit;
  const f = lastFit === null ? '—' : lastFit.toFixed(2);
  return t('hud', { g: st.generation, f, m: (formation.rate * 100).toFixed(0) });
}

/** Atualização barata a cada 2 s: só os textos que mostram o fitness ao vivo. */
export function renderLive(evo: Evolution, liveFitness: number): void {
  setText('[data-hud]', hudText(evo, liveFitness));
  setText('[data-genome-fit]', t('fit.live', { f: liveFitness.toFixed(2) }));
}

/** Só escreve no DOM se o texto mudou — evita relayout à toa. */
function setText(sel: string, text: string): void {
  const el = $(sel);
  if (el.textContent !== text) el.textContent = text;
}

const pctOf = (k: keyof Genome, v: Genome[keyof Genome]): number => {
  const spec = GENE_SPEC[k];
  return spec.kind === 'num'
    ? ((v as number) - spec.min) / (spec.max - spec.min)
    : ((spec.options as readonly unknown[]).indexOf(v) + 1) / spec.options.length;
};

/**
 * Mostra o genoma EXIBIDO agora (durante a formação ele difere do indivíduo):
 * painel de genes, barras de DNA, metadados do organismo e HUD.
 * Atualiza os nós existentes em vez de recriá-los — roda a cada passo de formação.
 */
export function renderGenome(evo: Evolution, g: Genome, rate: number, progress: number, liveFitness: number | null = null): void {
  shown = g;
  formation.rate = rate;
  formation.progress = progress;
  setText('[data-hud]', hudText(evo, liveFitness));
  document.documentElement.style.setProperty('--formation', progress.toFixed(3));
  const bar = document.querySelector<HTMLElement>('[data-formation]');
  bar?.classList.toggle('done', progress <= 0);
  // pílula fixa com o nível de mutação e o botão de restaurar
  const pill = document.querySelector<HTMLElement>('[data-drift-pill]');
  if (pill) {
    pill.hidden = progress <= 0;
    const label = pill.querySelector('[data-drift-label]');
    if (label) label.textContent = t('drift.label', { m: (rate * 100).toFixed(0) });
  }

  $('[data-stage-meta]').innerHTML = [
    t('stage.shape', { v: g.shape }),
    t('stage.particles', { v: g.particles.toLocaleString(locale()) }),
    `hue: ${g.hue.toFixed(0)}° / ${g.hue2.toFixed(0)}°`,
    progress > 0 ? t('stage.drift', { v: (progress * 100).toFixed(0) }) : t('stage.rotation', { v: g.rotSpeed.toFixed(2) }),
  ]
    .map((s) => `<span>${s}</span>`)
    .join('');

  // genes: cria as linhas uma vez, depois só atualiza valor e barra
  const genes = $('[data-genes]');
  if (genes.children.length !== GENE_KEYS.length) {
    genes.innerHTML = '';
    GENE_KEYS.forEach((k, idx) => {
      const row = document.createElement('div');
      row.className = 'gene';
      row.innerHTML = `<span class="k"></span><span class="v"></span><div class="bar"><i class="${idx % 2 ? 'b' : ''}"></i></div>`;
      row.querySelector('.k')!.textContent = k;
      genes.appendChild(row);
    });
  }
  GENE_KEYS.forEach((k, idx) => {
    const row = genes.children[idx] as HTMLElement;
    const v = row.querySelector('.v')!;
    const text = fmt(k, g[k]);
    if (v.textContent !== text) v.textContent = text;
    (row.querySelector('.bar i') as HTMLElement).style.width = `${Math.round(pctOf(k, g[k]) * 100)}%`;
  });

  // barras de DNA no rodapé do hero
  const dna = $('[data-dna]');
  if (dna.children.length !== GENE_KEYS.length) {
    dna.innerHTML = '';
    GENE_KEYS.forEach((_, i) => {
      const b = document.createElement('i');
      b.className = i % 3 === 0 ? 'a' : i % 3 === 1 ? 'b' : '';
      dna.appendChild(b);
    });
  }
  GENE_KEYS.forEach((k, i) => {
    (dna.children[i] as HTMLElement).style.height = `${4 + pctOf(k, g[k]) * 18}px`;
  });
}

export function renderDynamic(evo: Evolution, liveFitness: number | null): void {
  const st = evo.state;
  const g = shown ?? evo.current.genome;
  const ind = st.population.find((i) => i.id === evo.current.id);
  const observed = ind && ind.evals ? fitnessOf(ind) : null;
  const shownFit = liveFitness ?? observed;

  $('[data-gen-short]').textContent = `g${st.generation}`;
  $('[data-gen-label]').textContent = `gen ${st.generation}`;
  $('[data-ind-id]').textContent = evo.current.id;
  const store = evo.storeLabel === 'local' ? t('lab.store.local') : t('lab.store.shared');
  $('[data-store-label]').textContent = t('lab.store', { s: store, n: st.totalEvals });
  $('[data-genome-title]').textContent = t('lab.genomeTitle', { id: evo.current.id, g: st.generation });

  // faixa "ticker" entre seções (gene divider): dados do GA, repetidos para o loop contínuo
  const tick = [
    t('ticker.gen', { v: st.generation }),
    t('ticker.ind', { v: evo.current.id }),
    t('ticker.fit', { v: shownFit === null ? '—' : shownFit.toFixed(2) }),
    t('ticker.shape', { v: evo.current.genome.shape }),
    t('ticker.skin', { v: evo.current.genome.skin }),
    t('ticker.evals', { v: st.totalEvals }),
  ].join('  ///  ');
  const ticker = `${tick}  ///  `.repeat(6);
  document.querySelectorAll<HTMLElement>('main > .section').forEach((sec) => {
    if (sec.dataset.ticker !== ticker) sec.dataset.ticker = ticker;
  });
  const fitStr = shownFit === null ? '—' : shownFit.toFixed(2);
  $('[data-genome-fit]').textContent = liveFitness !== null ? t('fit.live', { f: fitStr }) : t('fit', { f: fitStr });

  renderGenome(evo, g, formation.rate, formation.progress, shownFit);

  // população
  const pop = $('[data-population]');
  pop.innerHTML = '';
  const maxFit = Math.max(0.01, ...st.population.map(fitnessOf));
  for (const i of [...st.population].sort((a, b) => fitnessOf(b) - fitnessOf(a))) {
    const row = document.createElement('div');
    row.className = `ind${i.id === evo.current.id ? ' current' : ''}`;
    const f = fitnessOf(i);
    row.innerHTML = `<span class="sw"></span><span class="id"></span><div class="bar"><i></i></div><span class="n"></span>`;
    (row.querySelector('.sw') as HTMLElement).style.background = `hsl(${i.genome.hue} ${i.genome.sat * 100}% 65%)`;
    row.querySelector('.id')!.textContent = `${i.id}${i.id === evo.current.id ? ' ◂' : ''}`;
    (row.querySelector('.bar i') as HTMLElement).style.width = `${(f / maxFit) * 100}%`;
    row.querySelector('.n')!.textContent = i.evals ? `${f.toFixed(2)}·${i.evals}` : t('lab.pop.new');
    row.title = t('lab.pop.title', { shape: i.genome.shape, g: i.born }) + (i.parents.length ? t('lab.pop.parents', { p: i.parents.join(' × ') }) : '');
    pop.appendChild(row);
  }

  drawHistory(evo);
}

function drawHistory(evo: Evolution): void {
  const canvas = $<HTMLCanvasElement>('[data-history]');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#7cf5c4';
  const accent2 = css.getPropertyValue('--accent2').trim() || '#b48cff';
  const muted = css.getPropertyValue('--muted').trim() || '#8a8f9e';
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const h = evo.state.history;
  const pts = h.length ? h : [{ gen: 0, best: 0, mean: 0 }];
  const n = pts.length;
  const pad = 24;
  const x = (i: number) => pad + (n > 1 ? (i / (n - 1)) * (W - pad * 2) : (W - pad * 2) / 2);
  const y = (v: number) => H - pad - v * (H - pad * 2);

  ctx.strokeStyle = muted;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  for (const v of [0, 0.5, 1]) {
    ctx.beginPath();
    ctx.moveTo(pad, y(v));
    ctx.lineTo(W - pad, y(v));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (n === 1 && !h.length) {
    ctx.fillStyle = muted;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t('lab.chartEmpty'), W / 2, H / 2);
    return;
  }

  // média: área
  ctx.beginPath();
  ctx.moveTo(x(0), y(0));
  pts.forEach((p, i) => ctx.lineTo(x(i), y(p.mean)));
  ctx.lineTo(x(n - 1), y(0));
  ctx.closePath();
  ctx.fillStyle = accent2;
  ctx.globalAlpha = 0.18;
  ctx.fill();
  ctx.globalAlpha = 1;

  // melhor: linha
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p.best)) : ctx.moveTo(x(i), y(p.best))));
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(x(i), y(p.best), 3, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  });

  ctx.fillStyle = muted;
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`gen ${pts[0].gen}`, pad, H - 6);
  ctx.textAlign = 'right';
  ctx.fillText(`gen ${pts[n - 1].gen}`, W - pad, H - 6);
}

let toastTimer = 0;
export function toast(msg: string): void {
  const el = $('[data-toast]');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 3200);
}
