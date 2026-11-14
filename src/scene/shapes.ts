import type { Shape } from '../ga/genome';

/** Gera N posições (xyz intercalado) para uma forma, em um raio ~1. */
export function generateShape(shape: Shape, n: number, seed = 1): Float32Array {
  const out = new Float32Array(n * 3);
  let s = seed >>> 0 || 1;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    const t = i / Math.max(1, n - 1);

    switch (shape) {
      case 'sphere': {
        // esfera de Fibonacci, com leve espessura de casca
        const yy = 1 - t * 2;
        const r = Math.sqrt(1 - yy * yy) * (0.92 + rnd() * 0.08);
        const th = golden * i;
        x = Math.cos(th) * r;
        y = yy * (0.92 + rnd() * 0.08);
        z = Math.sin(th) * r;
        break;
      }
      case 'helix': {
        // dupla hélice (DNA) com "degraus" entre as fitas
        const strand = i % 3; // 0,1 = fitas; 2 = degrau
        const turns = 3.2;
        const ang = t * Math.PI * 2 * turns;
        const h = (t - 0.5) * 2.4;
        if (strand < 2) {
          const a = ang + strand * Math.PI;
          x = Math.cos(a) * 0.55;
          z = Math.sin(a) * 0.55;
          y = h;
        } else {
          const k = rnd();
          x = Math.cos(ang) * 0.55 * (2 * k - 1);
          z = Math.sin(ang) * 0.55 * (2 * k - 1);
          y = h;
        }
        x += (rnd() - 0.5) * 0.04;
        z += (rnd() - 0.5) * 0.04;
        break;
      }
      case 'torus': {
        const R = 0.75;
        const r = 0.32;
        const u = golden * i;
        const v = t * Math.PI * 2 * 37.3;
        const rr = r * (0.85 + rnd() * 0.15);
        x = (R + rr * Math.cos(v)) * Math.cos(u);
        z = (R + rr * Math.cos(v)) * Math.sin(u);
        y = rr * Math.sin(v);
        // inclina o anel para não ficar "chapado"
        const tilt = 0.55;
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
        y = y2;
        z = z2;
        break;
      }
      case 'galaxy': {
        const arms = 3;
        const arm = i % arms;
        const rad = Math.pow(rnd(), 0.6) * 1.3;
        const ang = rad * 3.0 + (arm / arms) * Math.PI * 2 + (rnd() - 0.5) * 0.4;
        x = Math.cos(ang) * rad;
        z = Math.sin(ang) * rad;
        y = (rnd() - 0.5) * 0.22 * (1.4 - rad);
        // inclina o disco para a câmera ver a espiral
        const tilt = 0.9;
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
        y = y2;
        z = z2;
        break;
      }
      case 'lattice': {
        const side = Math.ceil(Math.cbrt(n));
        const ix = i % side;
        const iy = Math.floor(i / side) % side;
        const iz = Math.floor(i / (side * side));
        const k = 1.7 / (side - 1);
        x = ix * k - 0.85;
        y = iy * k - 0.85;
        z = iz * k - 0.85;
        // esvazia o centro para ler como estrutura
        const d = Math.hypot(x, y, z);
        if (d < 0.45) {
          const m = 0.45 / Math.max(d, 1e-3);
          x *= m;
          y *= m;
          z *= m;
        }
        break;
      }
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return shuffled(out, n);
}

/**
 * Embaralha os pontos com uma permutação FIXA (independente da forma), para que
 * qualquer prefixo (drawRange) seja uma amostra uniforme da forma inteira —
 * sem isso, 9.000 de 16.000 pontos de uma esfera de Fibonacci viram uma cúpula.
 */
function shuffled(src: Float32Array, n: number): Float32Array {
  const perm = permutation(n);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const j = perm[i];
    out[i * 3] = src[j * 3];
    out[i * 3 + 1] = src[j * 3 + 1];
    out[i * 3 + 2] = src[j * 3 + 2];
  }
  return out;
}

const permCache = new Map<number, Uint32Array>();
function permutation(n: number): Uint32Array {
  const cached = permCache.get(n);
  if (cached) return cached;
  const p = new Uint32Array(n);
  for (let i = 0; i < n; i++) p[i] = i;
  let s = 0x9e3779b9;
  for (let i = n - 1; i > 0; i--) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const j = (s >>> 0) % (i + 1);
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  permCache.set(n, p);
  return p;
}
