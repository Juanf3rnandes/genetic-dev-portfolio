import { defineConfig } from "vite";

// Isolamento cross-origin: o emulador do arcade (mGBA/WebAssembly) usa threads.
// Em produção (GitHub Pages) quem adiciona estes headers é public/coi-sw.js.
const isolation = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

// base './' para funcionar no GitHub Pages em qualquer subcaminho
export default defineConfig({
  base: "./",
  // navegadores suportados: Chrome/Edge 100+, Firefox 100+, Safari 15+
  build: {
    target: ["es2020", "chrome100", "edge100", "firefox100", "safari15"],
    sourcemap: false,
  },
  server: { headers: isolation },
  preview: { headers: isolation },
  plugins: [],
});
