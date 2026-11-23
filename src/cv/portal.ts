/**
 * Download do currículo com animação: o PRÓPRIO organismo 3D se transforma no
 * currículo. Cada vértice sai da posição em que está naquele instante (a forma
 * continua girando e respirando) e escoa, em arco, até um ponto da folha — tudo
 * no vertex shader do organismo (ver Organism.transformToCv). A folha
 * "materializa" (o papel aparece por baixo), o PDF é baixado e os vértices
 * voltam para a forma em movimento.
 *
 * Se o hero está fora da tela (clique no botão do contato, por exemplo), as
 * partículas nascem do próprio botão e voltam para ele.
 *
 * Three.js já é usado pelo organismo; aqui ele é importado sob demanda.
 * Com prefers-reduced-motion (ou sem WebGL), baixa direto, sem animação.
 */

import { getLang, t, tr } from '../i18n';
import { education, experience, profile } from '../content';

/** O que a animação precisa do organismo (ver Organism.transformToCv). */
export interface ParticleSource {
  readonly capacity: number;
  transformToCv(o: {
    targets: Float32Array;
    colors: Float32Array;
    delays: Float32Array;
    swirl: Float32Array;
    time: [number, number, number, number];
    spread: number;
    size: number;
    paper: (t: number) => number;
    zIndex: number;
  }): boolean;
  endCv(): void;
}

let running = false;

