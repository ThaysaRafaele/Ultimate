# Taxonomia dos 9 alvos fixos de informação

> **Fonte única.** Esta é a definição **canônica e fechada** dos alvos de
> informação que toda skill de classificação procura nos artefatos e que toda
> skill de análise/produção consome. Nenhuma outra skill redefine esta taxonomia;
> elas a citam por caminho relativo
> (`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`).
>
> **Vocabulário FECHADO.** São exatamente **9** alvos, com **9** códigos curtos
> estáveis. Acrescentar um 10º alvo, renomear um código ou mudar uma definição de
> forma incompatível **exige bump de `schema_version`** (ver
> `schema-mapa-artefatos.md` → "Contrato de versão"). Até lá, todo achado é
> classificado por **um** destes 9 códigos; um achado que não caiba em nenhum
> **não é inventado** como novo alvo, vira dúvida devolvida ao orquestrador
> (zero presunção).

## Tabela canônica

| Código | Alvo                              | Definição resumida                                                              |
|--------|-----------------------------------|---------------------------------------------------------------------------------|
| `REQ`  | Requisitos                        | Necessidades funcionais/não-funcionais que o sistema deve satisfazer.           |
| `RN`   | Regras de negócio                 | Restrições/políticas de domínio que condicionam dados e comportamento.          |
| `ENT`  | Entidades                         | Objetos de domínio com identidade própria.                                      |
| `ATR`  | Atributos de entidades            | Propriedades/campos de uma entidade.                                            |
| `ACT`  | Ações de entidades                | Operações sob ou causadas por uma entidade (criar, aprovar, cancelar…).         |
| `EST`  | Mudança de estado de entidades    | Transições de status/estado (caso particular de ACT que altera o estado).       |
| `REL`  | Relação entre entidades           | Ligação entre duas (ou mais) entidades, com cardinalidade.                      |
| `ATOR` | Atores                            | Quem usa o sistema / é entidade / influencia/altera/atua sob entidades.         |
| `FLX`  | Fluxos / casos de uso             | Casos de uso do sistema com influência sobre entidades.                         |

Os códigos da coluna `Código` são o **vocabulário** usado em `alvos_presentes[]`,
`alvos_examinados[]` e na coluna `Alvo` da tabela "Achados por alvo fixo" do
schema. Não use sinônimos, plurais ou traduções, apenas estes 9 literais.

---

## Detalhe por alvo (pistas, fronteira e localização)

Para cada alvo: **pistas de detecção** em texto e em código, **fronteira** (o que
NÃO é, incluindo coincidências/inclusões) e a **âncora de localização** preferida.
A definição resumida está na tabela canônica acima; a gramática completa de âncoras
vive em `schema-mapa-artefatos.md` §4.

