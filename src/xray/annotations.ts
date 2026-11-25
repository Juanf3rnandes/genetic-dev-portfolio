/**
 * O que a aba "estrutura" do Raio-X marca na página: cada item liga um
 * elemento ao gene que o controla e ao arquivo onde ele é feito.
 */

import type { Genome } from '../ga/genome';
import type { Localized } from '../i18n';

export const REPO = 'https://github.com/Juanf3rnandes/genetic-dev-portfolio/blob/main/';

export interface Annotation {
  /** primeiro elemento que casar é o marcado */
  selector: string;
  genes: (keyof Genome)[];
  src: string;
  desc: Localized;
  /** destaque (contorno cheio): o que mais vale a pena olhar */
  hot?: boolean;
}

export const ANNOTATIONS: Annotation[] = [
  {
    selector: '.nav',
    genes: ['navStyle'],
    src: 'src/ui/nav.ts',
    desc: {
      pt: 'Navegação. O gene navStyle troca a forma inteira: barra no topo, trilho lateral ou dock flutuante.',
      en: 'Navigation. The navStyle gene swaps its whole shape: top bar, side rail or floating dock.',
    },
  },
  {
    selector: '.hero-copy h1',
    genes: ['titleFx', 'fontPair', 'headingCase', 'typeScale'],
    src: 'src/ui/effects.ts',
    hot: true,
    desc: {
      pt: 'Título. Efeito, fonte, caixa e escala tipográfica são genes; o texto nunca muda.',
      en: 'Title. Effect, font, case and type scale are genes; the text never changes.',
    },
  },
  {
    selector: '#organism',
    genes: ['shape', 'particles', 'noiseAmp', 'bloom'],
    src: 'src/scene/organism.ts',
    hot: true,
    desc: {
      pt: 'Organismo 3D: até 16 mil partículas num shader próprio (ruído simplex, morph entre formas, reação ao cursor). Baixa a qualidade sozinho se os frames ficarem lentos.',
      en: '3D organism: up to 16k particles in a custom shader (simplex noise, shape morphing, cursor reaction). Lowers its own quality if frames get slow.',
    },
  },
  {
    selector: '.hero .actions',
    genes: ['buttonStyle'],
    src: 'src/cv/portal.ts',
    desc: {
      pt: 'Botões. "Baixar currículo" transforma as próprias partículas do organismo na folha do CV, no vertex shader.',
      en: 'Buttons. "Download CV" turns the organism\'s own particles into the CV page, in the vertex shader.',
    },
  },
  {
    selector: '.ga-badge',
    genes: [],
    src: 'src/ga/engine.ts',
    desc: {
      pt: 'Motor do algoritmo genético: população de 8, elitismo 2, torneio, crossover uniforme e mutação gaussiana.',
      en: 'Genetic algorithm engine: population of 8, elitism 2, tournament, uniform crossover and Gaussian mutation.',
    },
  },
  {
    selector: '[data-experience]',
    genes: ['skin', 'spacing'],
    src: 'src/content.ts',
    desc: {
      pt: 'Experiência. Conteúdo fixo em content.ts (PT/EN); só a apresentação é genética.',
      en: 'Experience. Fixed content in content.ts (PT/EN); only the presentation is genetic.',
    },
  },
  {
    selector: '[data-projects]',
    genes: ['cardLayout', 'skin', 'vizFrame'],
    src: 'src/projects/viz.ts',
    hot: true,
    desc: {
      pt: 'Projetos. Cada animação é canvas 2D, num único requestAnimationFrame, e só desenha quando está visível (~30 fps).',
      en: 'Projects. Each animation is 2D canvas on a single requestAnimationFrame and only draws while visible (~30 fps).',
    },
  },
  {
    selector: '[data-principles]',
    genes: ['skin'],
    src: 'src/content.ts',
    desc: { pt: 'Princípios, cada um com uma prova no próprio site.', en: 'Principles, each with proof in this very site.' },
  },
  {
    selector: '[data-notes]',
    genes: [],
    src: 'src/projects/notes.ts',
    desc: {
      pt: 'Notas técnicas: markdown em content/notes, embutido no build e convertido sem biblioteca.',
      en: 'Technical notes: markdown in content/notes, bundled at build time and rendered without a library.',
    },
  },
  {
    selector: '[data-skills]',
    genes: ['skillsLayout', 'chipStyle'],
    src: 'src/ui/render.ts',
    desc: { pt: 'Stack. Chips, terminal ou colunas: decidido pelo genoma.', en: 'Stack. Chips, terminal or columns: decided by the genome.' },
  },
  {
    selector: '[data-genes]',
    genes: [],
    src: 'src/ga/genome.ts',
    desc: {
      pt: 'O genoma atual: 43 genes, visuais e estruturais.',
      en: 'The current genome: 43 genes, visual and structural.',
    },
  },
  {
    selector: '[data-population]',
    genes: [],
    src: 'src/ga/store.ts',
    desc: {
      pt: 'População e histórico, salvos no navegador (localStorage) ou num endpoint compartilhado.',
      en: 'Population and history, saved in the browser (localStorage) or on a shared endpoint.',
    },
  },
  {
    selector: '.contact h2',
    genes: ['contactLayout', 'titleFx'],
    src: 'src/ui/render.ts',
    desc: { pt: 'Contato. Layout à esquerda, centralizado ou terminal.', en: 'Contact. Left, centered or terminal layout.' },
  },
];
