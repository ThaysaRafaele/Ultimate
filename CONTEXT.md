# Contexto do domínio: Ultimate Basketball

Atualizado em 2026-10-05 (primeiro grilling, sessão autônoma sobre código, protótipo e dados).
Fonte de verdade do vocabulário: código, issues e ADRs usam estes termos. Ordem de
precedência entre fontes: decisão confirmada com o usuário > código em produção > protótipo
(ver [ADR-0001](docs/adr/0001-artefatos-de-dominio.md)).

> **Protótipo desatualizado.** O protótipo HTML é anterior a decisões tomadas em reuniões
> com o técnico. Divergência protótipo × código **não** indica erro do código; o protótipo
> serve só como referência visual. As pendências abaixo ficam anotadas para resolver depois.

## Glossário

### Adversário (`games.opponent`)
Time que enfrentou o Ultimate num jogo. Hoje é texto livre por jogo, sem cadastro próprio
(o protótipo tinha cadastro de adversários: ver P-12).

### Apelido (`athletes.nickname`)
Nome curto do atleta usado no boletim e na escalação. Opcional, gravado em MAIÚSCULAS.

### Atleta (`athletes`)
Jogador do clube. Tem nome (MAIÚSCULAS), posição, número da camisa, medidas, contato,
data de nascimento, data de entrada no clube e foto. Pertence a **uma ou mais** categorias
([ADR-0002](docs/adr/0002-categoria-termo-canonico.md)). Nunca é excluído, só fica
**inativo** ([ADR-0009](docs/adr/0009-exclusao-e-inativacao.md)).
Estados: [estados-atleta.mmd](docs/dominio/estados-atleta.mmd).

### Aviso / Recorde pessoal (`notifications`)
Aviso gerado quando, ao salvar as estatísticas de um jogo, um atleta supera o próprio
melhor resultado em pontos, rebotes, assistências, roubos ou EFF em todos os outros jogos
([ADR-0010](docs/adr/0010-recorde-pessoal.md)). Pode estar lido ou não lido.

### Boletim
Conjunto de dados de um jogo realizado: placar por quarto (Q1 a Q4 + prorrogação), MVP,
totais do adversário e as estatísticas de cada atleta. Espelha a planilha do técnico.

### Campeonato (`championships`)
Competição ou torneio a que um jogo pertence (inclui "Amistosos"). Identificado por slug
imutável; o nome pode ser renomeado e duplicados podem ser mesclados
([ADR-0007](docs/adr/0007-campeonato-nome-livre-e-mescla.md)).

### Categoria (`teams`)
Grupo de atletas que joga junto (ex.: Masculino Adulto, Sub-19, Feminino Adulto). Pode
ter **idade máxima** em anos completos. Pode ser ativada/inativada. Termo canônico na
UI e na documentação; "time" e "equipe" são sinônimos a evitar
([ADR-0002](docs/adr/0002-categoria-termo-canonico.md)).
Não confundir com: **Ultimate** (o clube) e **Adversário**.

### EFF (eficiência)
`(pontos + rebotes + assistências + roubos + tocos) − (arremessos errados + erros + faltas)`,
igual à planilha do técnico ([ADR-0006](docs/adr/0006-formula-eff.md)). Calculada, não armazenada.

### Elenco (planilha)
Nome do time do clube usado na planilha do técnico ("Ultimate", "Kids", "Blazers",
"Ultimasters", "CG City", "Ultimate 30+"...). No sistema, cada elenco corresponde a uma
**Categoria** (mapeamento em P-22). Não usar "elenco" na UI.

### Escalação (`game_lineups`)
Atletas selecionados para um jogo específico. Só atletas ativos da categoria do jogo.

### Estatísticas do atleta (`game_stats`)
Linha do boletim de um atleta num jogo: rebotes ofensivos/defensivos, assistências,
roubos, tocos, erros, faltas, arremessos de 2 e 3 e lances livres (tentados e convertidos).
Pontos e EFF são derivados. Só em jogo **realizado**.

### Idade (anos completos)
Anos completos entre a data de nascimento e uma data de referência (hoje, no código atual).
Usada no limite da categoria e nos filtros de idade (Sub 16, 17, 18, 19, 20+, ..., 40+).

### Jogo interno
Jogo entre duas categorias do próprio clube (ex.: Blazers × Adulto). Conta vitória/derrota
para cada categoria e uma vitória no total do clube ([ADR-0011](docs/adr/0011-visao-geral-regras-de-contagem.md)).

### Jogo (`games`)
Partida de uma categoria do Ultimate contra um adversário, dentro de um campeonato, com
data e horário. Status **agendado** ou **realizado**
([ADR-0004](docs/adr/0004-status-do-jogo.md)). Estados:
[estados-jogo.mmd](docs/dominio/estados-jogo.mmd).

