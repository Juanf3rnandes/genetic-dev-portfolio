---
title: "Measure before optimizing: making this site light"
date: 2026-11-13
summary: Before-and-after numbers, the bottleneck that wasn't where I expected, an optimization that made things worse, and the bugs that only showed up in other browsers.
---

## Starting point

After adding a cyberpunk look, structural genes, a 3D organism and a Game Boy Advance emulator, the site got heavy. The temptation is to start tweaking everything. I took the boring path: measure first, change one thing, measure again.

## 1. What the browser downloads before showing text

Three.js was in the main bundle: **144 kB gzip** of JavaScript before any text appeared. I moved the 3D organism behind a dynamic `import()` and it started loading after the page. Initial JavaScript dropped to **12 kB gzip**.

Then came PT/EN translation, case studies and the CV, and initial JavaScript is now around 35 kB gzip. Still far below the starting point, but it's worth noting that the number moves: optimization isn't an event, it's something you keep tracking.

## 2. The DOM being rewritten for nothing

A 2-second `setInterval` updated the live fitness, and I had reused the function that redraws *everything*: gene panel, population, chart. I counted with a `MutationObserver`: **425 DOM mutations every 4 seconds**. I split out a function that only swaps the HUD text, and only when it changes: **4 mutations**.

## 3. The 3D bottleneck wasn't draw calls

Three.js performance tips usually talk about draw calls, LOD, textures and lights. I measured with `renderer.info`: **2 draw calls, 0 triangles, 0 textures, 0 lights**. None of that applied.

The real cost was the glow. It redrew every particle with 4.5× larger points and additive blending: about **4.7 million pixels painted per frame** in the measured variant, and the same simplex noise computed twice per vertex.

The fix was drawing the glow with **1 in every 4 particles**, with slightly larger points and compensated intensity. Visually almost identical:

- glow pixels per frame: 4.7 M → **1.8 M** (−61%)
- noise evaluations per frame: 73,506 → **45,942** (−37%)

On top of that, each mutation step re-uploaded **375 KB** of positions to the GPU even when the shape didn't change. Now it only uploads if the `shape` gene changes.

## 4. The optimization that made it worse

For the CV download animation I imported Three.js with `import('three')`. It worked, but the Three chunk went from **130 kB to 188 kB gzip**. A dynamic import of the whole module defeats tree-shaking: the bundler can't know which classes will be used.

The fix was a file that re-exports only the 18 classes in use, imported dynamically. The chunk went back to 130 kB. Without measuring the build, this would have slipped through.

## 5. An optimization with a side effect

`content-visibility: auto` lets the browser skip layout for off-screen sections. Great for performance, but it uses an *estimated* height for those sections, and the menu links started landing in the wrong place. The gain was small, since animations already paused off screen. I traded marginal performance for correct navigation.

## 6. "Works on my machine"

I set up Playwright tests on Chromium, Firefox and WebKit, desktop and mobile, against the production build. Since each visit draws a different genome, I ran the matrix several times.

The tests found a bug I hadn't seen: when the algorithm picked the *dock* menu on mobile, the corner clipping (`clip-path`) cut off the link panel and nobody could navigate. They also showed that one of my own checks was wrong, not the site. Tests need reviewing too.

## What stays

- Measure first. The bottleneck is rarely where intuition points.
- Measure after. A change can make something else worse (tree-shaking) or break something that isn't performance at all (the links).
- Write the numbers down. They change as the project grows.
