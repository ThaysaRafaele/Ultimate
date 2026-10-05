# Issues: Épico 1, Visão geral

Issues verticais (tracer-bullet) do épico. Este arquivo é a fonte (sem tracker).

**Épico (texto-fonte):** pedido do técnico em 2026-10-05. A aba Visão geral mostra o resumo
anual de estatísticas como o da planilha dele (por categoria e por jogador), o histórico de
jogos do ano, um resumo geral com todos os anos e a opção de exportar o relatório para Excel.
Começa por 2018, que já está completo no sistema.

## Como executar
- Ordem: 1 → 6. A Issue 1 é tracer-bullet. A 2 é independente (pode rodar a qualquer
  momento). 3 e 4 dependem da 1; 5 depende de 3 e 4; 6 depende de 3, 4 e 5.
- Cada issue roda pelo workflow `executar-issue` (args: `issueArquivo: "docs/issues/visao-geral.md"`, `issueNumero`).
- Ordem fixa de tasks: (0) Vitest se faltar → (1) modelo de dados → (2) regra pura →
  (3) repo → (4) rota → (5) tela → (6) teste.
- Convenções e preferências: `CLAUDE.md` (UI/UX caprichada, opção gratuita, sem commit).

## Termos canônicos usados (ver CONTEXT.md)
- Resumo anual / Resumo geral: consolidado de um ano civil / de todos os anos.
- Categoria (`teams`): filtro da Visão geral (parâmetro `?team=`, mesmo do cabeçalho).
- Jogo realizado (`games.status = "realizado"`): único que entra na contagem.
- Resultado: vitória (nosso > deles), derrota (nosso < deles), empate (igual). ADR-0011.
- Placar oficial = soma do boletim completo; no sistema, é o placar gravado (`our_score`,
  `their_score`) depois da Issue 2. ADR-0011.
- EFF: `computeEff` (ADR-0006).

## Fora do épico
- Importar a planilha de 2020 a 2025: aguarda o mapeamento elenco → categoria (P-22).
- Jogos internos (P-23): não existem no banco hoje.
- Métricas extras D.D, T.D, P+20, R+10, A+10, Eff+20 e colocação (P-21, confirmar com o técnico).
- Feminino; ano de 2026 (técnico ainda não lançou dados); marcação "data estimada" (P-18).

---

## Issue 1: Tracer-bullet, tela Visão geral com o resumo anual da categoria

> **Status: implementada em 2026-10-05, aguardando revisão e commit da usuária.**
> Conferido no `npm run dev`: Adulto 2018 = 15 jogos, 8V 7D 0E, 938 × 859 pontos (igual à
> linha T de 2018 da "Scoutt Geral"); 2019 = 36 jogos, 29V 7D. Divergências do texto da issue:
> `getOverviewYears` virou `getRealizedGameDates` + `availableYears` (o ocultamento de 2026 fica
> num lugar só); Vitest 4 em vez de 5 (o 5 exige `@types/node` ≥ 22); estado vazio extra para
> "só há jogos de 2026" e "jogos realizados sem placar".
> Sugestões da revisão não aplicadas (baixa prioridade): testar o arredondamento exibido
> (ex.: 8/15 = 53%); rótulo "Jogos" conta só jogos com placar (a dica mostra os sem placar).

**Contexto/Decisões:** `CONTEXT.md` › Resumo anual, Categoria, Placar, Jogo · ADR-0004 (só
jogo realizado tem resultado) · ADR-0011 (regras de contagem, 2026 fora).
**Protótipo:** `_prototype_extracted.html` › tela "Visão geral" (cards "Jogos na temporada",
"Aproveitamento", "Média de pontos"). Só inspiração visual: o protótipo está desatualizado.
**Escopo:** rota `/visao-geral`, item do menu, seletor de ano e de categoria, cards do resumo
anual da categoria. **Fora:** lista de jogos (Issue 3), jogadores (Issue 4), todos os anos
(Issue 5), exportação (Issue 6).

