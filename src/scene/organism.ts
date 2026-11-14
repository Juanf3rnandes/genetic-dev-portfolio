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

attribute vec3 positionB;
attribute float seed;

varying float vDepth;
varying float vMix;
varying float vAlpha;

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
  vDepth = clamp((-mv.z - 2.0) / 3.0, 0.0, 1.0);
  float size = uPointSize * (0.6 + seed * 0.8) * uPixelRatio;
  size *= mix(1.0, ${HALO_SIZE.toFixed(1)}, uHalo);
  gl_PointSize = size * (5.2 / -mv.z) * isOn;
  vAlpha = isOn * (0.5 + 0.5 * (1.0 - vDepth));
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uHalo;
uniform float uBloom;
varying float vDepth;
varying float vMix;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  vec3 col = mix(uColorB, uColorA, smoothstep(0.2, 0.8, vMix + (1.0 - vDepth) * 0.3));
  if (uHalo > 0.5) {
    // halo: gaussiano largo e fraco, intensidade = gene bloom
    float g = exp(-r * r * 14.0);
    gl_FragColor = vec4(col, g * vAlpha * ${(0.16 * HALO_GAIN).toFixed(2)} * uBloom);
  } else {
    float core = smoothstep(0.5, 0.05, r);
    gl_FragColor = vec4(col * (0.9 + core * 1.1), core * vAlpha);
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
    this.geometry.setDrawRange(0, genome.particles);
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);

    this.haloGeometry = new THREE.BufferGeometry();
    for (const name of ['position', 'positionB', 'seed']) this.haloGeometry.setAttribute(name, this.geometry.getAttribute(name));
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
      },
    });
    this.haloMaterial = this.material.clone();
    this.haloMaterial.uniforms.uHalo.value = 1;
    // o clone copia valores; religa os uniforms que precisam ser compartilhados
    this.haloMaterial.uniforms.uCursor.value = this.cursor;
    this.haloMaterial.uniforms.uColorA.value = this.colorA;
    this.haloMaterial.uniforms.uColorB.value = this.colorB;

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
    this.targetB.setHSL(g.hue2 / 360, g.sat, 0.58, THREE.SRGBColorSpace);

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
    if (this.morph >= 1 && rawDt < 0.25) this.adapt(rawDt); // durante o morph há regeneração de buffers
    const dt = Math.min(0.05, rawDt);
    const t = this.timer.getElapsed() * this.motion;
    if (this.morph < 1) this.morph = Math.min(1, this.morph + dt * 0.55);
    for (const u of [this.material.uniforms, this.haloMaterial.uniforms]) {
      u.uTime.value = t;
      u.uMorph.value = this.morph;
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
