/**
 * Download do currículo com animação: uma fenda dimensional (design original —
 * anéis tracejados, espiral e partículas sendo sugadas, nas cores do genoma)
 * se abre, o currículo sai dela em 3D, gira para a câmera e voa para o canto
 * da tela enquanto o PDF é baixado. Depois a fenda se fecha.
 *
 * Three.js já é usado pelo organismo; aqui ele é importado sob demanda, então
 * nada é baixado até alguém clicar em "Baixar currículo".
 * Com prefers-reduced-motion (ou sem WebGL), baixa direto, sem animação.
 */

import { getLang, t } from '../i18n';
import { profile } from '../content';

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

/** Página do currículo desenhada num canvas (vira a textura do plano 3D). */
function pageTexture(accent: string): HTMLCanvasElement {
  const W = 512;
  const H = 724;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f7f8fb';
  g.fillRect(0, 0, W, H);
  g.fillStyle = accent;
  g.fillRect(0, 0, W, 14);
  g.fillStyle = '#16181f';
  g.font = 'bold 44px Inter, system-ui, sans-serif';
  g.fillText(profile.name, 40, 92);
  g.fillStyle = accent;
  g.font = '24px Inter, system-ui, sans-serif';
  g.fillText(getLang() === 'pt' ? 'Desenvolvedor full stack' : 'Full stack developer', 40, 132);
  g.fillStyle = '#8a90a0';
  g.font = '17px Inter, system-ui, sans-serif';
  g.fillText(profile.email, 40, 164);
  // blocos de seção com linhas "de texto"
  let y = 210;
  for (let s = 0; s < 5; s++) {
    g.fillStyle = accent;
    g.fillRect(40, y, 120, 10);
    g.fillStyle = '#dfe2e8';
    g.fillRect(40, y + 20, W - 80, 2);
    y += 38;
    const lines = 3 + (s % 2);
    for (let l = 0; l < lines; l++) {
      g.fillStyle = l === 0 ? '#3a3f4b' : '#b7bcc7';
      g.fillRect(l === 0 ? 40 : 56, y, (W - 120) * (0.55 + ((s * 7 + l * 13) % 40) / 100), 9);
      y += 20;
    }
    y += 16;
  }
  return c;
}

const portalVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const portalFrag = /* glsl */ `
uniform float uTime;
uniform float uOpen;
uniform vec3 uA;
uniform vec3 uB;
varying vec2 vUv;
#define TAU 6.2831853
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p) / max(uOpen, 0.001);
  float a = atan(p.y, p.x);
  if (r > 1.25) discard;

  // espiral logarítmica girando para dentro
  float spiral = 0.5 + 0.5 * sin(a * 5.0 + log(r + 0.04) * 9.0 - uTime * 5.0);
  // ondas concêntricas descendo para o centro
  float waves = 0.5 + 0.5 * sin(r * 34.0 + uTime * 9.0);
  float inside = smoothstep(1.0, 0.9, r);
  float core = smoothstep(0.45, 0.0, r);

  // borda: anel brilhante + anel externo tracejado girando ao contrário
  float rim = exp(-pow((r - 0.97) * 16.0, 2.0));
  float dashes = step(0.45, fract(a / TAU * 28.0 - uTime * 0.6));
  float outer = exp(-pow((r - 1.12) * 40.0, 2.0)) * dashes;

  vec3 col = mix(uB, uA, spiral);
  col *= 0.25 + 0.75 * spiral * (0.6 + 0.4 * waves);
  col += core * 0.9 * mix(uA, vec3(1.0), 0.3);
  col += rim * mix(uA, vec3(1.0), 0.15) * 1.6;
  col += outer * uB * 1.4;

  float alpha = inside * (0.45 + 0.55 * spiral) + rim + outer;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * smoothstep(0.0, 0.15, uOpen));
}
`;