**Tasks:**
0. **Vitest**: setup de `.claude/skills/decompor-epico/references/vitest-setup.md`.
1. **Modelo de dados**: não se aplica.
2. **Regra pura** `lib/overview-calc.ts`:
   - `gameResult(our, their)` → `"vitoria" | "derrota" | "empate"`;
   - `summarizeGames(games)` → jogos realizados, vitórias, derrotas, empates, aproveitamento
     (vitórias ÷ realizados, 0 quando não há jogos), pontos pró e contra (total e média por
     jogo), saldo;
   - jogo realizado sem placar não quebra o cálculo (ignorado e contado à parte);
   - `HIDDEN_YEARS = [2026]` com comentário "remover quando o técnico lançar 2026" e
     `availableYears(games)` (anos com jogo realizado, sem os ocultos, decrescente).
3. **Repo** `lib/overview-repo.ts`: `getRealizedGames(teamId, year)` (só `realizado`, com
   nome do campeonato) e `getOverviewYears(teamId)`. Uma consulta por tela, sem N+1.
4. **Rota**: não se aplica (Server Component lê via repo).
5. **Tela** `app/visao-geral/page.tsx` + `components/OverviewSummary.tsx`:
   - `lib/nav-items.ts`: "Visão Geral" passa a apontar para `/visao-geral`;
   - parâmetros `?team=` (seletor do cabeçalho) e `?year=` (default: ano mais recente disponível);
   - ajustar `components/YearFilter.tsx` para **preservar os outros parâmetros** da URL (hoje
     ele descarta `team`), sem quebrar o perfil do atleta;
   - cards: Jogos, Vitórias / Derrotas / Empates, Aproveitamento (%), Pontos pró e contra
     (média por jogo em destaque, total abaixo), Saldo;
   - estado vazio amigável quando a categoria não tem jogo realizado no ano (com atalho para
     "Jogos"); `loading.tsx` com esqueleto dos cards;
   - visual coerente com Atletas/Jogos (tipografia `font-heading`, `brand-red`), cards em
     grade que vira 2 colunas no celular (`max-md:`).
6. **Teste** `lib/overview-calc.test.ts`: vitória, derrota, empate, aproveitamento com 0 jogos,
   jogo sem placar, médias com arredondamento, `availableYears` sem 2026.

**Critérios de aceitação:**
- [ ] Menu "Visão Geral" abre `/visao-geral` e fica destacado como ativo.
- [ ] Adulto, 2018: 15 jogos, 8 vitórias, 7 derrotas, 0 empates (conferir com "Scoutt Geral").
- [ ] Trocar categoria no cabeçalho mantém o ano; trocar o ano mantém a categoria.
- [ ] 2026 não aparece no seletor de ano.
- [ ] Categoria sem jogos no ano mostra estado vazio, não zeros soltos nem erro.
- [ ] Legível e sem rolagem horizontal no celular.

**⚠ Pendências (confirmar):** P-21 (métricas extras ficam fora); números de pontos de 2018
só batem com a planilha depois da Issue 2.

