/**
 * Arcade: um Game Boy Advance (core mGBA em WebAssembly) com a tela convertida em ASCII.
 *
 * Nenhuma ROM acompanha o site. O visitante carrega um .gba do próprio
 * computador; o arquivo vai direto para o sistema de arquivos do emulador
 * (IndexedDB do navegador) e nunca é enviado para lugar nenhum.
 */

import { AsciiRenderer, type AsciiStyle } from './ascii';
import { t } from '../i18n';

type StatusKey = Parameters<typeof t>[0];

interface MgbaModule {
  FSInit(): Promise<void>;
  FSSync(): void;
  uploadRom(file: File, callback?: () => void): void;
  loadGame(romPath: string): boolean;
  buttonPress(name: string): void;
  buttonUnpress(name: string): void;
  pauseGame(): void;
  resumeGame(): void;
  setVolume(percent: number): void;
  saveState(slot: number): boolean;
  loadState(slot: number): boolean;
  addCoreCallbacks(cb: { saveDataUpdatedCallback?: () => void }): void;
  filePaths(): { gamePath: string };
  SDL2?: { audioContext?: AudioContext };
}
type MgbaFactory = (opts: { canvas: HTMLCanvasElement }) => Promise<MgbaModule>;

const KEYMAP: Record<string, string> = {
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  KeyX: 'A',
  KeyZ: 'B',
  Enter: 'Start',
  Backspace: 'Select',
  KeyA: 'L',
  KeyS: 'R',
};
const RELOAD_FLAG = 'gdp:arcade-isolation';

export class Arcade {
  private renderer: AsciiRenderer;
  private emuCanvas: HTMLCanvasElement;
  private screen: HTMLElement;
  private statusEl: HTMLElement;
  private fpsLabel: HTMLElement;
  private fileInput: HTMLInputElement;
  private mod: MgbaModule | null = null;
  private booting: Promise<MgbaModule> | null = null;
  private running = false;
  private userPaused = false;
  private visible = false;
  private muted = false;
  private userStyle = false;
  private pressed = new Set<string>();
  private frames = 0;
  private lastFpsAt = performance.now();
  private tick = 0;
  private status: { key: StatusKey; vars?: Record<string, string> } = { key: 'arcade.st.off' };

