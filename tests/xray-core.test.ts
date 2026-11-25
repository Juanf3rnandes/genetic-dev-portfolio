import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventBus } from '../src/xray/bus';
import { computeCls, computeInp } from '../src/xray/vitals';
import { driftStep, driftStepDetailed, GENE_KEYS, mulberry32, seedGenome, type Genome } from '../src/ga/genome';
import { scoreParts } from '../src/ga/fitness';

test('EventBus: guarda no máximo `capacity`, avisa assinantes e para de avisar ao cancelar', () => {
  let now = 1000;
  const bus = new EventBus(10, () => now++);
  const seen: number[] = [];
  const off = bus.subscribe((e) => e.kind === 'fitness' && seen.push(e.score));
  for (let i = 0; i < 30; i++) bus.emit({ kind: 'fitness', score: i });
  const h = bus.history();
  assert.equal(h.length, 10);
  assert.equal(h[0].kind === 'fitness' && h[0].score, 20);
  assert.equal(h[9].kind === 'fitness' && h[9].score, 29);
  assert.ok(h.every((e, i) => i === 0 || e.at > h[i - 1].at), 'carimbo de tempo crescente');
  off();
  bus.emit({ kind: 'fitness', score: 99 });
  assert.equal(seen.length, 30);
});

test('computeCls: maior janela de sessão, ignora mudanças após input', () => {
  assert.equal(computeCls([]), 0);
  const v = computeCls([
    { startTime: 100, value: 0.05, hadRecentInput: false },
    { startTime: 500, value: 0.05, hadRecentInput: false }, // mesma janela
    { startTime: 3000, value: 0.02, hadRecentInput: false }, // > 1 s de intervalo: janela nova
    { startTime: 3100, value: 0.5, hadRecentInput: true }, // após interação: não conta
  ]);
  assert.equal(Number(v.toFixed(3)), 0.1);
  // janela limitada a 5 s, mesmo com mudanças seguidas
  const chain = Array.from({ length: 12 }, (_, i) => ({ startTime: i * 900, value: 0.01, hadRecentInput: false }));
  assert.ok(computeCls(chain) <= 0.06 + 1e-9);
});

test('computeInp: pior interação; com 50+ ignora 1 a cada 50', () => {
  assert.equal(computeInp([]), null);
  assert.equal(computeInp([40, 120, 80]), 120);
  const many = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
  assert.equal(computeInp(many), 98);
});

test('driftStepDetailed: respeita congelados e relata o que mudou e o que foi barrado', () => {
  const base = seedGenome();
  const frozen = new Set<keyof Genome>(['heroLayout', 'navStyle', 'hue']);
  let sawChange = false;
  let sawBlock = false;
  for (let seed = 1; seed < 300; seed++) {
    const d = driftStepDetailed(base, 1, mulberry32(seed), frozen);
    for (const k of frozen) assert.equal(d.genome[k], base[k], `gene congelado ${k} não pode mudar`);
    for (const k of GENE_KEYS) {
      const changed = d.genome[k] !== base[k];
      assert.equal(changed, d.changed.includes(k), `changed coerente para ${k}`);
    }
    for (const k of d.blocked) assert.ok(frozen.has(k));
    assert.ok(d.changed.every((k) => !frozen.has(k)));
    sawChange ||= d.changed.length > 0;
    sawBlock ||= d.blocked.length > 0;
  }
  assert.ok(sawChange && sawBlock, 'no nível máximo deve haver mudanças e bloqueios');
});

test('driftStep continua igual ao detalhado (mesma semente → mesmo genoma)', () => {
  const base = seedGenome();
  const frozen = new Set<keyof Genome>(['sectionOrder']);
  assert.deepEqual(driftStep(base, 0.5, mulberry32(7), frozen), driftStepDetailed(base, 0.5, mulberry32(7), frozen).genome);
});

test('scoreParts: partes somam o score e respeitam os limites', () => {
  const idle = scoreParts({ activeSeconds: 0, scrollDepth: 0, projectClicks: 0, contactClicks: 0, heroSeconds: 0, vote: 0 });
  assert.equal(Number(idle.score.toFixed(6)), 0.1);
  const max = scoreParts({ activeSeconds: 1e6, scrollDepth: 1, projectClicks: 10, contactClicks: 1, heroSeconds: 100, vote: 1 });
  assert.equal(max.score, 1);
  assert.equal(Number(max.parts.time.toFixed(6)), 0.25);
  assert.equal(Number(max.parts.projects.toFixed(6)), 0.15);
  const neg = scoreParts({ activeSeconds: 5, scrollDepth: 0.3, projectClicks: 1, contactClicks: 0, heroSeconds: 2, vote: -1 });
  const sum = Object.values(neg.parts).reduce((a, b) => a + b, 0);
  assert.equal(Number(neg.score.toFixed(6)), Number(Math.max(0, Math.min(1, sum)).toFixed(6)));
  assert.ok(neg.parts.vote < 0);
});
