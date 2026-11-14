// Copia o core mGBA (WebAssembly) para public/mgba/.
// O runtime com threads cria workers a partir da própria URL do mgba.js,
// então ele precisa ser servido como arquivo estático, sem passar pelo bundler.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('@thenick775/mgba-wasm'));
const out = new URL('../public/mgba/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const f of ['mgba.js', 'mgba.wasm']) copyFileSync(join(dist, f), new URL(f, out));
console.log('mgba-wasm copiado para public/mgba/');
