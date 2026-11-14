---
title: "Medir antes de otimizar: deixando este site leve"
date: 2026-11-13
summary: Números de antes e depois, o gargalo que não era onde eu achava, uma otimização que piorou as coisas e os bugs que só apareceram testando em outros navegadores.
---

## Ponto de partida

Depois de juntar estética cyberpunk, genes estruturais, organismo 3D e um emulador de Game Boy Advance, o site ficou pesado. A tentação é sair mexendo em tudo. Preferi o caminho chato: medir primeiro, mudar uma coisa, medir de novo.

## 1. O que o navegador baixa antes de mostrar texto

O Three.js estava no bundle principal: **144 kB gzip** de JavaScript antes de qualquer texto aparecer. Movi o organismo 3D para um `import()` dinâmico e ele passou a carregar depois da página. O JavaScript inicial caiu para **12 kB gzip**.

Depois vieram tradução PT/EN, estudos de caso e currículo, e o JavaScript inicial está hoje em torno de 35 kB gzip. Continua bem abaixo do ponto de partida, mas é bom registrar que o número anda: otimização não é um evento, é algo que se acompanha.

## 2. O DOM sendo reescrito à toa

Um `setInterval` de 2 segundos atualizava o fitness ao vivo, e eu tinha reaproveitado a função que redesenha *tudo*: painel de genes, população, gráfico. Contei com um `MutationObserver`: **425 mutações de DOM a cada 4 segundos**. Separei uma função que só troca o texto do HUD, e só quando ele muda: **4 mutações**.

## 3. O gargalo do 3D não era o número de draw calls

As dicas de performance de Three.js costumam falar de draw calls, LOD, texturas e luzes. Medi com `renderer.info`: **2 draw calls, 0 triângulos, 0 texturas, 0 luzes**. Nada disso se aplicava.

O custo real estava no brilho. Ele redesenhava todas as partículas com pontos 4,5× maiores e mistura aditiva: cerca de **4,7 milhões de pixels pintados por frame** na variante medida, e o mesmo ruído simplex calculado duas vezes por vértice.

A solução foi desenhar o brilho com **1 de cada 4 partículas**, com pontos um pouco maiores e intensidade compensada. Visualmente quase igual:

- pixels do brilho por frame: 4,7 M → **1,8 M** (−61%)
- cálculos de ruído por frame: 73.506 → **45.942** (−37%)

Junto disso, cada passo de mutação reenviava **375 KB** de posições para a GPU mesmo quando a forma não mudava. Agora só reenvia se o gene `shape` mudar.

## 4. A otimização que piorou

Para a animação do download do currículo, importei o Three.js com `import('three')`. Funcionou, mas o chunk do Three foi de **130 kB para 188 kB gzip**. Um import dinâmico do módulo inteiro impede o *tree-shaking*: o bundler não tem como saber quais classes vão ser usadas.

A correção foi um arquivo que reexporta só as 18 classes usadas e importar esse arquivo dinamicamente. O chunk voltou para 130 kB. Sem medir o build, isso teria passado.

## 5. Uma otimização com efeito colateral

`content-visibility: auto` faz o navegador pular o layout de seções fora da tela. Ótimo para desempenho, mas ele usa uma altura *estimada* para essas seções, e os links do menu passaram a parar no lugar errado. O ganho era pequeno, porque as animações já pausavam fora da tela. Troquei desempenho marginal por navegação correta.

## 6. "Funciona na minha máquina"

Montei testes com Playwright em Chromium, Firefox e WebKit, no desktop e no celular, rodando contra o build de produção. Como cada visita sorteia um genoma diferente, rodei a matriz várias vezes.

Os testes acharam um bug que eu não tinha visto: quando o algoritmo sorteava o menu tipo *dock* no celular, o recorte dos cantos (`clip-path`) cortava o painel de links e ninguém conseguia navegar. Também mostraram que uma das minhas checagens estava errada, e não o site. Teste também precisa ser revisado.

## O que fica

- Medir antes. O gargalo raramente está onde a intuição aponta.
- Medir depois. Uma mudança pode piorar outra coisa (o tree-shaking) ou quebrar algo que não é desempenho (os links).
- Registrar os números. Eles mudam conforme o projeto cresce.
