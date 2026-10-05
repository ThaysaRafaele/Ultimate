# 0004. Jogo tem dois status; boletim só em jogo realizado

- Status: aceita (transições de volta ⚠ em aberto: P-07, P-08)
- Data: 2026-10-05
- Fontes: `lib/games-validation.ts` (`GAME_STATUSES`), `PUT /api/games/[id]/stats`, `components/StatsModal.tsx`

## Contexto
Jogos são cadastrados antes de acontecer e completados depois.

## Decisão
Status `agendado` (padrão) ou `realizado`. Marcar realizado exige placar final (inteiros
≥ 0 dos dois lados). Estatísticas e boletim só podem ser lançados com status `realizado`.
A escalação pode ser definida em qualquer status.

## Consequências
Ver `docs/dominio/estados-jogo.mmd`. Hoje a API aceita voltar de realizado para agendado
e trocar a categoria do jogo sem checar dependentes (P-07 e P-08).
