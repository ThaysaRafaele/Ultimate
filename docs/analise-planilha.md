# Análise da planilha "Scoutt Geral Ultimate 2.xlsx"

Data: 2026-10-05. Fase 1 (só análise): nenhum código ou dado do banco foi alterado.
Objetivo: preparar a aba **Visão geral** (resumo anual, resumo de todos os anos, histórico
anual de jogos, visão por categoria e por jogador, exportação para Excel).

Como foi lido: o `.xlsx` foi descompactado e os XMLs lidos com um script Node próprio (sem
instalar biblioteca). Blocos de jogo localizados pela linha com "Jogadores" na coluna A,
buscando "Total" em até 25 linhas; colunas mapeadas pelo texto do cabeçalho de cada bloco.

## 1. Abas e papel de cada uma

São **41 abas**. As que importam para a Visão geral:

| Aba | Papel | Tamanho |
|---|---|---|
| **Scoutt Geral** | **Resumo de jogos por ano** (2018 a 2026): 1 linha por jogo com campeonato, confronto, data, placar por quarto, placar final, % de arremesso, totais do time e cestinha. Linhas **T** (total) e **M** (média) por campeonato, **colocação** ("4° Lugar", "Campeão"), total do ano, saldo por elenco ("Ultimate 43 (31v 12d)") e seção **Rivais** (confronto por adversário). | 697 linhas |
| **Scout Atletas** | **Resumo por jogador** por campeonato e **TOTAL ANO** (2018 a 2026, 106 seções). Colunas: Jogos, 2P/3P/LL (tentados, acertos, %), Rebotes, Assist., Tocos, Erros, Roubos, Faltas (total e média), Pontos, Média, EFF, Média EFF, **D.D, T.D, P+20, P+25, R+10, R+15, R+20, A+10, Eff+20** (e em algumas seções "MVF F", "CHAMPS"). | 2.101 linhas |
| **Sout Jogos Masculino** | **Boletins** jogo a jogo, 2018 a 2024 (blocos Ultimate + adversário). | 9.105 linhas, 611 blocos |
| **Jogos 2025**, **Jogos 2026** | Boletins de 2025 e 2026, mesmo formato. | 172 e 100 blocos |
| **Scoutt Jogos Feminino** | Boletins do feminino (a partir de 2022). | 25 blocos |
| Scout Atletas Fem | Resumo por jogadora. | 76 linhas |

As outras 33 abas são tabelas de campeonato, classificação, chaveamento, calendário, plano
de jogo, "1x1" e gráficos. **Não são fonte** para a Visão geral (servem só de conferência de
colocação).

## 2. Cobertura por ano e elenco (Scoutt Geral)

Elenco deduzido do nome do time no confronto ("Ultimate Kids x ...", "Blazers x ...") e de
marcadores no campeonato (30+, 40+, Sub 25).

| Elenco | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|
| Ultimate (adulto) | 15 | 30 | 12 | 4 | 35 | 40 | 35 | 36 | 7 |
| Ultimate 25+ | | 3 | | | | | | | |
| Ultimate 30+ | | 4 | 5 | 5 | 10 | 5 | 4 | 4 | |
| Ultimate 40+ | | | | | | 8 | 2 | 3 | |
| Ultimate Sub 25 | | | | | | 3 | | | |
| Kids | | | 4 | 1 | 17 | 20 | 11 | | |
| Blazers | | | | | | 2 | 4 | 28 | 9 |
| Ultimasters | | | | | | | 9 | | |
| Ufms | | | | | | | 3 | 1 | |
| CG City (?) | | | | | | | | 3 | 4 |
| **Total de jogos** | **15** | **37** | **21** | **10** | **63** | **79** | **68** | **75** | **20** |
| Vitórias / derrotas / empates | 8/7/0 | 29/7/1 | 16/5/0 | 7/3/0 | 44/19/0 | 45/34/0 | 41/25/2 | 40/33/2 | 10/8/0 |

Feminino não aparece na Scoutt Geral (só tem boletins próprios).

Qualidade por ano:

| Ano | Jogos | Com data | Com boletim casado* |
|---|---|---|---|
| 2018 | 15 | 12 | 12 |
| 2019 | 37 | 6 | 33 |
| 2020 | 21 | 1 | 18 |
| 2021 | 10 | 5 | 6 |
| 2022 | 63 | 60 | 54 |
| 2023 | 79 | 48 | 65 |
| 2024 | 68 | 27 | 60 |
| 2025 | 75 | **0** | 56 |
| 2026 | 20 (2 sem placar) | 4 | 11 |

\* Boletim casado = par de blocos (Ultimate + adversário) cujo total de pontos bate com o
placar final da Scoutt Geral. Não casar não significa que o boletim falta: pode haver
divergência de placar (ver §4).

Nos boletins: 494 de 600 blocos da aba masculina casaram; sobraram 106 (masculino), 44 (2025),
64 (2026) e 20 (feminino). A Scoutt Geral de 2026 lista 20 jogos, mas "Jogos 2026" tem ~50
boletins: **o resumo de 2026 está atrasado em relação aos boletins**.

