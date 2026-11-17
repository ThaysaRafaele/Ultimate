# 0008. Regras dos dados históricos importados (2018, 2019 e 2020)

- Status: aceita (exibição ⚠ em aberto: P-17, P-18)
- Data: 2026-10-05 (2020 importado em 2026-11-16; respostas do técnico de 2026-11-17 no round 2)
- Fontes: cabeçalhos de `scripts/import-games-2018.mjs`, `scripts/import-games-2019.mjs`,
  `scripts/import-games-2020.mjs` e `scripts/update-games-2020-round2.mjs`, `docs/*.json`

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
  `master` (P-22), "Kids" → `blazers` (Kids é o antigo blazers; técnico, 2026-11-17).
- **2020:** o placar gravado é o final da Scoutt Geral (`placar_final`), confirmado pelo técnico.
  Em 3 jogos ele difere 1 ponto da soma do boletim do adversário; nos dados históricos isso é
  uma exceção à ADR-0011 ("placar oficial = soma do boletim"), que vale para jogos lançados no app.
- **2020:** datas seguem fictícias, na época indicada pelo técnico (Férias Cup em março,
  Circuito Master em junho, Copa América a partir de setembro).
- Cadastros duplicados são mesclados no cadastro ativo (escalação, boletim, MVP e notificações de
  todos os anos; boletim somado se os dois estiverem no mesmo jogo) e o inativo é apagado.
  Scripts antigos passam a apontar para o id que ficou.
- Pendências que restam (Marcius, categorias de Rafa e Segóvia, dados perdidos na mescla) ficam
  em `docs/recados-tecnico.md` (Importação 2020).

## Consequências
Estatísticas por ano e recordes pessoais tratam esses dados como exatos. Atletas que ficaram
de fora não aparecem no boletim importado, então a soma dos pontos dos atletas do jogo pode
ficar menor que o placar até eles serem vinculados (script de atualização, como os rounds de 2019).