function cssColor(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function cvUrl(): string {
  return new URL(`cv/juan-fernandes-cv-${getLang()}.pdf`, document.baseURI).href;
}

function triggerDownload(): void {
  const a = document.createElement('a');
  a.href = cvUrl();
  a.download = `Juan-Fernandes-CV-${getLang().toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------------------------------------------------------------------------
// A folha: desenhada num canvas 2D com o conteúdo real (nome, cargo, empresas).
// O mesmo desenho serve de textura do papel e de mapa de onde as partículas pousam.
// ---------------------------------------------------------------------------

const PAGE_W = 420; // unidades lógicas; escalado para o tamanho final na tela
const PAGE_H = Math.round(PAGE_W * 1.414);

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxW && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function drawPage(scale: number, accent: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(PAGE_W * scale);
  c.height = Math.round(PAGE_H * scale);
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  const X = 30;
  const W = PAGE_W - X * 2;
  const font = (w: number, s: number) => `${w} ${s}px Inter, system-ui, sans-serif`;

  g.fillStyle = '#f7f8fb';
  g.fillRect(0, 0, PAGE_W, PAGE_H);
  g.fillStyle = accent;
  g.fillRect(0, 0, PAGE_W, 7);

  g.fillStyle = '#16181f';
  g.font = font(700, 30);
  g.fillText(profile.name, X, 54);
  g.fillStyle = accent;
  g.font = font(500, 13);
  g.fillText(tr(profile.role), X, 76);
  g.fillStyle = '#7d8494';
  g.font = font(400, 9.5);
  g.fillText(`${profile.email}  ·  github.com/Juanf3rnandes`, X, 94);

  let y = 120;
  const section = (title: string) => {
    g.fillStyle = accent;
    g.font = font(700, 9.5);
    g.fillText(title.toUpperCase(), X, y);
    g.fillStyle = '#dde0e7';
    g.fillRect(X, y + 5, W, 1);
    y += 19;
  };
  const para = (text: string, size: number, color: string, weight = 400, indent = 0) => {
    g.fillStyle = color;
    g.font = font(weight, size);
    for (const l of wrap(g, text, W - indent)) {
      if (y > PAGE_H - 24) return;
      g.fillText(l, X + indent, y);
      y += size * 1.38;
    }
  };

  const pt = getLang() === 'pt';
  section(pt ? 'Resumo' : 'Summary');
  para(tr(profile.lede), 8.5, '#3a3f4b');
  y += 10;

  section(pt ? 'Experiência' : 'Experience');
  for (const j of experience) {
    if (y > PAGE_H - 60) break;
    g.fillStyle = '#7d8494';
    g.font = font(400, 8.5);
    const period = tr(j.period);
    const periodW = g.measureText(period).width;
    g.fillText(period, X + W - periodW, y);
    // título cortado com reticências para nunca encostar na data
    g.fillStyle = '#16181f';
    g.font = font(700, 10);
    let title = `${tr(j.role)} — ${j.company}`;
    const maxW = W - periodW - 12;
    if (g.measureText(title).width > maxW) {
      while (title.length > 4 && g.measureText(`${title}…`).width > maxW) title = title.slice(0, -1);
      title = `${title.trimEnd()}…`;
    }
    g.fillText(title, X, y);
    y += 14;
    for (const b of j.bullets.slice(0, 3)) {
      g.fillStyle = accent;
      g.fillRect(X + 2, y - 4, 3, 3);
      para(tr(b), 8, '#4a505c', 400, 10);
    }
    y += 8;
  }

  if (y < PAGE_H - 50) {
    section(pt ? 'Formação' : 'Education');
    para(`${tr(education.degree)} · ${education.school}`, 8.5, '#3a3f4b');
  }
  return c;
}

/**
 * Pontos de pouso das partículas: pixels de "tinta" da folha (texto, barras) e
 * o contorno do papel. Coordenadas em unidades lógicas da folha (0..PAGE_W).
 */
function landingPoints(n: number, accent: string): { xy: Float32Array; color: Float32Array } {
  const S = 1.5;
  const c = drawPage(S, accent);
  const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  const ink: number[] = [];
  for (let py = 0; py < c.height; py++) {
    for (let px = 0; px < c.width; px++) {
      const o = (py * c.width + px) * 4;
      const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
      if (lum < 205) ink.push(o);
    }
  }
  const xy = new Float32Array(n * 2);
  const color = new Float32Array(n * 3);
  const edgeCount = Math.round(n * 0.14);
  for (let i = 0; i < n; i++) {
    if (i < edgeCount || ink.length === 0) {
      // contorno do papel
      const per = 2 * (PAGE_W + PAGE_H);
      let d = (i / Math.max(1, edgeCount)) * per;
      let x: number;
      let y: number;
      if (d < PAGE_W) [x, y] = [d, 0];
      else if ((d -= PAGE_W) < PAGE_H) [x, y] = [PAGE_W, d];
      else if ((d -= PAGE_H) < PAGE_W) [x, y] = [PAGE_W - d, PAGE_H];
      else [x, y] = [0, PAGE_H - (d - PAGE_W)];
      xy[i * 2] = x;
      xy[i * 2 + 1] = y;
      color.set([0.85, 0.88, 0.95], i * 3);
      continue;
    }
    const o = ink[Math.floor(Math.random() * ink.length)];
    const p = o / 4;
    xy[i * 2] = (p % c.width) / S + (Math.random() - 0.5) * 0.6;
    xy[i * 2 + 1] = Math.floor(p / c.width) / S + (Math.random() - 0.5) * 0.6;
    // tinta escura vira partícula clara (fundo da tela é escuro); destaque mantém a cor
    const r = data[o] / 255;
    const gg = data[o + 1] / 255;
    const b = data[o + 2] / 255;
    const sat = Math.max(r, gg, b) - Math.min(r, gg, b);
    if (sat > 0.25) color.set([r, gg, b], i * 3);
    else color.set([0.93, 0.95, 1], i * 3);
  }
  return { xy, color };
}

// ---------------------------------------------------------------------------

const pointVert = /* glsl */ `
attribute vec3 aColor;
attribute float aAlpha;
uniform float uSize;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize;
}
`;
const pointFrag = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float core = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(vColor * (0.85 + core * 0.6), core * vAlpha);
}
`;

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (tt: number, a: number, b: number) => clamp01((tt - a) / (b - a));

// linha do tempo (segundos)
const FORM_START = 0.1;
const FORM_DUR = 1.05; // voo de cada partícula
const FORM_SPREAD = 0.7; // atraso máximo (de cima para baixo na folha)
const PAPER_IN = [1.85, 2.35] as const;
const DOWNLOAD_AT = 2.45;
const PAPER_OUT = [2.95, 3.3] as const;
const BACK_START = 3.0;
const DURATION = 4.55;

export async function downloadCv(source?: ParticleSource | null, origin?: Element | null): Promise<void> {
  if (running) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return triggerDownload();
  running = true;

  let THREE: typeof import('./three-subset');
  try {
    THREE = await import('./three-subset');
  } catch {
    running = false;
    return triggerDownload();
  }

  const overlay = document.createElement('div');
  overlay.className = 'cv-portal';
  overlay.setAttribute('aria-hidden', 'true');
  const label = document.createElement('div');
  label.className = 'cv-portal-label mono';
  label.textContent = t('cv.downloading');
  const canvas = document.createElement('canvas');
  overlay.append(canvas, label);
  document.body.appendChild(overlay);

  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'default' });
  } catch {
    overlay.remove();
    running = false;
    return triggerDownload();
  }
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  // câmera ortográfica em pixels da janela: x para a direita, y = -pixelY
  let VW = window.innerWidth;
  let VH = window.innerHeight;
  const camera = new THREE.OrthographicCamera(0, VW, 0, -VH, -10, 10);
  renderer.setSize(VW, VH, false);
  const scene = new THREE.Scene();
  const accent = cssColor('--accent', '#7cf5c4');

  // ---- destino: a folha, centralizada e com altura proporcional à tela
  const scale = Math.min((VH * 0.74) / PAGE_H, (VW * 0.86) / PAGE_W);
  const pageW = PAGE_W * scale;
  const pageH = PAGE_H * scale;
  const pageX = (VW - pageW) / 2;
  const pageY = (VH - pageH) / 2 - VH * 0.02;

  const N = source?.capacity ?? 4200;
  const land = landingPoints(N, accent);
  const end = new Float32Array(N * 2);
  const delay = new Float32Array(N);
  const rnd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    end[i * 2] = pageX + land.xy[i * 2] * scale;
    end[i * 2 + 1] = pageY + land.xy[i * 2 + 1] * scale;
    // topo da folha chega primeiro, com um pouco de aleatoriedade
    delay[i] = (land.xy[i * 2 + 1] / PAGE_H) * FORM_SPREAD * 0.75 + Math.random() * FORM_SPREAD * 0.25;
    rnd[i] = Math.random();
  }
  const paperLevel = (tt: number) =>
    easeInOut(seg(tt, PAPER_IN[0], PAPER_IN[1])) * (1 - easeInOut(seg(tt, PAPER_OUT[0], PAPER_OUT[1])));

  // ---- o papel (textura com o conteúdo real), atrás das partículas
  const tex = new THREE.CanvasTexture(drawPage(Math.min(3, scale * dpr), accent));
  tex.colorSpace = THREE.SRGBColorSpace;
  const paperMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(pageW, pageH), paperMat);
  paper.position.set(pageX + pageW / 2, -(pageY + pageH / 2), 0);
  paper.renderOrder = 1;
  scene.add(paper);

  // ---- modo principal: o organismo se transforma (o canvas dele fica acima desta camada)
  const swirlNdc = Float32Array.from(rnd, (r) => (r - 0.35) * 0.55);
  const live =
    !!source &&
    source.transformToCv({
      targets: end,
      colors: land.color,
      delays: delay,
      swirl: swirlNdc,
      time: [FORM_START, FORM_DUR, BACK_START, FORM_DUR * 0.85],
      spread: FORM_SPREAD,
      size: 1.9,
      paper: paperLevel,
      zIndex: 96,
    });

  // ---- alternativa (hero fora da tela): partículas próprias nascendo do botão
  let fallback: ((tt: number) => void) | null = null;
  let geo: import('three').BufferGeometry | null = null;
  if (!live) {
    const r = origin?.getBoundingClientRect();
    const cx = r ? r.left + r.width / 2 : VW / 2;
    const cy = r ? r.top + r.height / 2 : VH / 2;
    const c0 = new THREE.Color(accent);
    const start = new Float32Array(N * 2);
    const swirl = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * 26;
      start[i * 2] = cx + Math.cos(a) * d;
      start[i * 2 + 1] = cy + Math.sin(a) * d * 0.6;
      const len = Math.hypot(end[i * 2] - start[i * 2], end[i * 2 + 1] - start[i * 2 + 1]);
      swirl[i] = (rnd[i] - 0.35) * Math.min(260, len * 0.55);
    }
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const alpha = new Float32Array(N);
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const baseSize = 2.4 * dpr;
    const mat = new THREE.ShaderMaterial({
      vertexShader: pointVert,
      fragmentShader: pointFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uSize: { value: baseSize } },
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 2;
    scene.add(points);
    const g = geo;
    fallback = (tt) => {
      const pl = paperLevel(tt);
      mat.uniforms.uSize.value = baseSize * (1 - 0.25 * pl);
      for (let i = 0; i < N; i++) {
        const sx = start[i * 2];
        const sy = start[i * 2 + 1];
        const dx = end[i * 2] - sx;
        const dy = end[i * 2 + 1] - sy;
        const go = easeInOut(seg(tt, FORM_START + delay[i], FORM_START + delay[i] + FORM_DUR));
        const bs = BACK_START + (FORM_SPREAD - delay[i]) * 0.8;
        const back = easeInOut(seg(tt, bs, bs + FORM_DUR * 0.85));
        const k = go * (1 - back);
        const len = Math.hypot(dx, dy) || 1;
        const arc = Math.sin(Math.PI * k) * swirl[i] * (back > 0 ? -0.7 : 1);
        pos[i * 3] = sx + dx * k + (-dy / len) * arc;
        pos[i * 3 + 1] = -(sy + dy * k + (dx / len) * arc);
        const cm = easeOut(k);
        for (let j = 0; j < 3; j++) {
          const from = j === 0 ? c0.r : j === 1 ? c0.g : c0.b;
          col[i * 3 + j] = from + (land.color[i * 3 + j] - from) * cm;
        }
        const arrived = cm > 0.9 ? 1 - 0.9 * pl : 1;
        alpha[i] = seg(tt, 0, 0.18) * (1 - seg(tt, DURATION - 0.5, DURATION - 0.1)) * arrived;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.aColor.needsUpdate = true;
      g.attributes.aAlpha.needsUpdate = true;
    };
  }

  const onResize = () => {
    VW = window.innerWidth;
    VH = window.innerHeight;
    renderer.setSize(VW, VH, false);
    camera.right = VW;
    camera.bottom = -VH;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  let downloaded = false;
  const download = () => {
    if (downloaded) return;
    downloaded = true;
    triggerDownload();
    label.textContent = t('cv.done');
  };

  const t0 = performance.now();
  requestAnimationFrame(() => overlay.classList.add('on'));

  // download e fim dependem do relógio, não dos quadros: com a aba em segundo
  // plano (rAF parado) o arquivo ainda é baixado e a camada some.
  const dlTimer = window.setTimeout(download, DOWNLOAD_AT * 1000);
  await new Promise<void>((resolve) => {
    const done = window.setTimeout(resolve, DURATION * 1000 + 300);
    const frame = () => {
      const tt = (performance.now() - t0) / 1000;
      paperMat.opacity = paperLevel(tt);
      fallback?.(tt);
      if (tt >= DOWNLOAD_AT) download();
      if (tt > BACK_START + 0.6) label.style.opacity = '0';
      if (tt > DURATION - 0.45) overlay.classList.remove('on');
      renderer.render(scene, camera);
      if (tt < DURATION) requestAnimationFrame(frame);
      else {
        clearTimeout(done);
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });

  clearTimeout(dlTimer);
  download();
  if (live) source!.endCv();
  window.removeEventListener('resize', onResize);
  tex.dispose();
  geo?.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  overlay.remove();
  running = false;
}

/** Liga todos os botões [data-cv-download] (inclusive os criados depois). */
export function initCvDownload(onDownload: () => void, getSource: () => ParticleSource | null = () => null): void {
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('[data-cv-download]');
    if (!btn) return;
    e.preventDefault();
    onDownload();
    void downloadCv(getSource(), btn);
  });
}
