/**
 * Conteúdo do portfólio, em português e inglês. Edite aqui — o algoritmo
 * genético nunca altera texto. Cada texto traduzível é { pt, en }.
 */

import type { Localized } from './i18n';

export const profile = {
  name: 'Juan Fernandes',
  handle: 'JUAN.DEV',
  role: { pt: 'Desenvolvedor de software', en: 'Software developer' } as Localized,
  stack: ['Laravel', 'Node.js', 'TypeScript', 'React'],
  lede: {
    pt: 'Primeiro entendo o problema, depois escolho a ferramenta. Já foi Laravel, Node, TypeScript, C e até assembly MIPS — vai ser o que o próximo problema pedir.',
    en: 'First I understand the problem, then I pick the tool. So far that has meant Laravel, Node, TypeScript, C and even MIPS assembly — next it will be whatever the problem needs.',
  } as Localized,
  location: { pt: 'Brasil · remoto para o mundo', en: 'Brazil · remote worldwide' } as Localized,
  github: 'https://github.com/Juanf3rnandes',
  linkedin: 'https://www.linkedin.com/in/', // TODO: coloque a URL do seu perfil
  email: 'fernandesjuan633@gmail.com',
};

/** Parágrafos e fatos da seção "Sobre". */
export const about = {
  paragraphs: [
    {
      pt: 'Gosto de programar porque programar resolve problemas. A linguagem e o framework vêm depois: no dia a dia isso tem sido APIs, painéis e produtos web com Laravel, Node.js, TypeScript e React, mas a escolha depende do trabalho, não de preferência.',
      en: "I like programming because programming solves problems. Language and framework come second: day to day that has meant APIs, dashboards and web products with Laravel, Node.js, TypeScript and React, but the choice depends on the job, not on preference.",
    },
    {
      pt: 'Quando não entendo algo, abro e olho por dentro. Foi assim que escrevi um motor de busca do zero, que estou portando um jogo de N64 para macOS lendo assembly, e que este portfólio virou um algoritmo genético.',
      en: "When I don't understand something, I open it up and look inside. That's how I ended up writing a search engine from scratch, porting an N64 game to macOS by reading assembly, and turning this portfolio into a genetic algorithm.",
    },
  ] as Localized[],
  facts: [
    [
      { pt: 'Base', en: 'Based in' },
      { pt: 'Brasil · remoto para o mundo', en: 'Brazil · remote worldwide' },
    ],
    [
      { pt: 'Foco', en: 'Focus' },
      { pt: 'Resolver o problema certo', en: 'Solving the right problem' },
    ],
    [
      { pt: 'Stack', en: 'Stack' },
      { pt: 'A que o problema pedir', en: 'Whatever the problem needs' },
    ],
    [
      { pt: 'Aberto a', en: 'Open to' },
      { pt: 'Vagas remotas e projetos com problema de verdade', en: 'Remote roles and projects with real problems' },
    ],
  ] as [Localized, Localized][],
};

/**
 * "Como eu penso": cada princípio vem com uma PROVA tirada dos projetos,
 * e um link para onde dá para conferir.
 */
export interface Principle {
  title: Localized;
  text: Localized;
  proof: Localized;
  href: string;
}

