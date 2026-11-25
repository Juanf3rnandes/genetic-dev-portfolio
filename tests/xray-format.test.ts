import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatBytes, formatGene, kindOf, shortName, summarizeResources, type ResourceLike } from '../src/xray/format';

const ORIGIN = 'https://site.dev';
const res = (name: string, startTime: number, responseEnd: number, transferSize: number, initiatorType = 'script', encodedBodySize = transferSize): ResourceLike => ({
  name,
  initiatorType,
  startTime,
  responseEnd,
  transferSize,
  encodedBodySize,
});

test('formatGene: graus, inteiros, px e decimais', () => {
  assert.equal(formatGene('hue', 158.4), '158°');
  assert.equal(formatGene('particles', 9000.4), '9000');
  assert.equal(formatGene('cardRadius', 19.6), '20px');
  assert.equal(formatGene('fontWeight', 700), '700');
  assert.equal(formatGene('noiseAmp', 0.1234), '0.12');
  assert.equal(formatGene('shape', 'helix'), 'helix');
});

test('formatBytes', () => {
  assert.equal(formatBytes(0), '—');
  assert.equal(formatBytes(NaN), '—');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(44_812), '43.8 kB');
  assert.equal(formatBytes(3 * 1024 * 1024), '3.00 MB');
});

test('kindOf e shortName', () => {
  assert.equal(kindOf('https://site.dev/assets/index-abc.js', 'script'), 'js');
  assert.equal(kindOf('https://site.dev/assets/index-abc.css', 'link'), 'css');
  assert.equal(kindOf('https://fonts.gstatic.com/s/inter/v1/x.woff2', 'css'), 'font');
  assert.equal(kindOf('https://site.dev/cv/cv.pdf?x=1', 'other'), 'pdf');
  assert.equal(kindOf('https://site.dev/', 'navigation'), 'doc');
  assert.equal(shortName('https://site.dev/assets/three.module-wu7.js', ORIGIN), 'three.module-wu7.js');
  assert.equal(shortName('https://fonts.googleapis.com/css2?family=Inter', ORIGIN), 'fonts.googleapis.com/css2');
  assert.equal(shortName('https://site.dev/', ORIGIN), '/');
});

test('summarizeResources: ordena, soma, limita e detecta o three.js depois do LCP', () => {
  const entries = [
    res('https://site.dev/assets/three.module-wu7.js', 600, 900, 130_000),
    res('https://site.dev/', 0, 40, 4_000, 'navigation'),
    res('https://site.dev/assets/index-abc.js', 50, 200, 45_000),
    res('data:image/svg+xml,abc', 10, 10, 0, 'img'),
    res('https://site.dev/assets/index-abc.css', 45, 120, 0, 'link', 11_000), // veio do cache
  ];
  const sum = summarizeResources(entries, ORIGIN, 400, 3);
  assert.equal(sum.count, 4, 'data: URIs não contam');
  assert.deepEqual(sum.rows.map((r) => r.label), ['/ (html)', 'index-abc.css', 'index-abc.js']);
  assert.equal(sum.rows[1].cached, true);
  assert.equal(sum.rows[1].bytes, 11_000);
  assert.equal(sum.transfer, 4_000 + 45_000 + 130_000, 'cache não soma na transferência');
  assert.equal(sum.end, 900);
  assert.equal(sum.threeAfterLcp, true);
  assert.equal(sum.threeBytes, 130_000);

  assert.equal(summarizeResources(entries, ORIGIN, 700).threeAfterLcp, false);
  assert.equal(summarizeResources(entries, ORIGIN, null).threeAfterLcp, null);
  assert.equal(summarizeResources(entries.slice(1), ORIGIN, 400).threeAfterLcp, null);
});
