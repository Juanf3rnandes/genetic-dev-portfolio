/**
 * Conteúdo do portfólio, em português e inglês. Edite aqui — o algoritmo
 * genético nunca altera texto. Cada texto traduzível é { pt, en }.
 */

import type { Localized } from './i18n';

export const profile = {
  name: 'Juan Fernandes',
  handle: 'JUAN.DEV',
  role: { pt: 'Engenheiro de Software Full Stack', en: 'Full Stack Software Engineer' } as Localized,
  stack: ['PHP', 'Laravel', 'Next.js', 'Node.js'],
  lede: {
    pt: 'Engenheiro full stack com 4 anos de experiência, focado em PHP/Laravel e APIs REST. Trabalho com sistemas multi-tenant, modelagem de dados, performance, processamento assíncrono e microsserviços — além de Next.js, React, Node.js e liderança técnica.',
    en: 'Full stack engineer with 4 years of experience, focused on PHP/Laravel and REST API design. I work on multi-tenant systems, data modeling, performance, asynchronous processing and microservices — plus Next.js, React, Node.js and technical leadership.',
  } as Localized,
  location: { pt: 'São Paulo, Brasil · remoto (UTC-3)', en: 'São Paulo, Brazil · remote (UTC-3)' } as Localized,
  github: 'https://github.com/Juanf3rnandes',
  linkedin: 'https://www.linkedin.com/in/juan-fernandes-605b05222',
  email: 'fernandesjuan633@gmail.com',
};

/** Números de destaque logo abaixo do hero. */
export const highlights: { value: string; label: Localized }[] = [
  { value: '4', label: { pt: 'anos de experiência', en: 'years of experience' } },
  { value: '7', label: { pt: 'devs liderados tecnicamente', en: 'developers led technically' } },
  { value: 'P95/P99', label: { pt: 'APIs otimizadas com métricas', en: 'APIs tuned with real metrics' } },
];

/** Experiência profissional (seção do site e folha da animação de download). */
export interface Job {
  company: string;
  role: Localized;
  period: Localized;
  context: Localized;
  bullets: Localized[];
  stack: string[];
}

export const experience: Job[] = [
  {
    company: 'Allcom Telecom',
    role: { pt: 'Engenheiro Full Stack (Pleno)', en: 'Full Stack Engineer (Mid-level)' },
    period: { pt: '2025 — atual', en: '2025 — present' },
    context: {
      pt: 'Telecom especializada em conectividade e IoT, com sistemas de gestão próprios.',
      en: 'Telecommunications company specialized in connectivity and IoT, with in-house management systems.',
    },
    bullets: [
      {
        pt: 'Desenvolvo e evoluo o CRM corporativo em Laravel: sistema multi-tenant com controle de acesso por papéis (RBAC).',
        en: "Build and evolve the company's Laravel-based corporate CRM, a multi-tenant system with role-based access control (RBAC).",
      },
      {
        pt: 'Projetei um motor de regras dinâmico para aprovação comercial de itens de pedido, trocando regras hardcoded por configuração por tenant; fui responsável pela modelagem de dados e pelo tratamento de locks e concorrência.',
        en: 'Designed a dynamic rules engine for commercial approval of order items, replacing hardcoded rules with per-tenant configuration; owned data modeling and handled locking and concurrency.',
      },
      {
        pt: 'Implantei observabilidade com New Relic (latência P95/P99, throughput, disponibilidade, taxa de erro) e otimizei a API com base nessas métricas: índices e gargalos de concorrência.',
        en: 'Implemented observability with New Relic (P95/P99 latency, throughput, availability, error rate) and optimized the API based on those metrics, adding indexes and fixing concurrency bottlenecks.',
      },
      {
        pt: 'Fluxos assíncronos com Laravel Queues e Redis, e integrações com vendas, gestão de leads e serviços externos.',
        en: 'Built asynchronous workflows with Laravel Queues and Redis, and integrations with sales processes, lead management and external services.',
      },
      {
        pt: 'Responsável pela multicotação de uma plataforma de seguros; atuação na plataforma de gestão de conectividade IoT.',
        en: 'Owned the multi-quote feature of an insurance quoting platform and worked on the IoT connectivity management platform.',
      },
    ],
    stack: ['PHP', 'Laravel', 'Redis', 'New Relic', 'Next.js', 'Docker'],
  },
  {
    company: 'Grupo Aion',
    role: { pt: 'Engenheiro Full Stack · liderança técnica', en: 'Full Stack Engineer · tech lead' },
    period: { pt: 'abr 2025 — set 2025', en: 'Apr 2025 — Sep 2025' },
    context: {
      pt: 'Grupo de tecnologia construindo um banco digital e aplicações SaaS com recursos de IA.',
      en: 'Technology group building a digital banking platform and SaaS applications with AI features.',
    },
    bullets: [
      {
        pt: 'Liderei tecnicamente um time de 7 desenvolvedores: planejamento de tarefas, padrões, code review e mentoria.',
        en: 'Led a team of 7 developers technically: task planning, standards, code review and mentoring.',
      },
      {
        pt: 'Defini a arquitetura e as principais decisões técnicas, estruturando a aplicação em microsserviços com Docker, RabbitMQ e Redis, e documentei os padrões para alinhar os times.',
        en: 'Defined the architecture and key technical decisions, structuring the application as microservices with Docker, RabbitMQ and Redis, and documented standards to align the teams.',
      },
      {
        pt: 'Aplicações SaaS em Next.js e serviços em Node.js, com integrações de API e autenticação OAuth 2.0 / JWT.',
        en: 'Built SaaS applications with Next.js and backend services with Node.js, including API integrations and OAuth 2.0 / JWT authentication.',
      },
      {
        pt: 'Integração de LLMs com arquitetura RAG (Pinecone e Redis) e definição do design system do front-end.',
        en: 'Integrated LLMs using a RAG architecture (Pinecone and Redis) and defined the front-end design system.',
      },
    ],
    stack: ['Node.js', 'Next.js', 'RabbitMQ', 'Redis', 'Docker', 'RAG'],
  },
  {
    company: 'Hubert Administração de Condomínios e Imóveis',
    role: { pt: 'Desenvolvedor de Software', en: 'Software Developer' },
    period: { pt: 'fev 2022 — set 2024', en: 'Feb 2022 — Sep 2024' },
    context: {
      pt: 'Administradora de condomínios e imóveis em São Paulo, com sistemas web próprios.',
      en: 'Property and condominium management company in São Paulo with in-house web systems.',
    },
    bullets: [
      {
        pt: 'Módulos do ERP em Next.js e TypeScript, com Redux para estado e integração com APIs REST.',
        en: 'Developed ERP modules with Next.js and TypeScript, using Redux for state management and integrating REST APIs.',
      },
      {
        pt: 'Contribuí com a biblioteca interna de design system, melhorando componentes reutilizáveis com Styled Components e Tailwind CSS.',
        en: "Contributed to the company's internal design system library, improving reusable components with Styled Components and Tailwind CSS.",
      },
      {
        pt: 'Projetos mobile e aplicações Angular; testes E2E com Cypress, unitários com Jest e testes funcionais de regras de negócio.',
        en: 'Also worked on mobile projects and Angular applications, and wrote E2E tests with Cypress, unit tests with Jest and functional tests for business rules.',
      },
      {
        pt: 'Entrei na empresa como Analista de Suporte Técnico (fev–set 2022), atendendo N1/N2 e gerando relatórios em SQL Server.',
        en: 'Started at the company as a Technical Support Analyst (Feb–Sep 2022), handling L1/L2 tickets and building SQL Server reports.',
      },
    ],
    stack: ['Next.js', 'TypeScript', 'Redux', 'Angular', 'Cypress', 'Jest'],
  },
];