export const principles: Principle[] = [
  {
    title: { pt: 'Problema antes da ferramenta', en: 'Problem before tool' },
    text: {
      pt: 'Entendo o que precisa ser resolvido, para quem e com quais restrições. Só depois escolho a stack.',
      en: 'I figure out what needs solving, for whom and under which constraints. Only then do I pick the stack.',
    },
    proof: {
      pt: 'Três projetos, três stacks: Node para o buscador, TypeScript sem framework para este site, C para o port.',
      en: 'Three projects, three stacks: Node for the search engine, framework-free TypeScript for this site, C for the port.',
    },
    href: '#projetos',
  },
  {
    title: { pt: 'Fundamentos duram mais que frameworks', en: 'Fundamentals outlive frameworks' },
    text: {
      pt: 'Frameworks mudam a cada poucos anos. Estruturas de dados, HTTP, SQL e como a máquina funciona continuam valendo.',
      en: 'Frameworks change every few years. Data structures, HTTP, SQL and how the machine works keep paying off.',
    },
    proof: {
      pt: 'Motor de busca escrito do zero — crawler, índice invertido e ranking — sem biblioteca de busca pronta.',
      en: 'A search engine written from scratch — crawler, inverted index and ranking — with no off-the-shelf search library.',
    },
    href: '#/case/my-own-search-engine',
  },
  {
    title: { pt: 'Entender por dentro antes de mexer', en: 'Understand the inside before touching it' },
    text: {
      pt: 'Antes de mudar algo, leio como funciona. Às vezes isso significa ler assembly.',
      en: 'Before changing something, I read how it works. Sometimes that means reading assembly.',
    },
    proof: {
      pt: 'No port de N64, cada função é lida em MIPS antes de virar C.',
      en: 'In the N64 port, every function is read in MIPS before it becomes C.',
    },
    href: '#/case/oot-macos-port',
  },
  {
    title: { pt: 'Medir antes de otimizar', en: 'Measure before optimizing' },
    text: {
      pt: 'Otimização sem número é palpite. Primeiro o perfil, depois a mudança, depois o número de novo.',
      en: 'Optimization without numbers is guessing. Profile first, change second, measure again.',
    },
    proof: {
      pt: 'Neste site: o brilho do 3D caiu de 4,7 milhões para 1,8 milhão de pixels por frame, medido antes e depois.',
      en: 'On this site: the 3D glow went from 4.7 million to 1.8 million pixels per frame, measured before and after.',
    },
    href: '#/notes/measure-before-optimizing',
  },
  {
    title: { pt: 'Simples primeiro', en: 'Simple first' },
    text: {
      pt: 'A solução mais simples que resolve ganha. Complexidade precisa se pagar.',
      en: 'The simplest solution that works wins. Complexity has to pay for itself.',
    },
    proof: {
      pt: 'Este site não usa framework. O algoritmo genético é uma função pura que roda até no terminal.',
      en: 'This site uses no framework. The genetic algorithm is a pure function that even runs in the terminal.',
    },
    href: '#/notes/genetic-portfolio',
  },
  {
    title: { pt: 'Funcionar na minha máquina não conta', en: '"Works on my machine" doesn\u2019t count' },
    text: {
      pt: 'O que importa é onde o usuário está: outro navegador, outro aparelho, outra rede.',
      en: 'What matters is where the user is: another browser, another device, another network.',
    },
    proof: {
      pt: 'Testes em Chromium, Firefox e WebKit acharam um bug no menu do celular que a revisão manual não tinha visto.',
      en: 'Tests on Chromium, Firefox and WebKit caught a mobile menu bug that manual review had missed.',
    },
    href: '#/notes/measure-before-optimizing',
  },
];

/** Animação que ilustra cada projeto (src/projects/viz.ts). */
export type VizKind = 'crawler' | 'evolution' | 'decompile';

export interface CaseSection {
  title: Localized;
  /** parágrafos; um item começando com "• " vira item de lista */
  body: Localized[];
}

export interface Project {
  id: string;
  title: string;
  description: Localized;
  highlights: Localized[];
  tags: (string | Localized)[];
  url: string;
  viz: VizKind;
  status?: Localized;
  role: Localized;
  /** Estudo de caso: aberto em #/case/<id>. Só seções preenchidas aparecem. */
  caseStudy: CaseSection[];
}

const L = (pt: string, en: string): Localized => ({ pt, en });

