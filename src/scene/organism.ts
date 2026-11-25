/**
 * O organismo: nuvem de partículas em Three.js cujo fenótipo é o genoma.
 * Morph suave entre formas quando o genoma muda; ruído 3D no vertex shader;
 * reação ao cursor; glow em duas camadas (núcleo + halo) sem pós-processamento,
 * o que mantém o canvas transparente e roda leve em mobile.
 */

import * as THREE from 'three';
import type { Genome } from '../ga/genome';
import { generateShape } from './shapes';

const MAX_PARTICLES = 16000;
// celular / tela de toque: GPU mais fraca, metade das partículas e pixel ratio menor
const COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
const PARTICLE_CAP = COARSE ? 6000 : MAX_PARTICLES;
const MAX_DPR = COARSE ? 1.25 : 1.5;
// O brilho (halo) é a passada cara: pontos grandes com mistura aditiva pintam muitos pixels.
// Ele usa só 1 de cada HALO_STRIDE partículas, com pontos um pouco maiores e alpha
// compensado — visual quase igual, ~60% menos pixels e 4× menos ruído na 2ª passada.
const HALO_STRIDE = 4;
const HALO_SIZE = 5.6; // era 4.5 com todas as partículas
const HALO_GAIN = 2.5; // compensa a densidade menor
// Raio-X: linha do feixe fora do canvas (acima = tudo normal; abaixo = tudo raio-x)
const XRAY_OFF = 1e6;
const XRAY_ALL = -1e6;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uNoiseAmp;
uniform float uNoiseFreq;
uniform float uPulse;
uniform float uPointSize;
uniform float uSpread;
uniform vec3 uCursor;      // posição do cursor no espaço do organismo
uniform float uCursorReact;
uniform float uPixelRatio;
uniform float uCount;      // partículas ativas
uniform float uHalo;       // 0 = núcleo, 1 = halo (camada de glow)
// transformação no currículo (ver transformToCv): cada vértice sai da posição VIVA
uniform float uCvOn;
uniform float uCvT;        // segundos desde o início
uniform vec4 uCvTime;      // início da ida, duração, início da volta, duração da volta
uniform float uCvSpread;   // atraso máximo
uniform float uCvSize;     // tamanho do ponto na folha (px)
uniform float uPaper;      // 0→1 enquanto o papel aparece por baixo
uniform vec4 uRemap;       // canvas em tela cheia: xy escala, zw deslocamento (em clip)

attribute vec3 positionB;
attribute float seed;
attribute vec2 aTarget;    // ponto da folha, em NDC da tela cheia
attribute vec3 aTCol;      // cor da "tinta" nesse ponto
attribute vec2 aCv;        // x = atraso, y = curvatura do arco

varying float vDepth;
varying float vMix;
varying float vAlpha;
varying float vCv;
varying vec3 vTCol;

float easeInOut(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }

// simplex noise 3D (Ashima / Stefan Gustavson)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  float isOn = step(float(gl_VertexID), uCount - 0.5);

  // morph entre a forma anterior (position) e a nova (positionB), com atraso por partícula
  float m = smoothstep(0.0, 1.0, clamp(uMorph * 1.4 - seed * 0.4, 0.0, 1.0));
  vec3 p = mix(position, positionB, m);

  // deformação orgânica
  float t = uTime * 0.35;
  vec3 n = vec3(
    snoise(p * uNoiseFreq + vec3(t, 0.0, 0.0)),
    snoise(p * uNoiseFreq + vec3(0.0, t, 13.7)),
    snoise(p * uNoiseFreq + vec3(31.2, 0.0, t))
  );
  p += n * uNoiseAmp;
  vMix = n.x * 0.5 + 0.5;

  // respiração
  p *= 1.0 + sin(uTime * 1.2 + seed * 6.283) * 0.04 * uPulse;
  p *= uSpread;

  // reação ao cursor: partículas próximas são empurradas para fora
  vec3 toCursor = p - uCursor;
  float d = length(toCursor);
  float push = smoothstep(0.55, 0.0, d) * uCursorReact * 0.45;
  p += normalize(toCursor + 1e-4) * push;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // canvas expandido para a tela cheia: reposiciona para o organismo não sair do lugar
  gl_Position.xy = gl_Position.xy * uRemap.xy + gl_Position.w * uRemap.zw;
  vDepth = clamp((-mv.z - 2.0) / 3.0, 0.0, 1.0);
  float size = uPointSize * (0.6 + seed * 0.8) * uPixelRatio;
  size *= mix(1.0, ${HALO_SIZE.toFixed(1)}, uHalo);
  gl_PointSize = size * (5.2 / -mv.z) * isOn;
  vAlpha = isOn * (0.5 + 0.5 * (1.0 - vDepth));

  vCv = 0.0;
  vTCol = aTCol;
  if (uCvOn > 0.5) {
    // ida: da posição atual (ainda girando, com ruído) até a folha; volta: o inverso,
    // pousando de novo na forma em movimento. Topo da folha chega primeiro.
    float go = easeInOut(clamp((uCvT - uCvTime.x - aCv.x) / uCvTime.y, 0.0, 1.0));
    float back = easeInOut(clamp((uCvT - uCvTime.z - (uCvSpread - aCv.x) * 0.8) / uCvTime.w, 0.0, 1.0));
    float k = go * (1.0 - back);
    vec2 from = gl_Position.xy / gl_Position.w;
    vec2 dir = aTarget - from;
    vec2 perp = vec2(-dir.y, dir.x);
    float arc = sin(3.14159265 * k) * aCv.y * (back > 0.0 ? -0.7 : 1.0);
    vec2 flutter = vec2(sin(uCvT * 4.0 + seed * 40.0), cos(uCvT * 3.3 + seed * 31.0)) * 0.006 * sin(3.14159265 * k);
    vec2 ndc = mix(from, aTarget, k) + perp * arc + flutter;
    gl_Position = vec4(ndc * gl_Position.w, gl_Position.z * (1.0 - k), gl_Position.w);
    gl_PointSize = mix(gl_PointSize, uCvSize * uPixelRatio * (0.8 + seed * 0.4), k) * isOn;
    vCv = k;
    // halo some na viagem (na folha só o núcleo, nítido); ao chegar, cede lugar ao papel
    vAlpha *= mix(1.0, 1.0 - k, uHalo);
    vAlpha = mix(vAlpha, isOn * (1.0 - 0.9 * uPaper), smoothstep(0.85, 1.0, k) * (1.0 - uHalo));
  }
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uHalo;
uniform float uBloom;
// Raio-X: acima desta linha (em px do buffer, origem embaixo) as partículas viram "esqueleto"
uniform float uXrayEdge;
uniform float uXrayBand;   // meia-largura do brilho do feixe, em px do buffer
uniform vec3 uXrayCol;
varying float vDepth;
varying float vMix;
varying float vAlpha;
varying float vCv;
varying vec3 vTCol;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  vec3 col = mix(uColorB, uColorA, smoothstep(0.2, 0.8, vMix + (1.0 - vDepth) * 0.3));
  col = mix(col, vTCol, smoothstep(0.3, 1.0, vCv));
  // Raio-X: acima do feixe, cor de raio-x; perto do feixe, um brilho branco
  float xr = step(uXrayEdge, gl_FragCoord.y);
  float bd = (gl_FragCoord.y - uXrayEdge) / uXrayBand;
  float band = exp(-bd * bd);
  col = mix(col, uXrayCol, xr);
  if (uHalo > 0.5) {
    // halo: gaussiano largo e fraco, intensidade = gene bloom
    float g = exp(-r * r * 14.0);
    gl_FragColor = vec4(col + band, g * vAlpha * ${(0.16 * HALO_GAIN).toFixed(2)} * uBloom * mix(1.0, 0.3, xr));
  } else {
    float core = smoothstep(0.5, 0.05, r);
    // no raio-x o ponto vira um anel (contorno), como num desenho técnico
    float ring = smoothstep(0.5, 0.4, r) * smoothstep(0.12, 0.26, r);
    float a = mix(core, ring * 0.95, xr);
    gl_FragColor = vec4(col * (0.9 + core * 1.1 * (1.0 - xr)) + band * 1.4, a * vAlpha + band * 0.5 * step(r, 0.5));
  }
}
`;

export class Organism {
  renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private points: THREE.Points;
  private halo: THREE.Points;
  private material: THREE.ShaderMaterial;
  private haloMaterial: THREE.ShaderMaterial;
  geometry: THREE.BufferGeometry;
  /** mesma memória de vértices, mas com índice que pula de HALO_STRIDE em HALO_STRIDE */
  private haloGeometry: THREE.BufferGeometry;
  private shape: Genome['shape'] | null = null;
  private posA: THREE.BufferAttribute;
  private posB: THREE.BufferAttribute;
  private timer = new THREE.Timer();
  private morph = 1;
  private targetCursor = new THREE.Vector3(10, 10, 0);
  private cursor = new THREE.Vector3(10, 10, 0);
  private rotSpeed = 0.1;
  private motion = 1;
  private shapeSeed = 1;
  private raf = 0;
  private running = true;
  private onScreen = true;
  private particles = 9000;
  quality = 1; // 1 → 0.4: reduzido automaticamente se os frames ficarem lentos
  private slowFrames = 0;
  dpr = Math.min(window.devicePixelRatio, MAX_DPR);
  /** frames por segundo medidos no próprio loop (para o painel ?debug) */
  fps = 0;
  private fpsFrames = 0;
  private fpsAt = performance.now();
  private colorA = new THREE.Color();
  private colorB = new THREE.Color();
  private targetA = new THREE.Color();
  private targetB = new THREE.Color();

  constructor(private canvas: HTMLCanvasElement, genome: Genome) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'default' });
    // 'default' deixa o navegador escolher: em Macs com 2 GPUs evita ligar a dedicada só para pontos
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    this.camera.position.set(0, 0, 3.8);

    this.geometry = new THREE.BufferGeometry();
    const seeds = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) seeds[i] = Math.random();
    const initial = generateShape(genome.shape, MAX_PARTICLES, 1);
    this.posA = new THREE.BufferAttribute(initial, 3);
    this.posB = new THREE.BufferAttribute(initial.slice(), 3);
    this.geometry.setAttribute('position', this.posA);
    this.geometry.setAttribute('positionB', this.posB);
    this.geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    this.geometry.setAttribute('aTarget', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 2), 2));
    this.geometry.setAttribute('aTCol', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
    this.geometry.setAttribute('aCv', new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 2), 2));
    this.geometry.setDrawRange(0, genome.particles);
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);

    this.haloGeometry = new THREE.BufferGeometry();
    for (const name of ['position', 'positionB', 'seed', 'aTarget', 'aTCol', 'aCv']) this.haloGeometry.setAttribute(name, this.geometry.getAttribute(name));
    const haloIndex = new Uint16Array(Math.ceil(MAX_PARTICLES / HALO_STRIDE));
    for (let i = 0; i < haloIndex.length; i++) haloIndex[i] = i * HALO_STRIDE;
    this.haloGeometry.setIndex(new THREE.BufferAttribute(haloIndex, 1));
    this.haloGeometry.boundingSphere = this.geometry.boundingSphere;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 1 },
        uNoiseAmp: { value: genome.noiseAmp },
        uNoiseFreq: { value: genome.noiseFreq },
        uPulse: { value: genome.pulse },
        uPointSize: { value: genome.pointSize },
        uSpread: { value: genome.spread },
        uCursor: { value: this.cursor },
        uCursorReact: { value: genome.cursorReact },
        uPixelRatio: { value: this.dpr },
        uCount: { value: genome.particles },
        uColorA: { value: this.colorA },
        uColorB: { value: this.colorB },
        uHalo: { value: 0 },
        uBloom: { value: genome.bloom },
        uCvOn: { value: 0 },
        uCvT: { value: 0 },
        uCvTime: { value: new THREE.Vector4(0, 1, 9, 1) },
        uCvSpread: { value: 0 },
        uCvSize: { value: 2 },
        uPaper: { value: 0 },
        uRemap: { value: new THREE.Vector4(1, 1, 0, 0) },
        uXrayEdge: { value: XRAY_OFF },
        uXrayBand: { value: 7 },
        uXrayCol: { value: new THREE.Color(0x5ec8ff) },
      },
    });
    this.haloMaterial = this.material.clone();
    this.haloMaterial.uniforms.uHalo.value = 1;
    // o clone copia valores; religa os uniforms que precisam ser compartilhados
    this.haloMaterial.uniforms.uCursor.value = this.cursor;
    this.haloMaterial.uniforms.uColorA.value = this.colorA;
    this.haloMaterial.uniforms.uColorB.value = this.colorB;
    for (const k of ['uCvTime', 'uRemap', 'uXrayCol'] as const) this.haloMaterial.uniforms[k].value = this.material.uniforms[k].value;

    this.halo = new THREE.Points(this.haloGeometry, this.haloMaterial);
    this.halo.frustumCulled = false;
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.halo.renderOrder = 0;
    this.points.renderOrder = 1;
    this.scene.add(this.halo, this.points);

    this.applyGenome(genome, true);
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      // projeta no plano z=0 do organismo
      const v = new THREE.Vector3(x, y, 0.5).unproject(this.camera);
      const dir = v.sub(this.camera.position).normalize();
      const dist = -this.camera.position.z / dir.z;
      this.targetCursor.copy(this.camera.position).add(dir.multiplyScalar(dist));
      // desfaz a rotação do organismo para o cursor ficar no espaço local
      this.targetCursor.applyQuaternion(this.points.quaternion.clone().invert());
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', () => this.targetCursor.set(10, 10, 0));

    // só renderiza com a aba visível E o hero na tela; fora disso a GPU descansa
    document.addEventListener('visibilitychange', () => this.setRunning());
    new IntersectionObserver(([e]) => {
      this.onScreen = e.isIntersecting;
      this.setRunning();
    }).observe(canvas);
    this.loop();
  }

  private setRunning(): void {
    const should = !document.hidden && this.onScreen;
    if (should === this.running) return;
    this.running = should;
    if (should) {
      this.timer.update(); // descarta o tempo parado
      this.loop();
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  private applyCount(): void {
    const n = Math.max(1500, Math.round(Math.min(PARTICLE_CAP, this.particles) * this.quality));
    this.geometry.setDrawRange(0, n);
    this.haloGeometry.setDrawRange(0, Math.ceil(n / HALO_STRIDE));
    this.material.uniforms.uCount.value = n;
    this.haloMaterial.uniforms.uCount.value = n;
  }

  /**
   * Qualidade adaptativa: se a média de frames passar de ~22 ms, primeiro baixa
   * o pixel ratio para 1, depois corta partículas em 25% por vez (até 40%).
   */
  private adapt(dt: number): void {
    if (dt > 0.022) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames < 45) return;
    this.slowFrames = 0;
    if (this.dpr > 1) {
      this.dpr = 1;
      this.renderer.setPixelRatio(1);
      this.material.uniforms.uPixelRatio.value = 1;
      this.haloMaterial.uniforms.uPixelRatio.value = 1;
      this.resize();
    } else if (this.quality > 0.4) {
      this.quality = Math.max(0.4, this.quality * 0.75);
      this.applyCount();
    }
  }

  /** Quantos vértices o organismo tem (destinos devem cobrir todos). */
  readonly capacity = MAX_PARTICLES;

  private cv: {
    start: number;
    paper: (t: number) => number;
    parent: Node;
    next: Node | null;
    style: string;
  } | null = null;

  /**
   * Transforma o organismo no currículo: cada vértice voa da sua posição atual
   * (com rotação, ruído e respiração ainda rodando) até `targets` (pixels da
   * janela). O canvas sai do hero e ocupa a tela inteira durante a animação;
   * uRemap compensa a projeção para a forma não "pular". Retorna false se o
   * hero não está visível (quem chama usa outra animação).
   */
  transformToCv(o: {
    targets: Float32Array;
    colors: Float32Array;
    delays: Float32Array;
    swirl: Float32Array;
    time: [formStart: number, formDur: number, backStart: number, backDur: number];
    spread: number;
    size: number;
    paper: (t: number) => number;
    zIndex: number;
  }): boolean {
    const r = this.canvas.getBoundingClientRect();
    const VW = window.innerWidth;
    const VH = window.innerHeight;
    const visible = r.bottom > 40 && r.top < VH - 40 && r.width > 10 && this.canvas.offsetParent !== null;
    if (!visible || this.cv) return false;

    // destinos em NDC da tela cheia
    const tgt = this.geometry.getAttribute('aTarget') as THREE.BufferAttribute;
    const tc = this.geometry.getAttribute('aTCol') as THREE.BufferAttribute;
    const cvA = this.geometry.getAttribute('aCv') as THREE.BufferAttribute;
    const ta = tgt.array as Float32Array;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      ta[i * 2] = (o.targets[i * 2] / VW) * 2 - 1;
      ta[i * 2 + 1] = 1 - (o.targets[i * 2 + 1] / VH) * 2;
      (cvA.array as Float32Array)[i * 2] = o.delays[i];
      (cvA.array as Float32Array)[i * 2 + 1] = o.swirl[i];
    }
    (tc.array as Float32Array).set(o.colors.subarray(0, MAX_PARTICLES * 3));
    tgt.needsUpdate = tc.needsUpdate = cvA.needsUpdate = true;

    // canvas vai para o <body> (fora de máscaras/opacidade do hero) em tela cheia
    this.cv = { start: performance.now(), paper: o.paper, parent: this.canvas.parentNode!, next: this.canvas.nextSibling, style: this.canvas.getAttribute('style') ?? '' };
    document.body.appendChild(this.canvas);
    this.canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;z-index:${o.zIndex};pointer-events:none;`;
    this.renderer.setSize(VW, VH, false);
    // a câmera mantém o aspecto antigo; o remap leva o "quadro" antigo para o retângulo do hero
    const remap = this.material.uniforms.uRemap.value as THREE.Vector4;
    remap.set(r.width / VW, r.height / VH, ((r.left + r.width / 2) / VW) * 2 - 1, 1 - ((r.top + r.height / 2) / VH) * 2);
    (this.material.uniforms.uCvTime.value as THREE.Vector4).set(...o.time);
    for (const u of [this.material.uniforms, this.haloMaterial.uniforms]) {
      u.uCvOn.value = 1;
      u.uCvT.value = 0;
      u.uCvSpread.value = o.spread;
      u.uCvSize.value = o.size;
      u.uPaper.value = 0;
    }
    this.onScreen = true;
    this.setRunning();
    return true;
  }

  /** Devolve o canvas ao hero e desliga a transformação. */
  endCv(): void {
    if (!this.cv) return;
    const { parent, next, style } = this.cv;
    this.cv = null;
    parent.insertBefore(this.canvas, next);
    if (style) this.canvas.setAttribute('style', style);
    else this.canvas.removeAttribute('style');
    (this.material.uniforms.uRemap.value as THREE.Vector4).set(1, 1, 0, 0);
    for (const u of [this.material.uniforms, this.haloMaterial.uniforms]) u.uCvOn.value = 0;
    this.resize();
  }

  /** Aplica um novo genoma; morph animado para a nova forma. */
  applyGenome(g: Genome, immediate = false): void {
    for (const u of [this.material.uniforms, this.haloMaterial.uniforms]) {
      u.uNoiseAmp.value = g.noiseAmp;
      u.uNoiseFreq.value = g.noiseFreq;
      u.uPulse.value = g.pulse;
      u.uPointSize.value = g.pointSize;
      u.uSpread.value = g.spread;
      u.uCursorReact.value = g.cursorReact;
      u.uBloom.value = g.bloom;
    }
    this.particles = g.particles;
    this.applyCount();
    // halo quase invisível não compensa uma segunda passada com pontos 4.5× maiores
    this.halo.visible = g.bloom > 0.15;
    this.rotSpeed = g.rotSpeed;
    this.motion = g.motion;

    this.targetA.setHSL(g.hue / 360, g.sat, 0.62, THREE.SRGBColorSpace);
    // accentMode 'mono': organismo em um só tom; 'split': segundo tom apagado
    const h2 = g.accentMode === 'mono' ? g.hue : g.hue2;
    this.targetB.setHSL(h2 / 360, g.accentMode === 'split' ? g.sat * 0.35 : g.sat, 0.58, THREE.SRGBColorSpace);

    // Forma: só regenera (e reenvia ~375 KB à GPU) quando o gene shape muda.
    // Nos outros passos de mutação bastam os uniforms acima.
    if (!immediate && g.shape === this.shape) return;
    this.shape = g.shape;
    // a atual vira "A", a nova vira "B", morph de 0 → 1
    this.shapeSeed += 1;
    const next = generateShape(g.shape, MAX_PARTICLES, this.shapeSeed);
    if (immediate) {
      (this.posA.array as Float32Array).set(next);
      (this.posB.array as Float32Array).set(next);
      this.colorA.copy(this.targetA);
      this.colorB.copy(this.targetB);
      this.morph = 1;
    } else {
      // congela a posição atual interpolada como ponto de partida
      const a = this.posA.array as Float32Array;
      const b = this.posB.array as Float32Array;
      const m = this.morph;
      for (let i = 0; i < a.length; i++) a[i] = a[i] + (b[i] - a[i]) * Math.min(1, m);
      b.set(next);
      this.morph = 0;
    }
    this.posA.needsUpdate = true;
    this.posB.needsUpdate = true;
  }

  private resize(): void {
    if (this.cv) return; // durante a transformação o canvas ocupa a tela inteira
    const parent = this.canvas.parentElement ?? document.body;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // em telas estreitas afasta a câmera para o organismo caber
    this.camera.position.z = w < 720 ? 5.0 : 3.8;
  }

  private loop = (): void => {
    if (!this.running) return;
    this.timer.update();
    const rawDt = this.timer.getDelta();
    // > 250 ms é aba/iframe estrangulado pelo navegador, não GPU lenta
    if (this.morph >= 1 && rawDt < 0.25 && !this.cv) this.adapt(rawDt); // durante o morph há regeneração de buffers
    const dt = Math.min(0.05, rawDt);
    const t = this.timer.getElapsed() * this.motion;
    if (this.morph < 1) this.morph = Math.min(1, this.morph + dt * 0.55);
    for (const u of [this.material.uniforms, this.haloMaterial.uniforms]) {
      u.uTime.value = t;
      u.uMorph.value = this.morph;
    }
    if (this.cv) {
      const ct = (performance.now() - this.cv.start) / 1000;
      const paper = this.cv.paper(ct);
      for (const u of [this.material.uniforms, this.haloMaterial.uniforms]) {
        u.uCvT.value = ct;
        u.uPaper.value = paper;
      }
    }

    this.colorA.lerp(this.targetA, dt * 2);
    this.colorB.lerp(this.targetB, dt * 2);
    this.cursor.lerp(this.targetCursor, dt * 6);

    this.points.rotation.y += dt * this.rotSpeed * this.motion;
    this.points.rotation.x = Math.sin(t * 0.17) * 0.25;
    this.points.rotation.z = Math.cos(t * 0.11) * 0.12;
    this.halo.rotation.copy(this.points.rotation);

    this.renderer.render(this.scene, this.camera);
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsAt >= 1000) {
      this.fps = Math.round((this.fpsFrames * 1000) / (now - this.fpsAt));
      this.fpsFrames = 0;
      this.fpsAt = now;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  /**
   * Raio-X: 'off' = normal, 'on' = tudo em raio-x, número = posição do feixe
   * (clientY da janela). Acima do feixe as partículas viram contorno azul.
   */
  setXray(edge: 'off' | 'on' | number): void {
    let px = edge === 'off' ? XRAY_OFF : edge === 'on' ? XRAY_ALL : 0;
    let band = 7;
    if (typeof edge === 'number') {
      const r = this.canvas.getBoundingClientRect();
      const scale = r.height > 0 ? this.renderer.domElement.height / r.height : 1;
      px = (r.bottom - edge) * scale;
      band = 7 * scale;
    }
    for (const u of [this.material.uniforms, this.haloMaterial.uniforms]) {
      u.uXrayEdge.value = px;
      u.uXrayBand.value = band;
    }
  }

  /** Números para o painel ?debug. */
  stats() {
    const info = this.renderer.info.render;
    return {
      fps: this.running ? this.fps : 0,
      running: this.running,
      drawCalls: info.calls,
      points: info.points,
      particles: this.geometry.drawRange.count,
      halo: this.halo.visible ? this.haloGeometry.drawRange.count : 0,
      dpr: this.dpr,
      quality: this.quality,
      canvas: `${this.renderer.domElement.width}×${this.renderer.domElement.height}`,
    };
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
  }
}