export const education = {
  degree: { pt: 'Tecnólogo em Análise e Desenvolvimento de Sistemas', en: 'Associate Degree in Systems Analysis and Development' } as Localized,
  school: 'Universidade São Judas Tadeu',
  period: { pt: 'concluído em 2024', en: 'completed 2024' } as Localized,
};

/** Parágrafos e fatos da seção "Sobre". */
export const about = {
  paragraphs: [
    {
      pt: 'Meu trabalho principal é back-end com PHP/Laravel: APIs REST, sistemas multi-tenant, modelagem de dados e regras de negócio que precisam continuar consistentes sob concorrência. No front-end, construo interfaces em Next.js e React.',
      en: 'My core work is back end with PHP/Laravel: REST APIs, multi-tenant systems, data modeling and business rules that must stay consistent under concurrency. On the front end, I build interfaces with Next.js and React.',
    },
    {
      pt: 'Gosto de entender os sistemas por dentro: meço antes de otimizar e escolho a ferramenta pelo problema. Fora do trabalho, isso virou um motor de busca em microsserviços, um port de N64 para macOS e este portfólio, que se adapta a cada visita com um algoritmo genético.',
      en: "I like understanding systems from the inside: I measure before optimizing and pick the tool for the problem. Outside work, that turned into a microservices search engine, an N64-to-macOS port and this portfolio, which adapts to each visit with a genetic algorithm.",
    },
  ] as Localized[],
  facts: [
    [
      { pt: 'Base', en: 'Based in' },
      { pt: 'São Paulo, Brasil · remoto (UTC-3)', en: 'São Paulo, Brazil · remote (UTC-3)' },
    ],
    [
      { pt: 'Foco', en: 'Focus' },
      { pt: 'PHP/Laravel, APIs REST, sistemas multi-tenant', en: 'PHP/Laravel, REST APIs, multi-tenant systems' },
    ],
    [
      { pt: 'Formação', en: 'Education' },
      { pt: 'ADS · Universidade São Judas Tadeu (2024)', en: 'Systems Analysis & Development · São Judas Tadeu University (2024)' },
    ],
    [
      { pt: 'Aberto a', en: 'Open to' },
      { pt: 'Vagas remotas, inclusive internacionais', en: 'Remote roles, including international' },
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
      L('43 genes visuais e estruturais (cor, forma 3D, layout, tipografia)', '43 visual and structural genes (color, 3D shape, layout, typography)'),
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

/** Stack agrupada por camada (a mesma do currículo). */
export const skills: { group: Localized; items: (string | Localized)[] }[] = [
  { group: L('Back-end', 'Back end'), items: ['PHP', 'Laravel', 'Laravel Queues', 'REST APIs', 'Node.js', 'Java'] },
  { group: L('Front-end', 'Front end'), items: ['TypeScript', 'React', 'Next.js', 'Redux', 'Angular', 'Tailwind CSS'] },
  { group: L('Dados', 'Data'), items: ['PostgreSQL', 'SQL Server', 'Redis', 'Elasticsearch'] },
  { group: L('Infra e qualidade', 'Infra and quality'), items: ['Docker', 'RabbitMQ', L('Microsserviços', 'Microservices'), 'New Relic', 'OAuth 2.0 / JWT', 'Jest', 'Cypress'] },
];

/** Frase que fecha a seção de stack. */
export const skillsNote: Localized = {
  pt: 'Também estudo baixo nível por conta própria: C, engenharia reversa e assembly MIPS no port de N64.',
  en: 'I also study low-level work on my own: C, reverse engineering and MIPS assembly in the N64 port.',
};
