# 0008. Regras dos dados históricos importados (2018 e 2019)

- Status: aceita (exibição ⚠ em aberto: P-17, P-18)
- Data: 2026-10-05
- Fontes: cabeçalhos de `scripts/import-games-2018.mjs` e `scripts/import-games-2019.mjs`, `docs/*.json`

## Contexto
Jogos, boletins e escalações antigos vieram da planilha do técnico, com lacunas.

## Decisão
- Importação idempotente: jogo identificado por (categoria, campeonato, adversário, data).
- Rebote sem separação ofensivo/defensivo é gravado como defensivo (ofensivo = 0).
- Horário ausente vira 19:00; datas de 2019 sem registro são estimadas.
- Nomes ambíguos só entram quando confirmados com o técnico (decisões de 2026-08-23 no
  cabeçalho do script de 2019); o resto fica de fora.
- Os 3 jogos de `games_extra` (2019) não são importados.

## Consequências
Estatísticas por ano e recordes pessoais tratam esses dados como exatos.
