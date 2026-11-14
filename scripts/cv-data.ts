/**
 * Dados do currículo que NÃO estão no site (experiência, formação, idiomas).
 * Nome, contato, stack e projetos vêm de src/content.ts.
 *
 * ⚠️ As entradas marcadas com `example: true` são EXEMPLOS de formato.
 * Substitua pelos seus dados reais e rode `npm run cv` para regerar os PDFs.
 */

import type { Localized } from '../src/i18n';

export interface CvEntry {
  title: Localized;
  org: Localized;
  period: Localized;
  bullets: Localized[];
  example?: boolean;
}

const L = (pt: string, en: string): Localized => ({ pt, en });

export const experience: CvEntry[] = [
  {
    example: true,
    title: L('Desenvolvedor Full Stack', 'Full Stack Developer'),
    org: L('Empresa Exemplo', 'Example Company'),
    period: L('2023 — atual', '2023 — present'),
    bullets: [
      L('APIs REST em Laravel e Node.js consumidas por web e mobile', 'REST APIs in Laravel and Node.js consumed by web and mobile'),
      L('Interfaces em React + TypeScript para painéis internos', 'React + TypeScript interfaces for internal dashboards'),
      L('Modelagem e otimização de consultas em PostgreSQL/MySQL', 'Data modeling and query optimization on PostgreSQL/MySQL'),
    ],
  },
  {
    example: true,
    title: L('Desenvolvedor Web', 'Web Developer'),
    org: L('Empresa Exemplo 2', 'Example Company 2'),
    period: L('2021 — 2023', '2021 — 2023'),
    bullets: [
      L('Manutenção e novas funcionalidades em sistemas PHP/Laravel', 'Maintenance and new features on PHP/Laravel systems'),
      L('Integrações com serviços externos e filas com Redis', 'Third-party integrations and Redis-backed queues'),
    ],
  },
];

export const education: CvEntry[] = [
  {
    example: true,
    title: L('Curso / Graduação Exemplo', 'Example Degree / Course'),
    org: L('Instituição Exemplo', 'Example Institution'),
    period: L('ano — ano', 'year — year'),
    bullets: [],
  },
];

export const languages: { name: Localized; level: Localized; example?: boolean }[] = [
  { name: L('Português', 'Portuguese'), level: L('nativo', 'native') },
  { name: L('Inglês', 'English'), level: L('nível exemplo', 'example level'), example: true },
];
