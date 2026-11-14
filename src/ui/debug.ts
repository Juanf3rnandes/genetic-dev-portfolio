/**
 * Painel de desempenho, ligado com ?debug na URL (equivalente leve ao stats-gl).
 * Mostra fps do organismo 3D, draw calls, partículas, pixel ratio, qualidade
 * adaptativa e o estado da deriva. Atualiza 2×/s; sem dependências.
 */

interface OrganismLike {
  stats(): {
    fps: number;
    running: boolean;
    drawCalls: number;
    points: number;
    particles: number;
    halo: number;
    dpr: number;
    quality: number;
    canvas: string;
  };
}

export function initDebug(getOrganism: () => OrganismLike | null, getDrift: () => number, getId: () => string): void {
  if (!new URLSearchParams(location.search).has('debug')) return;
  const panel = document.createElement('pre');
  panel.className = 'debug-panel mono';
  panel.setAttribute('aria-hidden', 'true');
  document.body.appendChild(panel);

  // fps da página inteira (independente do WebGL)
  let frames = 0;
  let pageFps = 0;
  let at = performance.now();
  const count = (now: number) => {
    frames++;
    if (now - at >= 1000) {
      pageFps = Math.round((frames * 1000) / (now - at));
      frames = 0;
      at = now;
    }
    requestAnimationFrame(count);
  };
  requestAnimationFrame(count);

  setInterval(() => {
    const o = getOrganism()?.stats();
    const lines = [
      `page fps     ${pageFps}`,
      o ? `webgl fps    ${o.running ? o.fps : 'pausado'}` : 'webgl        —',
      o ? `draw calls   ${o.drawCalls}` : '',
      o ? `pontos       ${o.points.toLocaleString()}  (núcleo ${o.particles.toLocaleString()} + halo ${o.halo.toLocaleString()})` : '',
      o ? `canvas       ${o.canvas} @ ${o.dpr}x` : '',
      o ? `qualidade    ${(o.quality * 100).toFixed(0)}%` : '',
      `deriva       ${(getDrift() * 100).toFixed(0)}%`,
      `indivíduo    ${getId()}`,
    ].filter(Boolean);
    panel.textContent = lines.join('\n');
  }, 500);
}
