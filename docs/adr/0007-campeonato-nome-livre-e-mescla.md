# 0007. Campeonato por nome, com reaproveitamento e mescla de duplicados

- Status: aceita
- Data: 2026-10-05
- Fontes: `lib/championships-repo.ts`, `POST /api/championships/[id]/merge`

## Contexto
O técnico digita o campeonato ao cadastrar o jogo, e variações de grafia geravam duplicatas.

## Decisão
Ao salvar um jogo, o sistema reaproveita o campeonato de nome igual (sem diferenciar
maiúsculas); senão, cria um novo com id slug. O id nunca muda; o nome pode ser renomeado.
Duplicados são mesclados: os jogos passam para o destino e a origem é apagada.

## Consequências
Acentuação diferente ainda gera duplicata (resolvida por mescla manual). Não há exclusão
direta de campeonato.
