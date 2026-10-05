# 0010. Aviso de recorde pessoal recalculado ao salvar o boletim

- Status: aceita
- Data: 2026-10-05
- Fontes: `lib/notifications-repo.ts` (`checkAndRecordPersonalRecords`)

## Contexto
O técnico quer saber quando um atleta bate a própria marca.

## Decisão
Ao salvar as estatísticas de um jogo, para cada atleta e para pontos, rebotes,
assistências, roubos e EFF: gera aviso se o valor é maior que zero e maior que o melhor do
atleta em **todos os outros** jogos. Os avisos do atleta naquele jogo são apagados e
recriados, então reeditar não duplica. O primeiro jogo do atleta não gera aviso.

## Consequências
O recorde é comparado contra todos os outros jogos, inclusive os posteriores ao jogo
editado. Importações por script não geraram avisos.
