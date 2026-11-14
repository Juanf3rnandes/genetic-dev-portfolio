/**
 * Simulação headless do GA: visitantes sintéticos com uma preferência fixa
 * (gostam de hue ~160, forma helix, pouco ruído). Mostra o fitness subindo
 * ao longo das gerações — prova de que o ciclo converge.
 *
 *   npx tsx scripts/simulate.ts
 */
import { evolve, freshState, fitnessOf } from '../src/ga/engine';
import type { Genome } from '../src/ga/genome';

const preference = (g: Genome): number => {
  const hueDist = Math.min(Math.abs(g.hue - 160), 360 - Math.abs(g.hue - 160)) / 180;
  let s = 0.4 * (1 - hueDist);
  s += g.shape === 'helix' ? 0.3 : g.shape === 'sphere' ? 0.15 : 0;
  s += 0.2 * (1 - g.noiseAmp / 0.6);
  s += 0.1 * (g.heroLayout === 'split' ? 1 : 0.4);
  return Math.max(0, Math.min(1, s + (Math.random() - 0.5) * 0.1)); // ruído de visitante
};

let state = freshState(42);
for (let gen = 0; gen < 25; gen++) {
  for (const ind of state.population) {
    for (let v = 0; v < 3; v++) {
      ind.evals += 1;
      ind.fitnessSum += preference(ind.genome);
    }
  }
  const best = [...state.population].sort((a, b) => fitnessOf(b) - fitnessOf(a))[0];
  const mean = state.population.reduce((s, i) => s + fitnessOf(i), 0) / state.population.length;
  console.log(
    `gen ${String(gen).padStart(2)}  best ${fitnessOf(best).toFixed(3)}  mean ${mean.toFixed(3)}  ` +
      `→ ${best.genome.shape.padEnd(7)} hue ${best.genome.hue.toFixed(0).padStart(3)}° noise ${best.genome.noiseAmp.toFixed(2)} ${best.genome.heroLayout}`,
  );
  state = evolve(state);
}
