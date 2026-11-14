/**
 * Converte a saída de vídeo do emulador (240×160) em arte ASCII desenhada num canvas.
 *
 * A tela é reduzida para `cols × rows` amostras (o próprio drawImage faz a média
 * dos pixels) e cada amostra vira um caractere escolhido pela luminância.
 */

export type AsciiStyle = 'neon' | 'color' | 'phosphor';

// do mais escuro para o mais claro
const RAMP = ' .,:;-~=+*oxX%#@';
const CW = 6; // largura de uma célula (px CSS) — JetBrains Mono ≈ 0.6 × altura
const CH = 10; // altura de uma célula
const SRC_W = 240;
const SRC_H = 160;
const PHOSPHOR = '#3dff7a';

export class AsciiRenderer {
  cols = 120;
  rows = 48;
  style: AsciiStyle = 'neon';
  accent = '#7cf5c4';
  bg = '#05060a';

  private ctx: CanvasRenderingContext2D;
  private sample = document.createElement('canvas');
  private sctx: CanvasRenderingContext2D;

  constructor(private out: HTMLCanvasElement) {
    this.ctx = out.getContext('2d')!;
    this.sctx = this.sample.getContext('2d', { willReadFrequently: true })!;
    this.setCols(this.cols);
  }

  setCols(cols: number): void {
    this.cols = cols;
    // mantém a proporção 3:2 do GBA considerando que a célula é mais alta que larga
    this.rows = Math.round(cols * (SRC_H / SRC_W) * (CW / CH));
    this.sample.width = this.cols;
    this.sample.height = this.rows;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.out.width = Math.round(this.cols * CW * dpr);
    this.out.height = Math.round(this.rows * CH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private prepare(): void {
    const c = this.ctx;
    c.shadowBlur = 0;
    c.fillStyle = this.bg;
    c.fillRect(0, 0, this.cols * CW, this.rows * CH);
    c.font = `${CH}px "JetBrains Mono", ui-monospace, monospace`;
    c.textBaseline = 'top';
  }

  /** Desenha um frame a partir do canvas do emulador. */
  draw(src: CanvasImageSource): void {
    const { cols, rows } = this;
    const s = this.sctx;
    s.imageSmoothingEnabled = true;
    s.imageSmoothingQuality = 'medium';
    s.drawImage(src, 0, 0, cols, rows);
    const px = s.getImageData(0, 0, cols, rows).data;
    this.prepare();
    const c = this.ctx;
    const last = RAMP.length - 1;

    if (this.style === 'color') {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const r = px[i];
          const g = px[i + 1];
          const b = px[i + 2];
          const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const ch = RAMP[Math.min(last, Math.round(l * last))];
          if (ch === ' ') continue;
          // realça a cor: caracteres finos com cor apagada somem no fundo escuro
          const k = 1.25;
          c.fillStyle = `rgb(${Math.min(255, r * k) | 0} ${Math.min(255, g * k) | 0} ${Math.min(255, b * k) | 0})`;
          c.fillText(ch, x * CW, y * CH);
        }
      }
      return;
    }

    // monocromático: uma string por linha (bem mais barato que um fillText por célula)
    c.fillStyle = this.style === 'phosphor' ? PHOSPHOR : this.accent;
    c.shadowColor = c.fillStyle;
    c.shadowBlur = this.style === 'phosphor' ? 6 : 4;
    for (let y = 0; y < rows; y++) {
      let line = '';
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
        line += RAMP[Math.min(last, Math.round(l * last))];
      }
      c.fillText(line, 0, y * CH);
    }
  }

  /** Tela de espera: chiado de TV com uma mensagem no meio. */
  idle(message: string, t: number): void {
    this.prepare();
    const c = this.ctx;
    const { cols, rows } = this;
    c.fillStyle = this.style === 'phosphor' ? PHOSPHOR : this.accent;
    c.globalAlpha = 0.35;
    for (let y = 0; y < rows; y++) {
      let line = '';
      for (let x = 0; x < cols; x++) {
        const n = Math.random();
        line += n > 0.93 ? RAMP[1 + ((n * 97 + t) % 5 | 0)] : ' ';
      }
      c.fillText(line, 0, y * CH);
    }
    c.globalAlpha = 1;
    const lines = message.split('\n');
    const top = Math.floor(rows / 2 - lines.length / 2);
    lines.forEach((ln, i) => {
      const padded = `  ${ln}  `;
      const x = Math.max(0, Math.floor((cols - padded.length) / 2));
      c.fillStyle = this.bg;
      c.fillRect(x * CW, (top + i) * CH, padded.length * CW, CH);
      c.fillStyle = this.style === 'phosphor' ? PHOSPHOR : this.accent;
      c.fillText(padded, x * CW, (top + i) * CH);
    });
  }
}
