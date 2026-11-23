import { defineConfig } from "vite";

// base './' para funcionar no GitHub Pages em qualquer subcaminho
export default defineConfig({
  base: "./",
  // navegadores suportados: Chrome/Edge 100+, Firefox 100+, Safari 15+
  build: {
    target: ["es2020", "chrome100", "edge100", "firefox100", "safari15"],
    sourcemap: false,
  },
  plugins: [],
});