**Definição de pronto:** `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
passam; fluxo conferido no `npm run dev` (desktop e celular); UI revisada (carregando, vazio,
erro); nenhuma dependência paga.

---

## Issue 2: Placar oficial de 2018 igual à soma do boletim

**Contexto/Decisões:** ADR-0011 (placar oficial = soma do boletim completo) · ADR-0008
(padrão de scripts: dry-run, `--apply`, idempotente) · `docs/analise-planilha.md` §4.
**Protótipo:** não há.
**Escopo:** corrigir os 3 jogos de 2018 cujo placar gravado difere da soma do boletim completo
em `docs/games_2018.json` (`placar_boletim_ultimate` / `placar_boletim_adversario`):
Funlec (73 → 77), Neon (adversário 84 → 81), Coxim (79 → 81; adversário 38 → 39).
**Fora:** 2019 (já confere: o boletim completo do JSON é igual ao placar gravado); recalcular
pelo `game_stats` do banco (incompleto: jogadores sem cadastro ficaram de fora).

**Tasks:**
0. **Vitest**: não se aplica (feito na Issue 1, ou não necessário para script).
1. **Modelo de dados**: não se aplica.
2. **Regra pura**: não se aplica.
3. **Repo**: não se aplica.
4. **Rota**: não se aplica.
5. **Script** `scripts/fix-placar-2018.mjs` (no padrão de `scripts/import-games-2018.mjs`):
   - lê `docs/games_2018.json`, localiza cada jogo pela chave da ADR-0008 (categoria
     `adulto`, campeonato, adversário, data);
   - dry-run por padrão: lista "jogo: placar atual → placar do boletim"; só grava com `--apply`;
   - atualiza só `our_score`/`their_score` quando diferem; idempotente (segunda execução não
     muda nada);
   - avisa se algum jogo não for encontrado ou se o resultado (vitória/derrota) mudaria.
   - **Não rodar com `--apply`**: a usuária roda depois de revisar.
6. **Teste**: não se aplica (conferência pelo dry-run).

**Critérios de aceitação:**
- [ ] Dry-run lista exatamente os 3 jogos com os valores acima e nenhum outro.
- [ ] Após `--apply` (feito pela usuária), soma dos placares do Ultimate em 2018 = 944.
- [ ] Segunda execução informa "nada a alterar".

**⚠ Pendências (confirmar):** nenhuma.

**Definição de pronto:** `npm run lint` · `npx tsc --noEmit` passam; dry-run executado e saída
anexada ao relatório da issue; nada aplicado no banco pelo agente.

---

## Issue 3: Histórico anual de jogos da categoria

> **Status: implementada em 2026-10-05, aguardando revisão e commit da usuária.**
> Conferido no `npm run dev`: Adulto 2018 = 4 campeonatos, 15 jogos; total e quartos de cada
> campeonato idênticos às linhas T da "Scoutt Geral" (Copa Ucdb 332 × 302, NBMS 292 × 257,
> Jogos Abertos 257 × 239, Amistoso 57 × 61). Grade completa (com quartos) a partir de `lg`;
> abaixo disso, data, adversário, placar e selo.
> Observação: a Copa Ucdb aparece antes dos Jogos Abertos porque dois jogos dela têm a data
> fictícia 01/01/2018 (P-18). Fica para avaliar junto da marcação de data estimada.
> Sugestões da revisão não aplicadas (baixa prioridade): agrupar por id do campeonato em vez
> do nome; `router.refresh()` só quando o boletim for salvo.

**Contexto/Decisões:** `CONTEXT.md` › Jogo, Campeonato, Placar · ADR-0011 (placar por quarto
e final; adversário só placar) · ADR-0008 (datas fictícias mantidas).
**Protótipo:** `_prototype_extracted.html` › "Histórico de jogos" (inspiração).
**Escopo:** abaixo dos cards, a lista de jogos realizados do ano agrupada por campeonato, com
subtotal e média por campeonato (como as linhas T e M da "Scoutt Geral"). **Fora:**
colocação no campeonato (P-21), jogos agendados.

**Tasks:**
0. **Vitest**: não se aplica.
1. **Modelo de dados**: não se aplica.
2. **Regra pura** `lib/overview-calc.ts`: `groupByChampionship(games)` → grupos ordenados pela
   data do primeiro jogo, cada um com seus jogos e o `summarizeGames` do grupo, incluindo
   média por quarto.
3. **Repo**: reutilizar `getRealizedGames` (Issue 1), garantindo os campos `q1..q4`/`ot`.
4. **Rota**: não se aplica.
5. **Tela** `components/OverviewGames.tsx`:
   - seção "Jogos do ano" com um bloco por campeonato: cabeçalho com nome, jogos e V/D/E;
   - linha por jogo: data (`formatDateBR`), adversário, quartos (Q1 a Q4 e prorrogação só se
     houver), placar final em destaque, selo Vitória/Derrota/Empate com cor;
   - rodapé do bloco: total e média;
   - clicar no jogo abre o boletim existente (`StatsModal`, somente leitura ou edição como hoje);
   - no celular: quartos recolhidos, mostrando data, adversário, placar e selo.
6. **Teste**: `groupByChampionship` (ordem, subtotais, médias de quarto com jogos sem quarto).

**Critérios de aceitação:**
- [ ] Adulto, 2018: 4 campeonatos (Jogos Abertos CG, NBMS, Copa Ucdb, Amistoso), 15 jogos.
- [ ] Subtotais de cada campeonato batem com as linhas T da "Scoutt Geral" de 2018
      (considerando o placar corrigido na Issue 2).
- [ ] Clicar num jogo abre o boletim dele.
- [ ] Sem rolagem horizontal da página no celular.

**⚠ Pendências (confirmar):** P-18 (marcar data estimada fica fora; datas aparecem como estão).

**Definição de pronto:** `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
passam; fluxo conferido no `npm run dev` (desktop e celular); UI revisada.