### MVP (`games.mvp_athlete_id`)
Destaque do jogo, escolhido entre os atletas com estatísticas lançadas. O sistema sugere o
de maior EFF; o técnico pode trocar ([ADR-0005](docs/adr/0005-mvp-por-eff.md)).

### Placar (`our_score`, `their_score`, `q1..q4`, `ot`)
Placar final do Ultimate e do adversário (obrigatório para marcar realizado) e placar por
quarto + prorrogação (opcional, no boletim). **Placar oficial = soma do boletim** quando há
boletim ([ADR-0011](docs/adr/0011-visao-geral-regras-de-contagem.md)).

### Posição
Uma de: Armador, Ala-Armador, Ala, Ala-Pivô, Pivô.

### Técnico
Único ator do sistema hoje: cadastra atletas, categorias, jogos, escalação e boletim. Não há
login (ver P-01).

### Resumo anual (Visão geral)
Consolidação de um ano civil: por categoria (jogos, vitórias/derrotas/empates, pontos
pró/contra, médias, histórico de jogos) e por jogador (totais e médias do boletim), com
exportação para Excel. **Resumo geral** = mesmo consolidado somando todos os anos.
Regras em [ADR-0011](docs/adr/0011-visao-geral-regras-de-contagem.md).

### Totais do adversário (`games.opp_*`)
Estatísticas agregadas do time adversário no jogo (rebotes, assistências, arremessos...),
preenchidas como total porque não há dados jogador a jogador do adversário.

## A definir

