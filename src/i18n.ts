/**
 * Internacionalização PT/EN.
 *
 * - Textos fixos do HTML usam data-i18n="chave" (texto), data-i18n-html="chave"
 *   (texto com <br>/<em>) ou data-i18n-attr="atributo:chave;atributo:chave".
 * - Textos do TypeScript usam t('chave', { variavel }).
 * - Conteúdo do portfólio (projetos, sobre, estudos de caso) fica em content.ts
 *   como { pt, en } e é lido com tr().
 *
 * Idioma inicial: ?lang=en|pt na URL → escolha salva → idioma do navegador.
 */

export type Lang = 'pt' | 'en';
export type Localized = { pt: string; en: string };

const pt = {
  'meta.title': 'Juan Fernandes — resolvo problemas com software',
  'meta.description': 'Portfólio de Juan Fernandes, desenvolvedor de software. Primeiro o problema, depois a ferramenta: projetos, estudos de caso, notas técnicas e contato.',

  'lang.switch': 'EN',
  'lang.switchLabel': 'Switch to English',
  'skip': 'Pular para a experiência',
  'nav.experience': 'experiência',
  'experience.eyebrow': 'EXPERIÊNCIA',
  'experience.title': 'Onde eu<br />trabalhei.',
  'experience.lead': '4 anos construindo APIs, sistemas multi-tenant e produtos web, de suporte técnico a liderança técnica.',
  'experience.education': 'Formação',
  'nav.site': 'o site',
  'nav.projects': 'projetos',
  'nav.about': 'sobre',
  'nav.principles': 'princípios',
  'nav.notes': 'notas',
  'nav.lab': 'lab',
  'nav.contact': 'contato',
  'nav.open': 'Abrir menu',
  'nav.close': 'Fechar menu',

  'xray.toggle': 'Raio-X: ver os bastidores do site',
  'xray.toggleTitle': 'Raio-X (tecla X): o site mostra como funciona por dentro',
  'xray.hintPre': 'aperte',
  'xray.hintPost': 'para ver por dentro',
  'drift.restore': '↺ restaurar',
  'drift.restoreTitle': 'Voltar ao visual original desta variante',
  'drift.label': 'mutação {m}%',
  'drift.milestone': 'Mutação em {p}% · use ↺ para restaurar',

  'hero.title': 'Juan Fernandes<span class="hero-role">Engenheiro de Software <em class="accent glitch" data-text="Full Stack">Full Stack</em></span>',
  'hero.cta.projects': 'Ver experiência',
  'hero.cta.contact': 'Entrar em contato',
  'hero.badgeTitle': 'Este site se adapta a cada visita com um algoritmo genético — veja como',
  'hero.hint': 'role para ver a experiência ↓',
  'hero.organism': 'Organismo de partículas gerado pelo algoritmo genético deste site',

  'projects.eyebrow': 'PROJETOS',
  'projects.title': 'Projetos selecionados.',
  'projects.lead': 'Projetos pessoais em que exploro arquitetura, busca e baixo nível. Cada animação mostra o que acontece por dentro.',
  'principles.eyebrow': 'COMO EU PENSO',
  'principles.title': 'A ferramenta<br />é consequência.',
  'principles.lead': 'Princípios que eu sigo, cada um com uma prova no próprio portfólio.',
  'principles.proof': 'Prova',
  'principles.see': 'ver',
  'notes.eyebrow': 'NOTAS TÉCNICAS',
  'notes.title': 'Escrevendo para<br />pensar melhor.',
  'notes.lead': 'Decisões, erros e números de projetos reais.',
  'notes.read': 'Ler nota',
  'notes.minutes': '{n} min de leitura',
  'notes.back': '← Voltar às notas',
  'notes.next': 'Próxima nota',
  'card.num': '{n}',
  'card.cta': 'Estudo de caso',

  'about.eyebrow': 'SOBRE',
  'about.title': 'Back-end sólido,<br />produto completo.',

  'lab.eyebrow': 'SOBRE ESTE SITE',
  'lab.title': 'Um portfólio que<br />evolui a cada visita.',
  'lab.lead': 'O diferencial deste site: um algoritmo genético testa variações de cor, forma 3D, tipografia e layout a cada visita, mede o engajamento e mantém as que funcionam. O conteúdo nunca muda, só a apresentação.',
  'lab.genomeTitle': 'GENOMA ATUAL · indivíduo {id} / geração {g}',
  'lab.vote.eyebrow': 'VOTE NESTA VARIANTE',
  'lab.vote.title': 'Gostou do que viu? Seu voto é o fitness.',
  'lab.vote.text': 'Tempo na página, profundidade de scroll e cliques já contam. O voto explícito pesa 3×.',
  'lab.vote.up': 'Gostei desta geração',
  'lab.vote.next': 'Mostrar outra variante',
  'lab.step1.title': 'Visitante chega',
  'lab.step1.text': 'Um indivíduo da população é sorteado e renderizado. Enquanto você usa a página, a mutação sobe aos poucos e o visual deriva.',
  'lab.step2.title': 'Fitness é medido',
  'lab.step2.text': 'Tempo ativo, scroll, cliques em projetos e contato, interação com o organismo e voto explícito.',
  'lab.step3.title': 'Seleção',
  'lab.step3.text': 'Quando todos os 8 indivíduos foram avaliados, os 2 melhores passam intactos (elitismo).',
  'lab.step4.title': 'Crossover',
  'lab.step4.text': 'Pares vencedores de torneio trocam genes. O filho herda cada gene de um dos pais.',
  'lab.step5.title': 'Mutação',
  'lab.step5.text': 'Cada gene tem 8% de chance de sofrer ruído gaussiano. Genes categóricos saltam para outro valor.',
  'lab.step6.title': 'Nova geração',
  'lab.step6.text': 'População substituída, geração +1, histórico salvo. O site fica diferente amanhã.',
  'lab.population': 'POPULAÇÃO ATUAL',
  'lab.chartCaption': 'melhor (linha) e média (área) por geração',
  'lab.chartEmpty': 'a primeira geração nasce quando os 8 indivíduos forem avaliados',
  'lab.store': 'persistência: {s} · {n} avaliações',
  'lab.store.local': 'local',
  'lab.store.shared': 'compartilhado',
  'lab.pop.new': 'novo',
  'lab.pop.title': '{shape} · nasceu na gen {g}',
  'lab.pop.parents': ' · pais {p}',
  'lab.params.pop': 'população {n}',
  'lab.params.elite': 'elitismo {n}',
  'lab.params.cross': 'crossover uniforme',
  'lab.params.mut': 'mutação {n}%',

  'hud': 'Este site evolui a cada visita · geração {g} →',
  'fit': 'fitness {f}',
  'fit.live': 'fitness {f} (ao vivo)',
  'ticker.gen': 'GERAÇÃO {v}',
  'ticker.ind': 'INDIVÍDUO {v}',
  'ticker.fit': 'FITNESS {v}',
  'ticker.shape': 'FORMA {v}',
  'ticker.skin': 'PELE {v}',
  'ticker.evals': '{v} AVALIAÇÕES',
  'stage.shape': 'forma: {v}',
  'stage.particles': 'partículas: {v}',
  'stage.drift': 'deriva: {v}%',
  'stage.rotation': 'rotação: {v} rad/s',

  'vote.feedback': 'voto registrado para {id} — ele entra na próxima seleção com vantagem.',
  'vote.toast': 'Gostei registrado · fitness +0.30',
  'variant.evolved': 'todos avaliados: nasceu a geração {g}. agora exibindo {id}.',
  'variant.next': 'variante {prev} avaliada ({s}). agora exibindo {id}.',
  'variant.toastGen': 'Nova geração {g} 🧬',
  'variant.toast': 'Variante {id}',
  'reset.confirm': 'Reiniciar a linhagem? O histórico evolutivo deste navegador será apagado.',
  'reset.toast': 'Linhagem reiniciada · geração 0',

  'contact.eyebrow': 'CONTATO',
  'contact.title': 'Vamos conversar sobre<br />o seu <em class="accent glitch" data-text="próximo projeto">próximo projeto</em>.',
  'contact.lead': 'Aberto a vagas remotas, inclusive internacionais. Respondo em até um dia útil.',
  'contact.send': 'Enviar e-mail',
  'contact.copy': 'Copiar e-mail',
  'contact.copied': 'E-mail copiado · {e}',

  'footer.made': '© <span data-year></span> Juan Fernandes · feito com Three.js + um algoritmo genético',
  'footer.individual': 'indivíduo',
  'footer.reset': 'reiniciar linhagem',

  'viz.crawler': 'crawler · {n} páginas · fila {q}',
  'viz.index': 'ÍNDICE',
  'viz.terms': '{n} termos',
  'viz.query': 'indice invertido',
  'viz.gen': 'geração {g} · {l}',
  'viz.eval': 'avaliando fitness',
  'viz.select': 'seleção · elitismo',
  'viz.breed': 'crossover + mutação',
  'viz.target': 'alvo hue {h}°',
  'viz.best': 'melhor fitness',
  'viz.decompiled': 'funções decompiladas {a}/{b}',
  'viz.window': 'port — nativo arm64',
  'viz.native': 'rodando nativo no macOS',

  'case.eyebrow': 'ESTUDO DE CASO',
  'case.back': '← Voltar aos projetos',
  'case.role': 'Papel',
  'case.status': 'Status',
  'case.stack': 'Stack',
  'case.code': 'Código',
  'case.github': 'Ver no GitHub',
  'case.next': 'Próximo projeto',
  'case.highlights': 'Destaques',

  'cv.download': 'Baixar currículo',
  'cv.downloading': 'montando o currículo…',
  'cv.done': 'currículo baixado ✓',
};

