# genetic-dev-portfolio

Portfólio de desenvolvedor que **evolui sozinho**. Um algoritmo genético testa variações
de cor, forma 3D, tipografia e layout a cada visita e mantém as que os visitantes preferem.
O conteúdo (textos, projetos) é fixo — só a *apresentação* é fenótipo.

**Stack:** Vite · TypeScript · Three.js (shaders customizados, sem dependências extras).

## Como funciona

```
visitante chega ──▶ indivíduo sorteado (torneio entre os menos avaliados)
       │                      │
       │              renderiza genoma: CSS vars + organismo de partículas
       ▼                      │
  fitness medido ◀────────────┘
  (tempo ativo, scroll, cliques, interação com o hero, voto explícito)
       │
       ▼  quando todos os 8 indivíduos foram avaliados
  nova geração = elitismo(2) + torneio(k=3) + crossover uniforme + mutação gaussiana(8%)
```

| Arquivo | O que faz |
| --- | --- |
| `src/ga/genome.ts` | 42 genes: visuais (hue, forma, partículas, ruído, bloom, type scale…) e estruturais (nav, efeito de título, layout dos projetos, pele dos cards, passos, stack, fundo, ordem das seções, separadores), `randomGenome`, `crossover`, `mutate`, `normalizeGenome` |
| `src/ga/engine.ts` | população, seleção, `evolve()` (função pura), escolha do indivíduo por visita |
| `src/ga/fitness.ts` | transforma engajamento em um número 0–1 |
| `src/ga/store.ts` | persistência: `localStorage` por padrão, endpoint HTTP opcional |
| `src/scene/organism.ts` | nuvem de partículas Three.js: morph entre formas, simplex noise no vertex shader, reação ao cursor, glow em 2 camadas |
| `src/scene/shapes.ts` | geradores: esfera, dupla hélice, toro, galáxia, lattice |
| `src/ui/phenotype.ts` | genoma → CSS custom properties + atributos `data-ph-*` no `<html>` + ordem das seções |
| `src/genes.css` | as variantes estruturais de cada componente (uma por valor de gene) |
| `src/cyberpunk.css` | camada visual cyberpunk por cima de `styles.css` |
| `src/ui/effects.ts` | efeitos de título que precisam de JS (scramble) |
| `src/ui/render.ts` | HUD, painel do genoma, laboratório (população + histórico) |
| `scripts/simulate.ts` | simulação headless: prova que o fitness converge |

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run simulate   # evolução com visitantes sintéticos, no terminal
npm run cv         # regera o currículo em PDF (public/cv/, PT e EN)
```

Edite o conteúdo em `src/content.ts`.

## Evolução compartilhada (opcional)

Sem configuração, cada navegador evolui a própria linhagem (localStorage).
Para que **todos os visitantes** alimentem a mesma população, suba o worker em
`server/worker.js` (Cloudflare Workers + KV, plano gratuito) e aponte o build para ele:

```bash
VITE_GA_ENDPOINT=https://seu-worker.workers.dev/state npm run build
```

No GitHub Pages, defina a variável `VITE_GA_ENDPOINT` em *Settings → Secrets and variables → Actions → Variables*.

## Deploy

O workflow em `.github/workflows/deploy.yml` publica no GitHub Pages a cada push na `main`
(ative Pages com source "GitHub Actions" nas configurações do repositório).

## Debug

No console: `gdp.evo.state` (população e histórico), `gdp.tracker.snapshot()` (fitness ao vivo),
`gdp.organism.applyGenome({...gdp.evo.current.genome, shape: 'helix'})`. O link
"reiniciar linhagem" no rodapé zera a evolução do navegador.