export const projects: Project[] = [
  {
    id: 'genetic-dev-portfolio',
    title: 'Genetic Dev Portfolio',
    description: L(
      'Este site. Um algoritmo genético em TypeScript evolui cores, forma 3D, tipografia e layout com base no engajamento de quem visita.',
      'This site. A TypeScript genetic algorithm evolves colors, 3D shape, typography and layout based on visitor engagement.',
    ),
    highlights: [
      L('42 genes visuais e estruturais (cor, forma 3D, layout, tipografia)', '42 visual and structural genes (color, 3D shape, layout, typography)'),
      L('Elitismo, torneio, crossover uniforme e mutação gaussiana', 'Elitism, tournament selection, uniform crossover and Gaussian mutation'),
      L('Organismo de partículas em Three.js com shaders próprios', 'Three.js particle organism with custom shaders'),
    ],
    tags: ['TypeScript', 'Three.js', L('Algoritmo genético', 'Genetic algorithm'), 'Vite'],
    url: 'https://github.com/Juanf3rnandes/genetic-dev-portfolio',
    viz: 'evolution',
    role: L('Design, front-end e algoritmo', 'Design, front end and algorithm'),
    caseStudy: [
      {
        title: L('O problema', 'The problem'),
        body: [
          L(
            'Portfólios costumam ser páginas estáticas que ninguém lembra. Eu queria um site que mostrasse como eu penso como engenheiro, e não só listasse projetos: algo que se adaptasse a quem visita.',
            'Portfolios tend to be static pages nobody remembers. I wanted a site that shows how I think as an engineer, not just a list of projects: something that adapts to its visitors.',
          ),
          L(
            'A regra principal: o conteúdo nunca muda. Só a apresentação é "fenótipo" — cores, forma 3D, tipografia, layout dos componentes.',
            'The main rule: content never changes. Only the presentation is the "phenotype" — colors, 3D shape, typography, component layout.',
          ),
        ],
      },
      {
        title: L('Como funciona', 'How it works'),
        body: [
          L(
            'Cada visita recebe um indivíduo de uma população de 8. Durante a sessão, um rastreador transforma engajamento em fitness (0 a 1): tempo ativo, profundidade de scroll, cliques em projetos e contato, interação com o organismo 3D e voto explícito.',
            'Each visit gets one individual from a population of 8. During the session, a tracker turns engagement into fitness (0 to 1): active time, scroll depth, clicks on projects and contact, interaction with the 3D organism and an explicit vote.',
          ),
          L(
            'Quando todos foram avaliados, nasce uma geração: os 2 melhores passam intactos (elitismo), pais são escolhidos por torneio (k=3), filhos vêm de crossover uniforme e cada gene tem 8% de chance de mutação gaussiana.',
            'Once everyone is evaluated, a generation is born: the top 2 carry over (elitism), parents are picked by tournament (k=3), children come from uniform crossover and each gene has an 8% chance of Gaussian mutation.',
          ),
          L(
            '• 42 genes: 20 visuais (matiz, partículas, ruído, bloom…) e 22 estruturais (menu, layout dos projetos, pele dos cards, botões, moldura das animações, elementos gerados nas margens…)',
            '• 42 genes: 20 visual (hue, particles, noise, bloom…) and 22 structural (menu, project layout, card skin, buttons, animation frame, generated margin elements…)',
          ),
          L(
            '• O genoma vira CSS custom properties e atributos data-ph-* no <html>; cada variante é um bloco de CSS',
            '• The genome becomes CSS custom properties and data-ph-* attributes on <html>; each variant is a CSS block',
          ),
          L(
            '• O organismo é uma nuvem de partículas em Three.js com ruído simplex no vertex shader, morph entre formas e glow em duas camadas, sem pós-processamento',
            '• The organism is a Three.js particle cloud with simplex noise in the vertex shader, morphing between shapes and a two-layer glow, no post-processing',
          ),
        ],
      },
      {
        title: L('Decisões técnicas', 'Technical decisions'),
        body: [
          L(
            '• Sem framework: Vite + TypeScript puro. O motor do GA é uma função pura (evolve), o que permite simular gerações no terminal (npm run simulate) e provar que o fitness converge.',
            '• No framework: Vite + plain TypeScript. The GA engine is a pure function (evolve), which makes it possible to simulate generations in the terminal (npm run simulate) and show fitness converging.',
          ),
          L(
            '• Mutação durante o uso, sem atrapalhar a leitura: genes de layout de uma região só mudam quando ela está fora da tela; ordem das seções, menu, fonte e espaçamento nunca mudam durante a visita.',
            '• Mutation during use without hurting reading: layout genes for a region only change while it is off screen; section order, menu, font and spacing never change during a visit.',
          ),
          L(
            '• Performance: Three.js carregado sob demanda (JS inicial de ~144 kB para ~20 kB gzip), WebGL pausado fora da tela com qualidade adaptativa, e animações CSS só em transform/opacity.',
            '• Performance: Three.js loaded on demand (initial JS from ~144 kB to ~20 kB gzip), WebGL paused off screen with adaptive quality, and CSS animations limited to transform/opacity.',
          ),
          L(
            '• Privacidade: só um número agregado de fitness entra na população. Nada é enviado a terceiros; a persistência padrão é o localStorage.',
            '• Privacy: only an aggregate fitness number enters the population. Nothing is sent to third parties; default persistence is localStorage.',
          ),
        ],
      },
      {
        title: L('Por que esta stack?', 'Why this stack?'),
        body: [
          L(
            '• TypeScript sem framework: a página é quase estática; a parte dinâmica é o genoma virando CSS. React ou Vue trariam peso sem resolver nada que eu tivesse.',
            '• TypeScript, no framework: the page is mostly static; the dynamic part is the genome turning into CSS. React or Vue would add weight without solving anything I had.',
          ),
          L(
            '• Vite: build rápido e código dividido sob demanda sem configuração.',
            '• Vite: fast builds and on-demand code splitting with no configuration.',
          ),
          L(
            '• Three.js em vez de WebGL puro: chegar ao resultado rápido. O custo é ~130 kB gzip; reescrever em WebGL puro economizaria quase tudo isso, e está anotado como próximo passo.',
            '• Three.js instead of raw WebGL: get to the result fast. The cost is ~130 kB gzip; rewriting in raw WebGL would save almost all of it, and it\u2019s on the list.',
          ),
          L(
            '• Rotas por hash (#/case/…): funcionam no GitHub Pages sem configurar servidor.',
            '• Hash routes (#/case/…): they work on GitHub Pages without any server configuration.',
          ),
          L(
            '• localStorage como padrão: zero infraestrutura e nada sai do navegador. O servidor compartilhado é opcional.',
            '• localStorage by default: zero infrastructure and nothing leaves the browser. The shared server is optional.',
          ),
        ],
      },
      {
        title: L('Próximos passos', 'Next steps'),
        body: [
          L(
            '• Ligar a evolução compartilhada (o worker em Cloudflare já existe) para todos os visitantes alimentarem a mesma população',
            '• Turn on shared evolution (the Cloudflare worker already exists) so every visitor feeds the same population',
          ),
          L('• Estimar o efeito de cada gene no fitness e mostrar no Lab', '• Estimate each gene’s effect on fitness and show it in the Lab'),
          L('• Checagem automática de contraste antes de aplicar um genoma', '• Automatic contrast check before applying a genome'),
        ],
      },
    ],
  },
  {
    id: 'my-own-search-engine',
    title: 'My Own Search Engine',
    description: L(
      'Motor de busca próprio — crawler, índice invertido e ranking — construído do zero para entender o problema por dentro.',
      'A search engine of my own — crawler, inverted index and ranking — built from scratch to understand the problem from the inside.',
    ),
    highlights: [
      L('Crawler que descobre e segue links a partir de URLs semente', 'Crawler that discovers and follows links from seed URLs'),
      L('Índice invertido: termo → documentos onde aparece', 'Inverted index: term → documents where it appears'),
      L('Ranking dos resultados por relevância à consulta', 'Results ranked by relevance to the query'),
    ],
    tags: ['Node.js', 'TypeScript', L('Indexação', 'Indexing')],
    url: 'https://github.com/Juanf3rnandes', // TODO: link do repositório
    viz: 'crawler',
    role: L('Projeto pessoal · solo', 'Personal project · solo'),
    caseStudy: [
      {
        title: L('O problema', 'The problem'),
        body: [
          L(
            'Busca parece mágica até você tentar construir uma. O objetivo foi escrever cada peça do zero, sem bibliotecas de busca prontas, para entender onde estão as decisões difíceis.',
            'Search feels like magic until you try to build one. The goal was to write every piece from scratch, without off-the-shelf search libraries, to understand where the hard decisions are.',
          ),
        ],
      },
      {
        title: L('Arquitetura', 'Architecture'),
        body: [
          L(
            '• Crawler: parte de URLs semente, baixa as páginas, extrai os links e coloca os novos numa fila',
            '• Crawler: starts from seed URLs, fetches pages, extracts links and queues the new ones',
          ),
          L(
            '• Índice invertido: transforma cada página em termos e guarda, para cada termo, em quais documentos ele aparece',
            '• Inverted index: turns each page into terms and stores, for each term, which documents it appears in',
          ),
          L(
            '• Ranking: para uma consulta, busca os documentos de cada termo no índice e ordena por relevância',
            '• Ranking: for a query, looks up each term’s documents in the index and sorts them by relevance',
          ),
        ],
      },
      // TODO: adicione uma seção "Por que esta stack?" (por que Node/TypeScript aqui) e
      // outras com detalhes reais, por exemplo:
      //  - Decisões técnicas (como a fila e a deduplicação de URLs funcionam, a fórmula de ranking)
      //  - Números (páginas indexadas, tempo de consulta)
      //  - O que aprendeu / próximos passos
    ],
  },
  {
    id: 'oot-macos-port',
    title: 'OoT macOS Port',
    description: L(
      'Port de Ocarina of Time para macOS, em andamento. Engenharia reversa e C/C++ falando direto com o hardware.',
      'A macOS port of Ocarina of Time, in progress. Reverse engineering and C/C++ talking straight to the hardware.',
    ),
    highlights: [
      L('Engenharia reversa do binário original (MIPS) para C', 'Reverse engineering the original binary (MIPS) into C'),
      L('C/C++ falando direto com o hardware', 'C/C++ talking straight to the hardware'),
      L('Build nativo para macOS', 'Native macOS build'),
    ],
    tags: ['C/C++', L('Engenharia reversa', 'Reverse engineering'), 'macOS'],
    url: 'https://github.com/Juanf3rnandes/oot-macos-port',
    viz: 'decompile',
    status: L('em andamento', 'in progress'),
    role: L('Projeto pessoal · em andamento', 'Personal project · in progress'),
    caseStudy: [
      {
        title: L('O problema', 'The problem'),
        body: [
          L(
            'Rodar nativamente no macOS um jogo escrito para o Nintendo 64, cujo código original existe só como binário MIPS. Não há atalho: é preciso entender o código antes de portar.',
            'Running natively on macOS a game written for the Nintendo 64, whose original code exists only as a MIPS binary. There is no shortcut: you have to understand the code before porting it.',
          ),
        ],
      },
      {
        title: L('O processo', 'The process'),
        body: [
          L(
            '• Engenharia reversa: ler o assembly MIPS do binário e reescrever cada função em C equivalente',
            '• Reverse engineering: read the binary’s MIPS assembly and rewrite each function as equivalent C',
          ),
          L(
            '• Port: trocar o que dependia do hardware do console por código que roda no Mac',
            '• Port: replace what depended on the console hardware with code that runs on the Mac',
          ),
          L('• Build nativo para macOS', '• Native macOS build'),
        ],
      },
      // TODO: adicione "Por que esta stack?" (por que C/C++, quais ferramentas de
      // engenharia reversa) e detalhes reais — ferramentas usadas, como valida que a função
      // decompilada é equivalente, o que já roda, maiores desafios, próximos passos.
    ],
  },
];

/** Ferramentas agrupadas pelo TIPO DE PROBLEMA que resolvem, não por linguagem. */
export const skills: { group: Localized; items: (string | Localized)[] }[] = [
  { group: L('Dados e APIs', 'Data and APIs'), items: ['Laravel', 'PHP', 'Node.js', 'REST', 'PostgreSQL', 'MySQL', 'Redis'] },
  { group: L('Interfaces', 'Interfaces'), items: ['TypeScript', 'React', 'Vite', 'Canvas / WebGL', 'Three.js', 'CSS'] },
  { group: L('Desempenho e baixo nível', 'Performance and low level'), items: ['C/C++', L('Engenharia reversa', 'Reverse engineering'), 'MIPS', 'Profiling', 'Linux', 'Git'] },
];

/** Frase que fecha a seção de stack. */
export const skillsNote: Localized = {
  pt: 'Se o problema pedir uma ferramenta que não está aqui, eu aprendo. O port de N64 começou sem eu saber MIPS.',
  en: "If the problem needs a tool that isn't listed here, I learn it. The N64 port started before I knew MIPS.",
};