const ease = {
  outBack: (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2),
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  in: (x: number) => x * x * x,
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export async function downloadCv(): Promise<void> {
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

  // camada sobre a página (não bloqueia cliques)
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 0, 6);

  const accent = cssColor('--accent', '#7cf5c4');
  const accent2 = cssColor('--accent2', '#b48cff');
  const colA = new THREE.Color(accent);
  const colB = new THREE.Color(accent2);

  // fenda: disco com shader, levemente inclinado para parecer 3D
  const portalMat = new THREE.ShaderMaterial({
    vertexShader: portalVert,
    fragmentShader: portalFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpen: { value: 0 }, uA: { value: colA }, uB: { value: colB } },
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), portalMat);
  portal.rotation.set(-0.18, 0.28, 0);
  scene.add(portal);

  // partículas sendo sugadas pela espiral
  const N = 420;
  const pos = new Float32Array(N * 3);
  const orbit = Array.from({ length: N }, () => ({ a: Math.random() * Math.PI * 2, r: 0.4 + Math.random() * 2.4, s: 0.6 + Math.random() }));
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ color: colA, size: 0.045, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const particles = new THREE.Points(pGeo, pMat);
  particles.rotation.copy(portal.rotation);
  scene.add(particles);

  // o currículo: plano A4 com a página desenhada + brilho atrás
  const tex = new THREE.CanvasTexture(pageTexture(accent));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const doc = new THREE.Group();
  const page = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2 * 1.414),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true }),
  );
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6 * 1.414),
    new THREE.MeshBasicMaterial({ color: colA, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  glow.position.z = -0.02;
  doc.add(glow, page);
  doc.visible = false;
  scene.add(doc);

  // canto inferior direito da tela, no plano z = 1 (destino do voo)
  const corner = new THREE.Vector3(0.82, -0.82, 0.5).unproject(camera);
  const dir = corner.sub(camera.position).normalize();
  const target = camera.position.clone().add(dir.multiplyScalar((camera.position.z - 1) / -dir.z));

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  const DURATION = 3.4;
  const DOWNLOAD_AT = 2.75;
  let downloaded = false;
  const download = () => {
    if (downloaded) return;
    downloaded = true;
    triggerDownload();
    label.textContent = t('cv.done');
  };
  const start = performance.now();
  requestAnimationFrame(() => overlay.classList.add('on'));

  // O download e o fim da animação dependem do relógio, não dos quadros: se a aba
  // for para segundo plano (rAF para), o arquivo ainda é baixado e a camada some.
  const dlTimer = window.setTimeout(download, DOWNLOAD_AT * 1000);
  await new Promise<void>((resolve) => {
    const done = window.setTimeout(resolve, DURATION * 1000 + 250);
    const frame = () => {
      const tt = (performance.now() - start) / 1000;

      // fenda: abre (0–0.6s), fica, fecha (2.7–3.3s)
      const open = ease.outBack(seg(tt, 0, 0.6)) * (1 - ease.in(seg(tt, 2.7, 3.3)));
      portalMat.uniforms.uOpen.value = Math.max(0, open);
      portalMat.uniforms.uTime.value = tt;

      for (let i = 0; i < N; i++) {
        const o = orbit[i];
        o.r -= 0.012 * o.s * (0.5 + o.r);
        o.a += 0.035 * o.s * (2.6 / (o.r + 0.3));
        if (o.r < 0.08) o.r = 2.2 + Math.random() * 0.6;
        const rr = o.r * Math.max(0, open);
        pos[i * 3] = Math.cos(o.a) * rr;
        pos[i * 3 + 1] = Math.sin(o.a) * rr;
        pos[i * 3 + 2] = (1 - o.r / 2.8) * -0.4;
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = Math.min(1, open);

      // currículo: sai girando (0.45–1.6s), flutua, voa para o canto (2.1–2.85s)
      const emerge = ease.inOut(seg(tt, 0.45, 1.6));
      const fly = ease.inOut(seg(tt, 2.1, 2.85));
      doc.visible = tt > 0.45 && fly < 1;
      const hover = Math.sin(tt * 2.2) * 0.06 * (1 - fly);
      const out = new THREE.Vector3(0, hover, -0.6 + emerge * 1.8);
      doc.position.lerpVectors(out, target, fly);
      doc.scale.setScalar((0.12 + 0.88 * emerge) * (1 - 0.88 * fly));
      doc.rotation.set(0.15 * (1 - emerge) + 0.25 * fly, Math.PI * 2.5 * (1 - emerge) + 0.15 * Math.sin(tt * 1.4) * (1 - fly), -0.5 * fly);

      if (tt >= DOWNLOAD_AT) download();
      if (tt > 2.9) overlay.classList.remove('on');

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
  window.removeEventListener('resize', onResize);
  tex.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  overlay.remove();
  running = false;
}

/** Liga todos os botões [data-cv-download] (inclusive os criados depois). */
export function initCvDownload(onDownload: () => void): void {
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('[data-cv-download]');
    if (!btn) return;
    e.preventDefault();
    onDownload();
    void downloadCv();
  });
}
