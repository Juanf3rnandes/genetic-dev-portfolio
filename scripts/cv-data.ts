/**
 * Dados do currículo em PDF. Experiência e formação vêm de src/content.ts
 * (a mesma fonte da seção "Experiência" do site), então editar lá atualiza
 * os dois. Rode `npm run cv` para regerar os PDFs.
 */

import { education as edu, experience as jobs } from '../src/content';
import type { Localized } from '../src/i18n';

export interface CvEntry {
  title: Localized;
  org: Localized;
  period: Localized;
  bullets: Localized[];
  example?: boolean;
}

const L = (pt: string, en: string): Localized => ({ pt, en });

export const experience: CvEntry[] = jobs.map((j) => ({
  title: j.role,
  org: L(j.company, j.company),
  period: j.period,
  bullets: j.bullets,
}));

export const education: CvEntry[] = [
  {
    title: edu.degree,
    org: L(edu.school, edu.school),
    period: edu.period,
    bullets: [],
  },
];

export const languages: { name: Localized; level: Localized; example?: boolean }[] = [
  { name: L('Português', 'Portuguese'), level: L('nativo', 'native') },
];
