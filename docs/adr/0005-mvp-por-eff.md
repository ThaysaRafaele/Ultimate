# 0005. MVP sugerido pela maior EFF, escolhido pelo técnico

- Status: proposta (⚠ confirmar: P-10)
- Data: 2026-10-05
- Fontes: `components/StatsModal.tsx`, `PUT /api/games/[id]/stats`, protótipo ("Cestinha / MVP")

## Contexto
O protótipo trata MVP como o cestinha (maior pontuação). O código sugere o atleta de maior
EFF e deixa o técnico trocar.

## Decisão
Código vence: sugestão pela maior EFF. O MVP gravado precisa estar entre os atletas com
estatísticas lançadas no jogo.

## Consequências
"Melhor jogo" no perfil também usa EFF, então o critério é o mesmo nas duas telas.
"Cestinha" vira um conceito separado (maior pontuação), útil na Visão geral.