  constructor(private root: HTMLElement) {
    const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    this.screen = q('[data-arcade-screen]');
    this.statusEl = q('[data-arcade-status]');
    this.fpsLabel = q('[data-arcade-fps]');
    this.fileInput = q<HTMLInputElement>('[data-arcade-file]');
    this.emuCanvas = q<HTMLCanvasElement>('[data-arcade-emu]');
    this.renderer = new AsciiRenderer(q<HTMLCanvasElement>('[data-arcade-ascii]'));

    // o leitor ASCII precisa ler o canvas WebGL depois do frame ser composto
    const orig = this.emuCanvas.getContext.bind(this.emuCanvas) as (t: string, a?: object) => RenderingContext | null;
    (this.emuCanvas as unknown as { getContext: typeof orig }).getContext = (type, attrs) =>
      orig(type, { ...(attrs ?? {}), preserveDrawingBuffer: true });

    this.bindUi();
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.syncPause();
    }).observe(this.screen);
    document.addEventListener('visibilitychange', () => this.syncPause());

    if (sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.removeItem(RELOAD_FLAG);
      this.setStatus(crossOriginIsolated ? 'arcade.st.isolated' : 'arcade.st.noIsolation');
    }
    requestAnimationFrame(this.loop);
  }

  /** Paleta padrão escolhida pelo genoma (gene asciiStyle) — até o visitante escolher outra. */
  applyGenome(style: AsciiStyle, accent: string, bg: string): void {
    this.renderer.accent = accent || this.renderer.accent;
    this.renderer.bg = bg || this.renderer.bg;
    if (!this.userStyle) this.setStyle(style);
  }

  private setStyle(style: AsciiStyle): void {
    this.renderer.style = style;
    this.root.querySelectorAll<HTMLElement>('[data-arcade-style]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.arcadeStyle === style));
    });
  }

  private setStatus(key: StatusKey, vars?: Record<string, string>): void {
    this.status = { key, vars };
    this.statusEl.textContent = t(key, vars);
  }

  /** Reaplica o status no idioma atual. */
  refreshText(): void {
    this.statusEl.textContent = t(this.status.key, this.status.vars);
  }

  private bindUi(): void {
    const r = this.root;
    r.querySelector('[data-arcade-load]')!.addEventListener('click', () => void this.requestRom());
    this.fileInput.addEventListener('change', () => {
      const f = this.fileInput.files?.[0];
      if (f) void this.start(f);
      this.fileInput.value = '';
    });

    // arrastar e soltar a ROM na tela
    this.screen.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.screen.classList.add('drag');
    });
    this.screen.addEventListener('dragleave', () => this.screen.classList.remove('drag'));
    this.screen.addEventListener('drop', (e) => {
      e.preventDefault();
      this.screen.classList.remove('drag');
      const f = e.dataTransfer?.files?.[0];
      if (f) void this.requestRom(f);
    });

    r.querySelectorAll<HTMLElement>('[data-arcade-style]').forEach((b) =>
      b.addEventListener('click', () => {
        this.userStyle = true;
        this.setStyle(b.dataset.arcadeStyle as AsciiStyle);
      }),
    );
    r.querySelectorAll<HTMLElement>('[data-arcade-cols]').forEach((b) =>
      b.addEventListener('click', () => {
        this.renderer.setCols(Number(b.dataset.arcadeCols));
        r.querySelectorAll<HTMLElement>('[data-arcade-cols]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      }),
    );
    r.querySelector('[data-arcade-raw]')!.addEventListener('click', (e) => {
      const on = this.screen.classList.toggle('raw');
      (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(on));
    });
    r.querySelector('[data-arcade-pause]')!.addEventListener('click', (e) => {
      if (!this.running) return;
      this.userPaused = !this.userPaused;
      (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(this.userPaused));
      this.syncPause();
    });
    r.querySelector('[data-arcade-mute]')!.addEventListener('click', (e) => {
      this.muted = !this.muted;
      (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(this.muted));
      this.mod?.setVolume(this.muted ? 0 : 100);
    });
    r.querySelector('[data-arcade-save]')!.addEventListener('click', () => {
      if (!this.mod || !this.running) return;
      this.setStatus(this.mod.saveState(0) ? 'arcade.st.saved' : 'arcade.st.saveFailed');
      this.mod.FSSync();
    });
    r.querySelector('[data-arcade-restore]')!.addEventListener('click', () => {
      if (!this.mod || !this.running) return;
      this.setStatus(this.mod.loadState(0) ? 'arcade.st.loaded' : 'arcade.st.noState');
    });

    // controle na tela (touch / mouse)
    r.querySelectorAll<HTMLElement>('[data-btn]').forEach((b) => {
      const name = b.dataset.btn!;
      const down = (e: Event) => {
        e.preventDefault();
        this.press(name);
      };
      const up = () => this.release(name);
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
    });

    this.screen.addEventListener('blur', () => this.releaseAll());
  }

  private press(name: string): void {
    if (!this.mod || this.pressed.has(name)) return;
    this.pressed.add(name);
    this.mod.buttonPress(name);
  }
  private release(name: string): void {
    if (!this.mod || !this.pressed.delete(name)) return;
    this.mod.buttonUnpress(name);
  }
  private releaseAll(): void {
    for (const n of [...this.pressed]) this.release(n);
  }

  /**
   * Teclado: só vale com a tela do arcade em foco. O core registra listeners
   * próprios na janela; este listener de captura chega antes e impede que o
   * emulador "sequestre" as setas e o Backspace do resto da página.
   */
  private installKeyGuard(): void {
    const onKey = (e: KeyboardEvent) => {
      const focused = document.activeElement === this.screen;
      const btn = KEYMAP[e.code];
      if (focused && btn) {
        e.preventDefault();
        if (e.type === 'keydown') this.press(btn);
        else this.release(btn);
      }
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);
  }

  /** Garante isolamento cross-origin (necessário para as threads do core) e abre o seletor. */
  private async requestRom(dropped?: File): Promise<void> {
    if (!crossOriginIsolated) {
      if (!('serviceWorker' in navigator) || !isSecureContext) {
        this.setStatus('arcade.st.unsupported');
        return;
      }
      this.setStatus('arcade.st.enabling');
      await navigator.serviceWorker.register(new URL('coi-sw.js', document.baseURI));
      await navigator.serviceWorker.ready;
      sessionStorage.setItem(RELOAD_FLAG, '1');
      location.hash = 'arcade';
      location.reload();
      return;
    }
    if (dropped) void this.start(dropped);
    else this.fileInput.click();
  }

  private boot(): Promise<MgbaModule> {
    this.booting ??= (async () => {
      this.setStatus('arcade.st.booting');
      this.installKeyGuard();
      const url = new URL('mgba/mgba.js', document.baseURI).href;
      const { default: mGBA } = (await import(/* @vite-ignore */ url)) as { default: MgbaFactory };
      const mod = await mGBA({ canvas: this.emuCanvas });
      await mod.FSInit();
      // saves do próprio jogo (bateria) persistem no IndexedDB
      mod.addCoreCallbacks({ saveDataUpdatedCallback: () => mod.FSSync() });
      this.mod = mod;
      return mod;
    })();
    return this.booting;
  }

  private async start(file: File): Promise<void> {
    if (!/\.(gba|gbc|gb)$/i.test(file.name)) {
      this.setStatus('arcade.st.badFormat');
      return;
    }
    try {
      const mod = await this.boot();
      this.setStatus('arcade.st.loading', { f: file.name });
      await new Promise<void>((resolve) => mod.uploadRom(file, resolve));
      const path = `${mod.filePaths().gamePath}/${file.name}`.replace(/\/+/g, '/');
      if (!mod.loadGame(path)) {
        this.setStatus('arcade.st.refused');
        return;
      }
      await mod.SDL2?.audioContext?.resume().catch(() => undefined);
      mod.setVolume(this.muted ? 0 : 100);
      this.running = true;
      this.userPaused = false;
      this.screen.classList.add('on');
      this.screen.focus({ preventScroll: true });
      this.setStatus('arcade.st.running', { f: file.name });
    } catch (err) {
      console.error(err);
      this.setStatus('arcade.st.failed');
    }
  }

  private syncPause(): void {
    if (!this.mod || !this.running) return;
    const shouldRun = this.visible && !document.hidden && !this.userPaused;
    if (shouldRun) this.mod.resumeGame();
    else this.mod.pauseGame();
  }

  private loop = (now: number): void => {
    requestAnimationFrame(this.loop);
    if (!this.visible || document.hidden) return;
    // ~30 fps de ASCII jogando; a tela de espera (chiado) roda a ~10 fps
    this.tick++;
    if (this.tick % (this.running ? 2 : 6)) return;
    if (this.running && !this.userPaused) {
      this.renderer.draw(this.emuCanvas);
      this.frames++;
      if (now - this.lastFpsAt > 1000) {
        this.fpsLabel.textContent = t('arcade.fps', { c: this.renderer.cols, r: this.renderer.rows, f: this.frames });
        this.frames = 0;
        this.lastFpsAt = now;
      }
    } else if (!this.running) {
      this.renderer.idle(t('arcade.idle'), now / 120);
    }
  };
}