type Key = keyof typeof pt;

const en: Record<Key, string> = {
  'meta.title': 'Juan Fernandes — I solve problems with software',
  'meta.description': 'Portfolio of Juan Fernandes, software developer. Problem first, tool second: projects, case studies, technical notes and contact.',

  'lang.switch': 'PT',
  'lang.switchLabel': 'Mudar para português',
  'skip': 'Skip to experience',
  'nav.experience': 'experience',
  'experience.eyebrow': 'EXPERIENCE',
  'experience.title': 'Where I\'ve<br />worked.',
  'experience.lead': '4 years building APIs, multi-tenant systems and web products, from technical support to technical leadership.',
  'experience.education': 'Education',
  'nav.site': 'this site',
  'nav.projects': 'projects',
  'nav.about': 'about',
  'nav.principles': 'principles',
  'nav.notes': 'notes',
  'nav.lab': 'lab',
  'nav.contact': 'contact',
  'nav.open': 'Open menu',
  'nav.close': 'Close menu',

  'xray.toggle': 'X-ray: see how this site works',
  'xray.toggleTitle': 'X-ray (X key): the site shows how it works inside',
  'xray.hintPre': 'press',
  'xray.hintPost': 'to look inside',
  'drift.restore': '↺ restore',
  'drift.restoreTitle': "Back to this variant's original look",
  'drift.label': 'mutation {m}%',
  'drift.milestone': 'Mutation at {p}% · use ↺ to restore',

  'hero.title': 'Juan Fernandes<span class="hero-role"><em class="accent glitch" data-text="Full Stack">Full Stack</em> Software Engineer</span>',
  'hero.cta.projects': 'See experience',
  'hero.cta.contact': 'Get in touch',
  'hero.badgeTitle': 'This site adapts to each visit with a genetic algorithm — see how',
  'hero.hint': 'scroll to see experience ↓',
  'hero.organism': "Particle organism generated by this site's genetic algorithm",

  'projects.eyebrow': 'PROJECTS',
  'projects.title': 'Selected projects.',
  'projects.lead': 'Side projects where I explore architecture, search and low-level work. Each animation shows what happens inside.',
  'principles.eyebrow': 'HOW I THINK',
  'principles.title': 'The tool is<br />a consequence.',
  'principles.lead': 'Principles I follow, each with proof in this very portfolio.',
  'principles.proof': 'Proof',
  'principles.see': 'see',
  'notes.eyebrow': 'TECHNICAL NOTES',
  'notes.title': 'Writing to<br />think better.',
  'notes.lead': 'Decisions, mistakes and numbers from real projects.',
  'notes.read': 'Read note',
  'notes.minutes': '{n} min read',
  'notes.back': '← Back to notes',
  'notes.next': 'Next note',
  'card.num': '{n}',
  'card.cta': 'Case study',

  'about.eyebrow': 'ABOUT',
  'about.title': 'Solid back end,<br />complete product.',

  'lab.eyebrow': 'ABOUT THIS SITE',
  'lab.title': 'A portfolio that<br />evolves with every visit.',
  'lab.lead': 'What sets this site apart: a genetic algorithm tests variations of color, 3D shape, typography and layout on each visit, measures engagement and keeps what works. The content never changes, only the presentation.',
  'lab.genomeTitle': 'CURRENT GENOME · individual {id} / generation {g}',
  'lab.vote.eyebrow': 'VOTE FOR THIS VARIANT',
  'lab.vote.title': 'Like what you see? Your vote is the fitness.',
  'lab.vote.text': 'Time on page, scroll depth and clicks already count. An explicit vote weighs 3×.',
  'lab.vote.up': 'I like this generation',
  'lab.vote.next': 'Show another variant',
  'lab.step1.title': 'A visitor arrives',
  'lab.step1.text': 'An individual is drawn from the population and rendered. While you use the page, mutation slowly rises and the look drifts.',
  'lab.step2.title': 'Fitness is measured',
  'lab.step2.text': 'Active time, scroll, clicks on projects and contact, interaction with the organism and explicit votes.',
  'lab.step3.title': 'Selection',
  'lab.step3.text': 'Once all 8 individuals are evaluated, the top 2 carry over untouched (elitism).',
  'lab.step4.title': 'Crossover',
  'lab.step4.text': 'Tournament-winning pairs swap genes. The child inherits each gene from one of the parents.',
  'lab.step5.title': 'Mutation',
  'lab.step5.text': 'Each gene has an 8% chance of Gaussian noise. Categorical genes jump to another value.',
  'lab.step6.title': 'New generation',
  'lab.step6.text': 'Population replaced, generation +1, history saved. The site looks different tomorrow.',
  'lab.population': 'CURRENT POPULATION',
  'lab.chartCaption': 'best (line) and mean (area) per generation',
  'lab.chartEmpty': 'the first generation is born once all 8 individuals are evaluated',
  'lab.store': 'storage: {s} · {n} evaluations',
  'lab.store.local': 'local',
  'lab.store.shared': 'shared',
  'lab.pop.new': 'new',
  'lab.pop.title': '{shape} · born in gen {g}',
  'lab.pop.parents': ' · parents {p}',
  'lab.params.pop': 'population {n}',
  'lab.params.elite': 'elitism {n}',
  'lab.params.cross': 'uniform crossover',
  'lab.params.mut': 'mutation {n}%',

  'hud': 'This site evolves with every visit · generation {g} →',
  'fit': 'fitness {f}',
  'fit.live': 'fitness {f} (live)',
  'ticker.gen': 'GENERATION {v}',
  'ticker.ind': 'INDIVIDUAL {v}',
  'ticker.fit': 'FITNESS {v}',
  'ticker.shape': 'SHAPE {v}',
  'ticker.skin': 'SKIN {v}',
  'ticker.evals': '{v} EVALUATIONS',
  'stage.shape': 'shape: {v}',
  'stage.particles': 'particles: {v}',
  'stage.drift': 'drift: {v}%',
  'stage.rotation': 'rotation: {v} rad/s',

  'vote.feedback': 'vote recorded for {id} — it enters the next selection with an edge.',
  'vote.toast': 'Like recorded · fitness +0.30',
  'variant.evolved': 'all evaluated: generation {g} was born. now showing {id}.',
  'variant.next': 'variant {prev} evaluated ({s}). now showing {id}.',
  'variant.toastGen': 'New generation {g} 🧬',
  'variant.toast': 'Variant {id}',
  'reset.confirm': "Reset the lineage? This browser's evolutionary history will be erased.",
  'reset.toast': 'Lineage reset · generation 0',

  'contact.eyebrow': 'CONTACT',
  'contact.title': 'Let\'s talk about<br />your <em class="accent glitch" data-text="next project">next project</em>.',
  'contact.lead': 'Open to remote roles, including international. I reply within one business day.',
  'contact.send': 'Send email',
  'contact.copy': 'Copy email',
  'contact.copied': 'Email copied · {e}',

  'footer.made': '© <span data-year></span> Juan Fernandes · built with Three.js + a genetic algorithm',
  'footer.individual': 'individual',
  'footer.reset': 'reset lineage',

  'viz.crawler': 'crawler · {n} pages · queue {q}',
  'viz.index': 'INDEX',
  'viz.terms': '{n} terms',
  'viz.query': 'inverted index',
  'viz.gen': 'generation {g} · {l}',
  'viz.eval': 'evaluating fitness',
  'viz.select': 'selection · elitism',
  'viz.breed': 'crossover + mutation',
  'viz.target': 'target hue {h}°',
  'viz.best': 'best fitness',
  'viz.decompiled': 'functions decompiled {a}/{b}',
  'viz.window': 'port — native arm64',
  'viz.native': 'running natively on macOS',

  'case.eyebrow': 'CASE STUDY',
  'case.back': '← Back to projects',
  'case.role': 'Role',
  'case.status': 'Status',
  'case.stack': 'Stack',
  'case.code': 'Code',
  'case.github': 'View on GitHub',
  'case.next': 'Next project',
  'case.highlights': 'Highlights',

  'cv.download': 'Download CV',
  'cv.downloading': 'assembling the CV…',
  'cv.done': 'CV downloaded ✓',
};