## 3. Campos disponíveis para a Visão geral

**Por jogo** (Scoutt Geral): campeonato, confronto (lado Ultimate + adversário), data (quando
há), placar por quarto (4 quartos, sem prorrogação nesta aba), placar final, colocação do
campeonato, cestinha e seus pontos.

**Por jogador por jogo** (boletins, layout dominante em 538 de 611 blocos): LL, 2P e 3P
(tentados e convertidos), Reb O, Reb D, Reb total, Assist., Tocos, Erros, Roubos, Faltas,
Pontos, EFF. Em ~40 blocos antigos não há separação Reb O/D nem EFF.

**Por jogador por ano** (Scout Atletas, TOTAL ANO): o resumo que o técnico já usa. Tudo é
derivável dos boletins, **exceto** colocação e "CHAMPS"/"MVF F".

Métricas da planilha que o sistema **ainda não calcula**:
- **D.D** (duplo-duplo), **T.D** (triplo-duplo);
- **P+20, P+25** (jogos com 20+/25+ pontos), **R+10, R+15, R+20** (rebotes), **A+10**
  (assistências), **Eff+20**;
- **Colocação** por campeonato (texto livre: "Campeão", "2º Lugar", "3° lugar adulto");
- **Saldo por elenco** no ano ("Kids 16 (4v 12d)");
- **Rivais**: jogos, vitórias/derrotas e médias por adversário.

Conferência da fórmula: a EFF por jogo da planilha bate com `computeEff` (ex.: Ibra × NTB
2018 = −5). Ver ADR-0006.

## 4. Lacunas e dados quebrados

**Datas.** A coluna DATA da Scoutt Geral falta em muitos jogos (2019: 31 de 37; 2020: 20 de 21;
**2025: todos**). Os boletins não têm data. A tabela `games` exige `game_date`.

**Identificação do jogo nos boletins.** Blocos antigos só têm "VS NTB" numa coluna lateral;
os novos têm "Ultimate x MS ( Semi Final 30+)". Campeonato aparece em títulos esparsos
("COPA AMÉRICA 2019", "ferias cup") em colunas variadas. A ligação confiável é **placar final
+ ordem**, casando com a Scoutt Geral.

**Placar × soma dos pontos (P-09).** Em 2018: soma dos placares finais = **938**; soma dos
pontos dos atletas no boletim = **944**; TOTAL ANO da Scout Atletas = **893**. Jogos com
placar diferente do boletim: Funlec (73 × 77), Neon (84 × 81 do adversário), Coxim (79 × 81).

**TOTAL ANO incompleto.** O TOTAL ANO 2018 lista 10 jogadores; jogaram 18 nomes (Rafa Pivo,
Brendo, Italo, Rodrigo L, Douglas, Lucas... ficaram de fora). Diferenças pontuais com os
boletins: Dalton (88 × 91 pts), Renan (46 × 42 pts; 64 × 77 reb), Big Davi (14 × 15 jogos),
Petini (só no TOTAL ANO). EFF de Rafa = 0 nas duas fontes (provável fórmula não aplicada).

**Nomes de jogador.** 796 nomes distintos nos blocos (inclui adversários). Variações de
grafia ("Oruê"/"Orue", "Rodrigo L"/"Rodrigo l"), apelidos genéricos de adversário ("pivo
careca", "armador") e linhas-título ("Atletas", "Jogadores"). Exige tabela de apelidos
revisada à mão, como o `PLAYER_MAP` de `scripts/import-games-2019.mjs`.

**Células com erro.** #DIV/0! (5.210 na aba masculina, 516 em 2025, 300 em 2026, 538 no
feminino) e #REF! (89): quase todos em colunas de **percentual** ou cálculos laterais.
Em colunas de contagem só há **1** erro (`T7023 = #VALUE!`). Na Scoutt Geral, 3 #VALUE! em
linhas de média.

**Células vazias.** Em linhas de jogador, vazio significa zero na prática (ex.: 3P convertidos
vazio em 5.505 linhas). Exceção: 17 linhas sem rebote e 3 sem pontos (checar à mão).

**Blocos irregulares.** 11 blocos sem linha "Total" em 25 linhas; 5 linhas onde "Jogadores"
aparece como nome em vez de cabeçalho (linhas 5743, 5865, 5893, 5921, 6234).

**Elencos ambíguos.** "ultimatte", "ultmate" (erro de digitação), "CG City" (2025/2026, não
identificado). **Jogos internos**: Ultimate × Ultimasters, Blazers × Ultimasters (2024) contam
como vitória de um elenco e derrota de outro do mesmo clube. **Empates** registrados em 2019,
2024 e 2025 (basquete não tem empate: provável erro ou jogo interrompido).

**Jogos futuros.** 2026 tem linhas de campeonato sem confronto/placar (Copa América 30+/40+,
Metropolitano): agenda, não resultado.

## 5. Comparação com o que já foi extraído

