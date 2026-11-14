---
title: How I turned my portfolio into a genetic algorithm
date: 2026-11-13
summary: Content is fixed; presentation is the genome. How the evolution works, what went wrong along the way, and why the idea became "stable first, drift later".
---

## The problem

A portfolio is usually a static page nobody remembers. I wanted something that showed how I think, not just a list of projects. The question became: what if the site itself were an experiment, testing variations of itself and keeping the ones that work best?

The rule behind everything: **content never changes**. Text, projects and contact info are fixed. Only the presentation is the "phenotype": colors, 3D shape, typography, component layout.

## The genome

Each variant of the site is a genome of 42 genes:

- 20 visual genes: hue, saturation, particle count, noise, glow, type scale…
- 22 structural genes: menu type, project layout, card skin, button style, animation frame, generated margin elements…

Numeric genes have a minimum and maximum; categorical genes have a list of options. The genome becomes CSS in two ways: custom properties (`--accent`, `--radius`, `--space`) and `data-ph-*` attributes on `<html>`. Each value of a categorical gene is just a CSS block. There is no ready-made "theme": the final layout is the combination.

## Fitness without tracking anyone

The site asks nothing. It watches session engagement and turns it into a number between 0 and 1:

- active time on page (25%, log scale, saturating at 90 s)
- scroll depth (20%)
- clicks on projects (15%) and on contact (10%)
- interaction with the 3D organism (10%)
- explicit vote: +0.30 for "like", −0.30 for "another variant"

Only that aggregate number enters the population. Nothing is sent to third parties; the default storage is `localStorage`.

## The evolution

The population has 8 individuals. Each visit gets one of them, favoring the least evaluated. Once all have been evaluated, a generation is born:

1. **Elitism**: the top 2 carry over untouched.
2. **Tournament selection** (k = 3) picks the parents.
3. **Uniform crossover**: the child inherits each gene from one of the parents.
4. **Gaussian mutation**: each gene has an 8% chance of noise.

The function that does this, `evolve()`, is pure: it takes the state and returns the next one. That makes it possible to run `npm run simulate` in the terminal, with synthetic visitors that have a fixed preference, and watch fitness climb generation after generation. It's the proof that the loop converges before any real visitor shows up.

## What went wrong along the way

**Changing the site while people read it.** The first version opened in chaos (100% mutation) and "formed" itself as the visitor interacted. It looked nice, but the first impression was a broken site. I inverted it: the site opens stable and mutation slowly rises with use, with a button to restore.

**Content jumping under your eyes.** Swapping the project layout while you're looking at the projects is awful. The fix was freezing by region: a section's layout gene only changes while that section is off screen. Section order, menu, font and spacing never change during a visit.

**Unreadable combinations.** With 42 genes, some combinations were ugly or hard to read, such as an outlined title over glowing particles. Some genes got limits: the outlined title, for example, no longer applies to the name at the top.

## What I'd take to another project

- Separate what may vary from what may not, and write it down as a rule before writing code.
- A pure function at the core makes it easy to test the idea without any UI.
- "It works" visually isn't enough. You have to look at the experience of the person using it, and sometimes that means inverting the original idea.