| Código | Pistas em texto | Pistas em código | Fronteira ("o que NÃO é") | Localização |
|--------|-----------------|------------------|---------------------------|-------------|
| `REQ`  | verbos deônticos ("deve", "precisa", "é obrigatório"); seções Requisitos/Escopo/Critérios de aceitação; "RF-01"/"RNF-02"; histórias "Como X, quero Y, para Z". | em geral **inferido** de comportamento implementado (rota que cumpre uma necessidade), só com conf. `media`/`baixa` + nota de inferência. | ≠ RN (requisito = "deve calcular o desconto"; RN = "10% acima de R$ 500"); ≠ FLX (necessidade ≠ sequência que a realiza). | texto: `sec:<slug>` (ou `linha:`); código: `sym:` da unidade que evidencia. |
| `RN`   | "somente se", "no máx/mín", "não pode", "exceto", %, prazos, fórmulas, faixas, políticas de aprovação/alçada; "RN-03". | validações (`if`/`raise`/`assert`, funções `validate*`, `unique()`/`.notNull()`), guardas de permissão, cálculos com constantes, máquinas de estado que recusam transições. | ≠ REQ (ver acima); ≠ ATR (a regra **condiciona** o campo; o campo é ATR). **Cidadã de 1ª classe**: não morre no mapa: vai ao inventário e às descrições. Regra que governa transição anda junto de um EST mas é registrada como RN (cite o EST no `Resumo`). | onde a regra é **enunciada** (frase/seção; validator/constraint/guard). |
| `ENT`  | substantivos de domínio recorrentes; glossário; entradas de diagrama ER/UML; "cadastro de X"; seção dedicada a um conceito. | tabela `pgTable` em `lib/schema.ts`; nome de tabela em migration; recurso REST (`/usuarios`); store/módulo de domínio no front. | ≠ ATR (a ENT tem identidade própria). **Coincide com ATOR** quando o ator também é entidade persistida (ex.: Usuário) → registre **nos dois** (ver desambiguação). | texto: seção/diagrama; código: `class:<nomeDaTabela>` ou `mod:<caminho>`. |
| `ATR`  | listas de campos ("cliente possui nome, CPF, e-mail"); tabelas de atributos; campos de formulário no protótipo. | colunas `pgTable` (`text`/`integer`/`date`...); propriedades TS/tipos; campos de form (`<input>`/`<select>`). | ≠ ENT (sem identidade própria; se ganhar ciclo de vida/relações, reconsidere como ENT); ≠ RN (tipo/limite é RN). **Pertence sempre a uma ENT**, registre qual. | `class:<Nome>` da ENT dona (campo citado no `Resumo`). |
| `ACT`  | verbos de operação ("o gestor aprova a solicitação"); botões/ações do protótipo ("Enviar", "Cancelar"); casos de uso descritos. | endpoints/rotas (`POST /api/pedidos`, `PUT /api/pedidos/[id]`); funções de repo; handlers de evento no front; `fetch` disparado por componente. | **⊃ EST**: toda EST é ACT, mas só a ACT que **muda o estado** é também EST; ACT que não muda estado (consultar, anexar) é só ACT. ≠ FLX (ação = passo; fluxo = sequência). | a unidade que realiza a ação: `route:<MÉTODO caminho>`, `fn:` ou `class:<Nome>.<metodo>`; texto: seção/passo. |
| `EST`  | diagramas de estado; listas de status ("status possíveis: …"); "passa de X para Y"; "ao aprovar, fica disponível". | atribuição a `status`/`estado`/`situacao`; enums de status; máquinas de estado; transições condicionadas (`if (game.status !== "realizado") ...`). | **⊂ ACT**: marque **também** ACT quando há ação explícita; sem ação (ex.: expiração automática) pode aparecer só, com nota do gatilho. Informa a decisão status-vs-sub-entidade (tomada adiante em `de-revisar-entidades-regras`): aqui **só registra** a transição, não decide o modelo. | onde a transição é definida/implementada (campo `status`; diagrama/seção de estados). |
| `REL`  | "pertence a", "tem vários", "está associado a"; linhas de diagrama ER; tabelas de relacionamento. | `.references()`, coluna `<x>Id`/`<x>_id`, `innerJoin`/`leftJoin` em repo, tabelas associativas; FK em migrations; referências de id entre schemas. | ≠ ATR (a FK é o **mecanismo**; a relação é a **semântica**); ≠ FLX (estrutural ≠ comportamental). **N-ária (>2)**: registrada como REL, mas na produção **sempre** vira entidade associativa + relações binárias. Cite **ambas** as ENT no `Resumo`. | onde a ligação é declarada (coluna `<x>Id`/`.references()` na tabela; frase/linha do diagrama). |
| `ATOR` | "Como <papel>"; perfis ("administrador", "procurador", "cidadão"); matriz de permissões; seções "Atores"/"Perfis". | roles/escopos de autorização; guards/decorators de permissão; `current_user`/dependências de auth; checagem de papel no front (rota protegida, `v-if` por permissão). | **Coincide com ENT** se persistido (registre nos dois); ≠ ENT se externo e não-persistido; ≠ ACT (o ator **realiza** a ação, sujeito ≠ verbo). | onde o papel é definido/exigido (guard/role; seção de atores/permissões). |
| `FLX`  | casos de uso numerados; histórias passo-a-passo; fluxogramas; jornadas do usuário; "primeiro… depois… por fim…". | rota/endpoint que orquestra várias ações; componente/tela que conduz uma jornada; service que coordena várias entidades; no protótipo, a ligação tela→ação→mock de API. | **Composto de ACTs** (e frequentemente EST); a ACT isolada não é FLX; ≠ REQ (necessidade ≠ realização ordenada). Registre no `Resumo` as entidades/atores que toca. | o ponto de entrada do caso de uso (rota/tela/serviço que o inicia; seção/caso de uso). |

---

## Desambiguação (quando dois alvos parecem caber)

A regra geral: na dúvida **entre alvos**, registre o achado no alvo mais
específico e, quando a spec abaixo indicar coincidência, registre nos **dois**
(não escolha arbitrariamente). Conflito de **conteúdo** (não de classificação) não
é resolvido aqui, é apenas sinalizado para a Etapa 2.

### ACT × EST × FLX × REL

| Pergunta-chave                                              | Alvo        |
|------------------------------------------------------------|-------------|
| É um **verbo** aplicado a uma entidade (criar/editar/aprovar)? | `ACT`       |
| Esse verbo **muda o status/estado** da entidade?           | `ACT` **e** `EST` (mesmo achado, dois alvos) |
| É uma **sequência** de ações atravessando entidades/atores? | `FLX`       |
| É uma **ligação estrutural** entre entidades (com cardinalidade)? | `REL`  |

- **EST nunca aparece sozinho** quando há uma ação explícita causando a transição:
  marque `ACT` + `EST`. Se a transição é descrita sem ação (ex.: expiração
  automática por tempo), `EST` pode aparecer só, com nota do gatilho.
- **FLX é a sequência; ACT é o passo.** Um caso de uso com 5 passos é 1 FLX que
  referencia 5 ACTs (alguns também EST).
- **REL é estrutura; FLX é comportamento.** "Pedido pertence a Cliente" é REL;
  "Cliente faz um pedido e o paga" é FLX (que percorre a REL).

### ENT × ATOR

| Situação                                                        | Como registrar         |
|-----------------------------------------------------------------|------------------------|
| Conceito é objeto de domínio persistido **e** usa/atua no sistema (ex.: Usuário, Procurador) | `ENT` **e** `ATOR` (mesmo conceito, dois alvos) |
| Conceito só **atua/influencia** e não é persistido como domínio (ex.: sistema externo, papel sem cadastro) | apenas `ATOR`          |
| Conceito é objeto de domínio que **não age** (ex.: Documento, Lançamento) | apenas `ENT`           |

Quando ENT e ATOR coincidem, registre **as duas linhas** na tabela de achados
(uma com `Alvo: ENT`, outra com `Alvo: ATOR`), ambas apontando para a mesma
localização, e inclua **os dois códigos** em `alvos_presentes[]`. Escolher só um
perderia informação para a etapa de inconsistências e para o inventário.

Sempre que dois alvos coincidem (ACT+EST, ENT+ATOR), as duas linhas usam a **mesma**
localização, cada uma com seu `Resumo` (≤ uma frase) e `Evidência` (≤ 120 chars),
ver `schema-mapa-artefatos.md`.