| Fonte | Já no sistema | Falta |
|---|---|---|
| `docs/games_2018.json` | 15 jogos de 2018, categoria `adulto`, com boletim | nada de 2018 (exceto Petini, se for o caso) |
| `docs/ultimate_basketball_2019.json` | 36 jogos + 3 extras não importados; 30 com data estimada; 4 sem stats por atleta | 3 jogos extras (P-17); nomes sem cadastro |
| Planilha 2020 a 2026 | nada | ~336 jogos, boletins de ~250, feminino |
| Kids, 30+, 40+, Blazers etc. | nada (2018/2019 foram tudo para `adulto`, inclusive Copa Maringá 25+ e Cuiabá 30+) | mapear elenco → categoria |

Decisões existentes respeitadas: ADR-0006 (EFF), ADR-0007 (campeonato por nome + mescla),
ADR-0008 (regras de importação: idempotente, rebote total como defensivo, nomes só
confirmados), ADR-0009 (atleta inativo continua no histórico).

## 6. Proposta de script de seed (Drizzle + Neon)

Mesmo padrão dos scripts atuais: `node scripts/seed-planilha.mjs` (dry-run) e `--apply`.

**Etapas**
1. **Extrair** (sem dependência nova): descompactar o `.xlsx` e ler os XMLs (o leitor usado
   nesta análise faz isso em ~150 linhas). Alternativa gratuita: `exceljs` (MIT), que também
   serviria para a exportação da Visão geral.
2. **Normalizar** para JSON intermediário por ano (`docs/extraido/AAAA.json`), revisável no git:
   jogos da Scoutt Geral + boletim casado (só o lado Ultimate) + pendências do casamento.
3. **Mapear** com arquivos editados à mão:
   - `docs/extraido/apelidos.json`: nome na planilha → `athletes.id` (ou "ignorar");
   - `docs/extraido/elencos.json`: elenco (Ultimate, Kids, Blazers, 30+...) → `teams.id`.
   Nome sem mapeamento não é importado e entra no relatório do dry-run.
4. **Gravar** (só com `--apply`), idempotente pela mesma chave da ADR-0008
   (categoria, campeonato, adversário, data):
   - `championships` via mesma regra de `getOrCreateChampionship`;
   - `games` com status `realizado`, placar final; **adversário só placar final** (sem
     `opp_*`, decisão de 2026-10-05);
   - `game_lineups` + `game_stats` só do lado Ultimate (ON CONFLICT DO NOTHING);
   - vazio = 0; rebote sem separação = defensivo (ADR-0008).
5. **Relatório do dry-run**: por ano, jogos novos/pulados, boletins não casados, nomes sem
   mapeamento, divergência placar × soma de pontos.

**Mudanças de schema prováveis** (via `drizzle-from-mermaid-erd`, a decidir):
- `games.date_estimated boolean` para datas inventadas (2025 inteiro não tem data);
- `games.source text` (ex.: `planilha:Scoutt Geral!C396`) para rastrear e reimportar;
- tabela de **colocação por campeonato/categoria/ano** (`championship_results`), se a Visão
  geral for mostrar "Campeão / 4º lugar".

## 7. Perguntas para o técnico antes do seed

1. Que **categoria do sistema** corresponde a cada elenco (Ultimate adulto, 25+, 30+, 40+,
   Sub 25, Kids, Blazers, Ultimasters, Ufms, CG City)?
2. **Placar oficial**: vale o placar final da Scoutt Geral ou a soma do boletim quando divergem?
3. **Data** de jogos sem data: estimar (ex.: ordem dentro do ano) e marcar como estimada?
4. **Jogos internos** (Ultimate × Ultimasters) e **empates**: entram nas vitórias/derrotas?
5. **Feminino**: entra agora (só boletins, sem resumo) ou depois?
6. **Placar por quarto**: entra (é placar, não estatística do adversário) ou só o final?
7. **Colocação** e as métricas D.D, T.D, P+20, R+10, A+10, Eff+20 devem aparecer no relatório?
8. **2026**: o resumo está atrasado em relação aos boletins; a fonte de 2026 são os boletins?

### Respostas (2026-10-05), registradas na ADR-0011

| # | Resposta |
|---|---|
| 1 | Em aberto: P-22 (proposta de mapeamento elenco → categoria no `CONTEXT.md`). |
| 2 | Vale a **soma do boletim**. Corrigir os 3 jogos de 2018 gravados com o placar final. |
| 3 | **Data fictícia**, como nos jogos de 2019. |
| 4 | Jogo interno: vitória/derrota para cada categoria, **uma vitória** no total do clube; empate idem. Modelagem em P-23. |
| 5 | Feminino **fora** por enquanto (nenhuma atleta cadastrada). |
| 6 | Entram **placar por quarto e placar final**. |
| 7 | Métricas extras **fora** por enquanto; confirmar com o técnico (P-21). |
| 8 | 2026 **fora** da Visão geral por enquanto (técnico ainda não lançou dados). |
