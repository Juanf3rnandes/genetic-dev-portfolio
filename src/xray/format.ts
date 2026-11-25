/**
 * Funções puras do Raio-X (formatação e resumo dos dados), separadas da DOM
 * para serem testadas sem navegador.
 */

import type { Genome } from '../ga/genome';
import type { GeneValue } from './bus';

export function formatGene(gene: keyof Genome, v: GeneValue): string {
  if (typeof v !== 'number') return String(v);
  if (gene === 'hue' || gene === 'hue2') return `${v.toFixed(0)}°`;
  if (gene === 'particles') return String(Math.round(v));
  if (gene === 'cardRadius') return `${v.toFixed(0)}px`;
  if (gene === 'fontWeight') return String(v);
  return v.toFixed(2);
}

export function formatBytes(n: number): string {
  if (!(n > 0)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function clock(at: number): string {
  const d = new Date(at);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((x) => String(x).padStart(2, '0')).join(':');
}

/** O que o painel de rede precisa de cada PerformanceResourceTiming. */
export interface ResourceLike {
  name: string;
  initiatorType: string;
  startTime: number;
  responseEnd: number;
  transferSize: number;
  encodedBodySize: number;
}

export type ResourceKind = 'doc' | 'js' | 'css' | 'font' | 'img' | 'pdf' | 'other';

export interface NetRow {
  label: string;
  kind: ResourceKind;
  start: number;
  end: number;
  bytes: number;
  cached: boolean;
}

export interface NetSummary {
  rows: NetRow[];
  /** quantas requisições no total (rows mostra só as primeiras `limit`) */
  count: number;
  transfer: number;
  end: number;
  /** o three.js começou a baixar depois do LCP? null se não há como saber */
  threeAfterLcp: boolean | null;
  threeBytes: number;
}

export function kindOf(name: string, initiator: string): ResourceKind {
  const path = name.split(/[?#]/)[0].toLowerCase();
  if (initiator === 'navigation') return 'doc';
  if (/\.(m?js)$/.test(path) || initiator === 'script') return 'js';
  if (/\.css$/.test(path) || path.includes('fonts.googleapis.com/css')) return 'css';
  if (/\.(woff2?|ttf|otf)$/.test(path) || path.includes('fonts.gstatic.com')) return 'font';
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return 'img';
  if (/\.pdf$/.test(path)) return 'pdf';
  return 'other';
}

export function shortName(name: string, origin: string): string {
  if (name.startsWith('data:')) return 'data:';
  try {
    const u = new URL(name);
    const file = u.pathname.split('/').filter(Boolean).pop() ?? '';
    if (u.origin !== origin) return `${u.hostname.replace(/^www\./, '')}/${file}`.replace(/\/$/, '');
    return file || '/';
  } catch {
    return name;
  }
}

export function summarizeResources(
  entries: readonly ResourceLike[],
  origin: string,
  lcp: number | null,
  limit = 9,
): NetSummary {
  const list = entries.filter((e) => !e.name.startsWith('data:')).slice().sort((a, b) => a.startTime - b.startTime);
  const rows: NetRow[] = list.map((e) => {
    const cached = e.transferSize === 0 && e.encodedBodySize > 0;
    const kind = kindOf(e.name, e.initiatorType);
    return {
      label: kind === 'doc' ? `${shortName(e.name, origin)} (html)` : shortName(e.name, origin),
      kind,
      start: e.startTime,
      end: Math.max(e.startTime, e.responseEnd),
      bytes: e.transferSize > 0 ? e.transferSize : e.encodedBodySize,
      cached,
    };
  });
  const three = list.find((e) => /three[.-]/i.test(shortName(e.name, origin)) && kindOf(e.name, e.initiatorType) === 'js');
  return {
    rows: rows.slice(0, limit),
    count: rows.length,
    transfer: list.reduce((s, e) => s + (e.transferSize > 0 ? e.transferSize : 0), 0),
    end: rows.reduce((m, r) => Math.max(m, r.end), 0),
    threeAfterLcp: three && lcp !== null ? three.startTime >= lcp : null,
    threeBytes: three ? (three.transferSize > 0 ? three.transferSize : three.encodedBodySize) : 0,
  };
}

/** Rótulo de um elemento como no inspetor: <h1.display>, <canvas#organism>. */
export function tagLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `<${tag}#${el.id}>`;
  const cls = [...el.classList].find((c) => !c.startsWith('xr-'));
  return cls ? `<${tag}.${cls}>` : `<${tag}>`;
}
