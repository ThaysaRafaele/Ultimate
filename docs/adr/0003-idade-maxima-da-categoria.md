# 0003. Idade máxima da categoria em anos completos, verificada no cadastro

- Status: aceita (data de referência ⚠ em aberto: P-04, P-05)
- Data: 2026-10-05
- Fontes: `lib/validation.ts` (`ageInYears`, `ageLimitError`), `PUT /api/teams/[id]`

## Contexto
Categorias de base têm limite de idade. É preciso dizer como se conta a idade e quando a
regra é checada.

## Decisão
Idade = anos completos (só conta o aniversário que já passou). O limite é checado ao
cadastrar/editar o atleta, com a data de hoje como referência. A data de nascimento é
obrigatória para vincular a uma categoria com limite. Idade mínima de qualquer atleta: 10 anos.

## Consequências
Um atleta pode ultrapassar o limite no meio da temporada e passar a ter a edição recusada.
Alterar o limite da categoria não revalida atletas já vinculados.
