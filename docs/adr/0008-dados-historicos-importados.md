# 0008. Regras dos dados históricos importados (2018, 2019 e 2020)

- Status: aceita (exibição ⚠ em aberto: P-17, P-18; placar de 2020 ⚠ em aberto, ver abaixo)
- Data: 2026-10-05 (2020 incluído e importado em 2026-11-16: 17 jogos; Kids e nomes ambíguos
  pendentes em `docs/recados-tecnico.md`)
- Fontes: cabeçalhos de `scripts/import-games-2018.mjs`, `scripts/import-games-2019.mjs` e
  `scripts/import-games-2020.mjs`, `docs/*.json`

## Contexto
Jogos, boletins e escalações antigos vieram da planilha do técnico, com lacunas.

## Decisão
- Importação idempotente: jogo identificado por (categoria, campeonato, adversário, data).
- Rebote sem separação ofensivo/defensivo é gravado como defensivo (ofensivo = 0). Em 2020 os
  rebotes vêm separados em todos os jogos.
- Horário ausente vira 19:00; datas sem registro são estimadas (2019 e 2020; em 2020 só o
  amistoso de 08/02 tem data real).
- Nomes ambíguos só entram quando confirmados com o técnico (decisões de 2026-08-23 no
  cabeçalho do script de 2019); o resto fica de fora. Uma confirmação vale para o ano em que
  foi feita: em 2020, "Rafa" saiu do mapeamento porque pode ser outra pessoa.
- Os 3 jogos de `games_extra` (2019) não são importados.
- **2020:** a categoria vem de cada jogo (`team_sugerido`): "Adulto" → `adulto`, "30+" →
  `master` (P-22). Os 4 jogos do "Kids" ficam de fora até o técnico definir a categoria.
- **2020:** o placar gravado é o final da Scoutt Geral (`placar_final`). Em 3 jogos ele difere
  1 ponto da soma do boletim do adversário, o que contraria a ADR-0011 ("placar oficial = soma
  do boletim"). ⚠ Em aberto em `docs/recados-tecnico.md` (Importação 2020).

## Consequências
Estatísticas por ano e recordes pessoais tratam esses dados como exatos. Atletas que ficaram
de fora não aparecem no boletim importado, então a soma dos pontos dos atletas do jogo pode
ficar menor que o placar até eles serem vinculados (script de atualização, como os rounds de 2019).