---

## Issue 4: Resumo anual por jogador

> **Status: implementada em 2026-10-05, aguardando revisão e commit da usuária.**
> Conferido no `npm run dev` (Adulto 2018): Juliano 168 pts / 11 J, Ibra 155 / 15, Vini 153 / 13,
> Guto 134 / 9; Renan (inativo) aparece; "Outros (sem cadastro)" = 49. Divergências explicadas:
> Dalton, Renan e Davi (dados já conhecidos); Rafa 68 (Rafa + Rafa Pivo somados por decisão);
> EFF menor que a da planilha porque o sistema desconta faltas (ADR-0006; recado ao técnico).
> Divergências do texto: `othersRow` virou `othersPoints`; a linha "Outros" some quando há
> jogo realizado sem placar no ano (total oficial incompleto). Não feito: cabeçalho da tabela
> fixo ao rolar a página (exigiria limitar a altura da tabela).

**Contexto/Decisões:** `CONTEXT.md` › Atleta, Estatísticas do atleta, EFF · ADR-0006 (EFF) ·
ADR-0009 (inativo continua no histórico) · ADR-0011 (jogador entra pelo que jogou no ano;
placar oficial).
**Protótipo:** `_prototype_extracted.html` › "Comparativo entre jogadores" (inspiração).
**Escopo:** seção "Jogadores do ano" com todos os atletas que têm estatística no ano/categoria,
totais e médias, ordenação e link para o perfil. **Fora:** métricas extras (P-21), gráficos.

**Tasks:**
0. **Vitest**: não se aplica.
1. **Modelo de dados**: não se aplica.
2. **Regra pura** `lib/overview-calc.ts`: `summarizePlayers(rows)` → por atleta: jogos, pontos,
   rebotes (total), assistências, roubos, tocos, erros, faltas, 2P/3P/LL convertidos, tentados e
   %, EFF (via `computeEff`, **com faltas**), totais e médias por jogo disputado; e
   `othersRow(teamPoints, playersPoints)` = pontos do placar oficial não atribuídos a atletas
   cadastrados ("Outros (sem cadastro)").
3. **Repo** `lib/overview-repo.ts`: `getPlayerStatsForYear(teamId, year)`, uma consulta agregada
   (`game_stats` × `games` × `athletes`, sem filtro de ativo nem de categoria atual do atleta).
4. **Rota**: não se aplica.
5. **Tela** `components/OverviewPlayers.tsx`:
   - tabela com cabeçalho fixo, ordenável por coluna (padrão: pontos); alternar "Totais" / "Médias";
   - nome com apelido; atleta inativo com selo discreto "inativo";
   - linha "Outros (sem cadastro)" no fim, em tom neutro, com tooltip explicando;
   - nome leva a `/perfil/[id]?year=<ano>`;
   - no celular: primeira coluna fixa e rolagem horizontal só dentro da tabela.
6. **Teste**: `summarizePlayers` (médias, % com 0 tentativas, EFF com faltas) e `othersRow`.

**Critérios de aceitação:**
- [ ] Adulto, 2018: Ibra 15 jogos / 155 pontos; Juliano 168 pontos; Guto 134 pontos
      (conferir com "TOTAL ANO 2018"; diferenças conhecidas: Dalton, Renan, Big Davi).
- [ ] Atletas inativos que jogaram em 2018 aparecem.
- [ ] Linha "Outros" mostra a diferença entre o placar oficial e a soma dos atletas.
- [ ] Ordenar por qualquer coluna funciona; link abre o perfil já no ano.

**⚠ Pendências (confirmar):** P-20 (EFF média do perfil sem faltas: a Visão geral já calcula
com faltas; corrigir o perfil fica para outra issue).

