---
title: Como transformei meu portfólio num algoritmo genético
date: 2026-11-13
summary: O conteúdo é fixo; a apresentação é genoma. Como funciona a evolução, o que deu errado no caminho e por que a ideia virou "estável primeiro, deriva depois".
---

## O problema

Portfólio costuma ser uma página estática que ninguém lembra. Eu queria algo que mostrasse como eu penso, não só uma lista de projetos. A pergunta virou: e se o próprio site fosse um experimento, testando variações de si mesmo e ficando com as que funcionam melhor?

A regra que guiou tudo: **o conteúdo nunca muda**. Texto, projetos e contato são fixos. Só a apresentação é "fenótipo": cores, forma 3D, tipografia, layout dos componentes.

## O genoma

Cada variante do site é um genoma de 42 genes:

- 20 genes visuais: matiz, saturação, número de partículas, ruído, brilho, tamanho da tipografia…
- 22 genes estruturais: tipo de menu, layout dos projetos, pele dos cards, estilo dos botões, moldura das animações, elementos gerados nas margens…

Genes numéricos têm mínimo e máximo; genes categóricos têm uma lista de opções. O genoma vira CSS de duas formas: *custom properties* (`--accent`, `--radius`, `--space`) e atributos `data-ph-*` no `<html>`. Cada valor de gene categórico é só um bloco de CSS. Não existe "tema" pronto: o layout final é a combinação.

## Fitness sem rastrear ninguém

O site não pergunta nada. Ele observa o engajamento da sessão e transforma em um número entre 0 e 1:

- tempo ativo na página (25%, em escala logarítmica, satura em 90 s)
- profundidade de scroll (20%)
- cliques em projetos (15%) e em contato (10%)
- interação com o organismo 3D (10%)
- voto explícito: +0,30 para "gostei", −0,30 para "outra variante"

Só esse número agregado entra na população. Nada é enviado para terceiros; o padrão é guardar no `localStorage`.

## A evolução

A população tem 8 indivíduos. Cada visita recebe um deles, priorizando os menos avaliados. Quando todos foram avaliados, nasce uma geração:

1. **Elitismo**: os 2 melhores passam intactos.
2. **Seleção por torneio** (k = 3) escolhe os pais.
3. **Crossover uniforme**: o filho herda cada gene de um dos pais.
4. **Mutação gaussiana**: cada gene tem 8% de chance de sofrer ruído.

A função que faz isso, `evolve()`, é pura: recebe o estado e devolve o próximo. Isso permite rodar `npm run simulate` no terminal, com visitantes sintéticos que têm uma preferência fixa, e ver o fitness subir geração após geração. É o teste de que o ciclo converge antes de qualquer visitante real aparecer.

## O que deu errado no caminho

**Mudar o site enquanto a pessoa lê.** A primeira versão abria em caos (mutação 100%) e ia se "formando" conforme o visitante interagia. Visualmente era bonito, mas a primeira impressão era um site quebrado. Inverti: o site abre estável e a mutação sobe aos poucos com o uso, com um botão para restaurar.

**Conteúdo pulando debaixo do olho.** Trocar o layout dos projetos enquanto você olha os projetos é péssimo. A solução foi congelar por região: o gene de layout de uma seção só muda quando ela está fora da tela. Ordem das seções, menu, fonte e espaçamento nunca mudam durante a visita.

**Combinações ilegíveis.** Com 42 genes, algumas combinações eram feias ou difíceis de ler, como título em contorno vazado sobre partículas brilhantes. Alguns genes ganharam limites: o contorno vazado, por exemplo, não se aplica mais ao nome no topo.

## O que eu levaria para outro projeto

- Separar o que pode variar do que não pode, e escrever isso como regra antes do código.
- Uma função pura no centro facilita testar a ideia sem interface.
- "Funciona" visualmente não basta. É preciso olhar para a experiência de quem usa, e às vezes isso significa inverter a ideia original.