| # | Pergunta | Default provisório | Origem |
|---|---|---|---|
| P-01 | O sistema precisa de login? Só o técnico usa, ou há outros perfis (auxiliar, atleta só leitura)? | Sem login; um único ator (Técnico). ⚠ confirmar | Protótipo: tela "Acesso do treinador" (e-mail/senha) e "Téc. João Grabalos · Treinador principal"; código sem auth |
| P-02 | "Categoria", "Equipe" e "Time" são a mesma coisa? | Sim; "Categoria" é o termo canônico na UI. ⚠ confirmar | `lib/validation.ts` ("Selecione ao menos uma equipe"), rota `/times`, protótipo "Times cadastrados no clube" |
| P-03 | Atleta pode estar em mais de uma categoria ao mesmo tempo? | Sim (código vence). ⚠ confirmar | `athletes.teams` é array; protótipo tem 1 categoria por atleta |
| P-04 | A idade máxima da categoria é verificada em que data: hoje, data do jogo ou início da temporada? | Hoje, só no cadastro/edição do atleta. ⚠ confirmar | `ageLimitError` usa `todayISO()`; atleta que faz aniversário "sai" da Sub-X no meio do campeonato |
| P-05 | Ao reduzir a idade máxima de uma categoria, atletas já vinculados que passam do limite saem dela? | Não; o limite só vale para novos vínculos e edições. ⚠ confirmar | `PUT /api/teams/[id]` não revalida atletas |
| P-06 | Dá para corrigir escalação/boletim de um jogo antigo em que jogou um atleta hoje inativo ou fora da categoria? | Deveria: aceitar atletas que já constam no jogo, mesmo inativos. Hoje a API recusa. ⚠ confirmar | `PUT /api/games/[id]/stats` e `/lineup` exigem atleta ativo e na categoria **hoje** |
| P-07 | Um jogo realizado pode voltar para agendado? O que acontece com estatísticas, MVP e avisos já gravados? | Bloquear a volta enquanto houver estatísticas. ⚠ confirmar | `PATCH /api/games/[id]` aceita qualquer status; dados ficam órfãos de sentido |
| P-08 | Pode trocar a categoria de um jogo que já tem escalação/estatísticas? | Bloquear se houver escalação ou estatísticas. ⚠ confirmar | `PATCH /api/games/[id]` troca `team` sem checar dependentes |
| P-09 | Placar final, soma dos quartos e soma dos pontos dos atletas precisam bater? | **Parcial (2026-10-05):** o placar oficial é a soma do boletim (ADR-0011). Falta decidir se o cadastro avisa quando divergem: default não bloquear, só avisar. ⚠ confirmar | Planilha 2018: final 938 × boletim 944 × TOTAL ANO 893 |
| P-10 | MVP é o de maior EFF ou o cestinha? | Maior EFF como sugestão, técnico decide (código vence). ⚠ confirmar com técnico | Protótipo: "Cestinha / MVP" = maior pontuação; código: sugestão por EFF |
| P-11 | Número da camisa deve ser único dentro da categoria? | Não validar. ⚠ confirmar | Sem regra no código nem no protótipo |
| P-12 | Adversário vira cadastro (lista reaproveitável) ou continua texto livre? | Texto livre. ⚠ confirmar | Protótipo tem "Adversários" + "+ Cadastrar"; código usa texto por jogo (risco de duplicata, como já ocorreu com campeonatos) |
| P-13 | Precisa registrar local/ginásio do jogo? | Não, fora do escopo. ⚠ confirmar | Protótipo mostra "Ginásio Guanandizão"; código não tem campo |
| P-14 | O que mostra a "Visão geral" e como se calcula "aproveitamento"? | Como no protótipo: por campeonato e ano, jogos na temporada, aproveitamento = vitórias ÷ jogos realizados, média de pontos, cestinha, comparativos PPG/RPG/APG/SPG. ⚠ confirmar | Menu "Visão Geral" sem tela (`lib/nav-items.ts`, `href: null`) |
| P-15 | "Análise com IA" entra no escopo? | Fora do escopo. ⚠ confirmar | Protótipo: "Análise com IA · Em breve · Gerar análise" |
| P-16 | Importação de atletas por planilha: quais colunas? "Ano de entrada" vira qual data? | Colunas do protótipo (Nome, Posição, Número, Ano de entrada); ano vira 01/01 do ano. ⚠ confirmar | Protótipo: tela de importação XLS; app: "Importação em breve"; código exige data de entrada completa |
| P-17 | Os 3 jogos de 2019 sem campeonato identificado e os nomes sem cadastro (João Luiz, João Green, Rafa Silva, Rodrigo, Wesley, Marcius, Machado, Nélio, Paulo, Leo/Léo/Léozão, Big/Big David/Davi) serão importados? | Ficam de fora até o técnico confirmar. | `scripts/import-games-2019.mjs` (cabeçalho), `docs/ultimate_basketball_2019.json` (`games_extra`) |
| P-18 | Dados históricos importados têm rebotes só no total (gravados como defensivos), horário fictício 19:00 e datas estimadas (2019). Isso precisa aparecer na tela ou ser corrigido? | Datas fictícias **mantidas** (2026-10-05); falta decidir se a tela marca "data estimada". ⚠ confirmar | `scripts/import-games-2018.mjs`, `docs/ultimate_basketball_2019.json` (`obs`, `data_ficticia`) |
| P-20 | A EFF média do perfil do atleta deve descontar faltas, como a EFF por jogo? | Sim; tratar como bug e somar `fouls` na média. ⚠ confirmar | `getAthleteAverages` em `lib/stats-repo.ts` usa `fouls: 0` (não soma faltas), divergindo de `computeEff` e da [ADR-0006](docs/adr/0006-formula-eff.md) |
| P-21 | 🔔 **Lembrete: confirmar com o técnico.** O resumo anual deve trazer as métricas extras da planilha: duplo-duplo (D.D), triplo-duplo (T.D), jogos com 20+/25+ pontos (P+20, P+25), 10+/15+/20+ rebotes (R+10, R+15, R+20), 10+ assistências (A+10), EFF 20+ e colocação no campeonato? | Fora por enquanto (decisão de 2026-10-05). | Aba "Scout Atletas" (TOTAL ANO) e "Scoutt Geral" (colocação) |
| P-22 | Qual categoria do sistema recebe os jogos de cada elenco da planilha? | **Parcial (técnico, 2026-10-05):** Ultimate 25+, 30+ e 40+ → `master`; Sub 25 **não** vira categoria (default: jogos vão para `adulto` ⚠ confirmar). Proposta para o resto: Ultimate → `adulto`; Blazers → `blazers`; CG City → `cg-city`. **Faltam:** Ultimasters (default `master` ⚠), Kids e Ufms (sem equivalente ⚠). Consequência: os jogos de 2019 da Copa Maringá 25+ e da Copa Cuiabá 30+, hoje em `adulto`, devem ir para `master` (script na importação) | Categorias no banco: Adulto, Blazers, CG City, MASTER, Nível 1/2/3, Sub 16/18/20 |
| P-23 | Como registrar um jogo interno para ele aparecer nas duas categorias? | Duas linhas em `games` (uma por categoria, placar espelhado) ligadas por um identificador comum; o total do clube conta uma vez. ⚠ confirmar na decomposição | ADR-0011; `games.team` guarda uma categoria só |
| P-19 | Treinos, presença e mensalidades fazem parte do sistema? | Fora do escopo até virar épico próprio (precisa de grilling dedicado). | Nenhuma fonte (protótipo, código ou dados) menciona |