**Definição de pronto:** `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
passam; fluxo conferido no `npm run dev` (desktop e celular); UI revisada.

---

## Issue 5: Resumo geral com todos os anos

**Contexto/Decisões:** `CONTEXT.md` › Resumo geral · ADR-0011 (2026 oculto; jogos internos
contam uma vez no total do clube).
**Protótipo:** não há.
**Escopo:** opção "Todos os anos" no seletor de ano: tabela com uma linha por ano (jogos,
V/D/E, aproveitamento, pontos pró/contra e médias) + linha de total; seção de jogadores com
totais de carreira (mesmas colunas da Issue 4); opção "Todas as categorias" no seletor.
**Fora:** jogos internos (não existem hoje; P-23), importação 2020 a 2025 (P-22).

**Tasks:**
0. **Vitest**: não se aplica.
1. **Modelo de dados**: não se aplica.
2. **Regra pura** `lib/overview-calc.ts`: `summarizeByYear(games)` e reuso de
   `summarizePlayers` sem filtro de ano.
3. **Repo**: variantes de `getRealizedGames`/`getPlayerStatsForYear` com `year` opcional e
   `teamId` opcional ("todas").
4. **Rota**: não se aplica.
5. **Tela**: `?year=todos` troca cards + jogos por tabela anual (clicar no ano leva ao resumo
   daquele ano); `?team=todos` usa `ALL_TEAMS_ID` de `lib/teams.ts`. Seletor com rótulos
   claros ("Todos os anos", "Todas as categorias").
6. **Teste**: `summarizeByYear` (anos ordenados, total geral = soma, 2026 fora).

**Critérios de aceitação:**
- [ ] Adulto, todos os anos: linhas 2018 (15 jogos) e 2019 (36 jogos, os importados) + total.
      A planilha lista 37 em 2019; a diferença é conhecida (jogos não confirmados, P-17).
- [ ] Clicar em 2018 leva ao resumo anual de 2018.
- [ ] "Todas as categorias" soma as categorias sem duplicar jogos.

**⚠ Pendências (confirmar):** P-23 (regra de jogo interno só quando existir).

**Definição de pronto:** `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
passam; fluxo conferido no `npm run dev` (desktop e celular); UI revisada.

---

## Issue 6: Exportar relatório para Excel

**Contexto/Decisões:** pedido do técnico (usa Excel) · ADR-0011 · preferência por opção
gratuita (`CLAUDE.md`).
**Protótipo:** não há.
**Escopo:** botão "Exportar Excel" no resumo anual e no resumo geral, gerando `.xlsx` com abas
"Resumo", "Jogos" e "Jogadores" (no geral: "Por ano" e "Jogadores"), com o mesmo recorte de
categoria/ano da tela. **Fora:** PDF, envio por e-mail.

**Tasks:**
0. **Vitest**: não se aplica.
1. **Modelo de dados**: não se aplica.
2. **Regra pura** `lib/overview-export.ts`: monta as linhas de cada aba a partir dos
   resultados de `summarizeGames`/`groupByChampionship`/`summarizePlayers`/`summarizeByYear`
   (sem depender da biblioteca, para ser testável).
3. **Repo**: reutilizar os da Issue 1, 4 e 5.
4. **Rota** `app/api/visao-geral/export/route.ts`: `GET ?team=&year=` valida parâmetros
   (400 com `{ error }` se inválidos), gera o arquivo com **`exceljs`** (MIT, gratuito:
   única dependência nova autorizada) e responde com `Content-Disposition:
   attachment; filename="ultimate-<categoria>-<ano>.xlsx"`.
5. **Tela** `components/ExportButton.tsx`: botão secundário ao lado dos seletores, com estado
   "Gerando..." e mensagem de erro amigável se falhar; desabilitado quando não há dados.
   Planilha com cabeçalho em negrito, colunas com largura ajustada, números como número
   (não texto) e % formatado.
6. **Teste**: `overview-export` (cabeçalhos e ordem das colunas, totais iguais aos da tela).

**Critérios de aceitação:**
- [ ] Adulto 2018 exporta `ultimate-adulto-2018.xlsx` que abre no Excel com 3 abas.
- [ ] Números da planilha exportada iguais aos da tela.
- [ ] Parâmetro inválido devolve erro 400 legível; botão mostra a mensagem.

**⚠ Pendências (confirmar):** formato das colunas espelhar a "Scout Atletas" do técnico? Default:
mesmas colunas da tela, na ordem da "Scout Atletas" sem as métricas extras (P-21).

**Definição de pronto:** `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
passam; arquivo aberto no Excel e conferido; fluxo no `npm run dev`; nenhuma dependência paga.
