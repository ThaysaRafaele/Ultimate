# 0009. Atleta e categoria são inativados; jogo é excluído em cascata

- Status: aceita
- Data: 2026-10-05
- Fontes: `PATCH /api/athletes/[id]`, `PATCH /api/teams/[id]`, `DELETE /api/games/[id]`

## Contexto
Sem FKs no banco, a remoção de registros precisa preservar o histórico manualmente.

## Decisão
Atleta e categoria nunca são excluídos: ficam inativos (somem da seleção e da escalação,
mas continuam no histórico). Jogo pode ser excluído; a rota apaga junto a escalação, as
estatísticas e os avisos do jogo.

## Consequências
A cascata do jogo depende do código da rota. Atleta inativo não pode ser escalado nem ter
estatísticas lançadas, inclusive em jogo antigo (P-06).