const dict: Record<Lang, Record<Key, string>> = { pt, en };
const STORAGE = 'gdp:lang';

function initialLang(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'pt' || q === 'en') return q;
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    /* modo privado */
  }
  return (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

let lang: Lang = initialLang();
const listeners = new Set<(l: Lang) => void>();

export const getLang = (): Lang => lang;
/** Locale para números e datas. */
export const locale = (): string => (lang === 'pt' ? 'pt-BR' : 'en-US');

export function t(key: Key, vars?: Record<string, string | number>): string {
  let s = dict[lang][key] ?? dict.pt[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Lê um texto de conteúdo { pt, en }. */
export const tr = (l: Localized): string => l[lang];

/** Aplica os textos fixos do HTML (data-i18n, data-i18n-html, data-i18n-attr). */
export function applyStaticText(root: ParentNode = document): void {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as Key);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml as Key);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr!.split(';')) {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim() as Key));
    }
  });
}

export function setLang(next: Lang): void {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORAGE, next);
  } catch {
    /* ignora */
  }
  // se a página foi aberta com ?lang=, mantém a URL coerente com a escolha
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', next);
    history.replaceState(history.state, '', url);
  }
  applyStaticText();
  for (const fn of listeners) fn(next);
}

export function onLangChange(fn: (l: Lang) => void): void {
  listeners.add(fn);
}
