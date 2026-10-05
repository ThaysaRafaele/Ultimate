---
name: design-entidades
description: >-
  Orquestra o pipeline REQUISITOS → design de domínio em markdown (mapa de
  artefatos → MER → descrições de entidade, relacionamentos e fluxos), com gates
  human-in-the-loop. Acione com `/design-entidades` ou ao pedir "gerar design de
  entidades", "extrair/produzir o MER dos requisitos", "mapear os artefatos de
  requisito", "documentar entidades/relacionamentos/casos de uso" ou "re-executar
  incremental" após mudança nas fontes.
---

# design-entidades: orquestradora do fluxo de design de entidades

Esta é a **skill de entrada** (comando `/design-entidades`). A partir de **artefatos
de requisito** (documentos, histórias, diagramas, regras de negócio e **protótipos**
com mock de API), ela **conduz** o pipeline ponta-a-ponta: **mapa → inconsistências
→ produção de design → handoff opcional**, entregando, sob `RAIZ_DESIGN`, o mapa de
artefatos, o `MER.md`, uma descrição por entidade, um arquivo por relacionamento e um
por fluxo. **Despacha subagentes** para todo o trabalho pesado e mantém no próprio
contexto **apenas** o escopo, o mapa e os retornos enxutos. Ela faz só o **inventário
barato** (decidir o tipo de cada artefato por extensão/estrutura, **sem abrir o corpo**);
**não lê o corpo das fontes, não extrai os 9 alvos, não escreve fragmento e não modela**
por conta própria, a classificação profunda e a produção são de skills da família,
acionadas **por ela** em subagente isolado. Seu papel: **rotear, costurar, aplicar os
gates HITL e perguntar ao humano**.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico do orquestrador:**

- **Único ponto HITL.** Esta skill é o **único ponto onde se pergunta ao humano**: os
  subagentes devolvem dúvidas a ela, que **agrupa** e pergunta. Se **nenhuma fonte foi
  indicada, NÃO escaneia o repo sozinho**.
- **Destinos fixos.** Tudo é escrito **sob `RAIZ_DESIGN`** (default
  `docs/entities`), na árvore interna imutável (`MER.md`, `descriptions/`, `relations/`,
  `flows/`, `_map/`, `_revisao/`). Nunca inventa outro caminho de saída.
- **Contratos versionados.** Ao chamar uma skill de outra etapa, passa o **MAPA /
  MER / inventário / relatório** (artefato de fronteira), **nunca** os artefatos brutos;
  todo leitor valida `schema_version` (incompatível → encerra com mensagem clara).
- **Despacho sem aninhamento.** Nenhum subagente aciona outro (sem `Task`
  aninhado): todo fan-out parte do orquestrador e **volta** a ele para a costura.

Cada fase é um **GATE**: só avança quando a atual está resolvida. Gate que falha (ou
humano que não aprova) → **para e reporta**; nunca prossegue com o que sobrou.

## Modos (GATE 0b)

- **Full**, escopo novo (sem mapa/design prévios): roda o pipeline inteiro (Fases 0→5).
- **Incremental**, já há mapa e design e as fontes mudaram/surgiram: roteia pelo
  caminho incremental, `de-revisar-mapa` calcula o delta das fontes, reclassifica-se
  **só o delta**, e `de-reexecutar-incremental` projeta o impacto reverso e devolve o
  **subconjunto mínimo** a regenerar (o orquestrador reaciona as produtoras só nesse
  subconjunto). Detalhe em `references/pipeline-e-gates.md` → "Caminho incremental".

---

## Workflow (siga em ordem; fan-out paralelo só nas Fases 1 e 4, ver referências)

### Fase 0: Coleta de fontes, modo e inventário barato (GATE 0 + 0b + 0c)

Antes de qualquer leitura de corpo, determine **de onde vêm os requisitos**, **qual modo**
e **o tipo de cada artefato**: o **inventário barato** é feito pelo próprio orquestrador,
sem abrir o corpo dos arquivos.

**Coleta e modo:**

- Usuário **indicou** caminhos → registre-os como **escopo** (`raiz_requisitos`).
- **Não** indicou → **GATE 0: pergunte e aguarde.** Pode **oferecer candidatos**. Neste
  repo: `CONTEXT.md` + `docs/adr/` + `docs/dominio/` (saídas do `grilling-dominio`),
  `_prototype_extracted.html` (protótipo), `lib/schema.ts` + `lib/*-validation.ts` +
  `app/api/` (código), `scripts/*.mjs` (decisões de importação). **Nunca prossegue sem
  confirmação** e **nunca escaneia o repo por conta própria**. Sem escopo confirmado,
  não avance.
- **GATE 0b:** havendo mapa/design prévios e modo não dito → **pergunte** full vs
  incremental (ver "Modos"). Na dúvida, não presuma.
- Caminho inexistente/inacessível informado pelo usuário → **reporte e pergunte** (não
  silencie, não substitua por outro).

**Inventário barato (roteamento).** Confirmado o escopo, percorra **só os metadados
baratos** de cada caminho, `caminho`, `extensão`, `tamanho` e, para diretório, a estrutura
de topo (no máximo uma espiada de cabeçalho: chaves de `package.json`, nome de arquivo de
mock), **nunca o corpo**. Decida o **tipo** e a **folha** que o classificará na Fase 1:

| Tipo | Sinais baratos | Folha |
|---|---|---|
| `documento` | `.md`/`.txt`, história de usuário, doc de regra de negócio | `de-classificar-doc` |
| `diagrama`  | `.mmd`/`.mermaid` ou nome explícito de diagrama (ER/estado) | `de-classificar-doc` |
| `codigo`    | fonte do app (`.ts`/`.tsx`/`.mjs`, migration `.sql`, JSON de dados) | `de-classificar-codigo` |
| `prototipo` | **HTML standalone** de protótipo (ex.: `_prototype_extracted.html`, `Ultimate Gestao*.html`) **ou** diretório de app com mock | `de-classificar-prototipo` |

- **Protótipo HTML = um arquivo, uma linha só.** Os bundles desktop/mobile e o extraído
  são o **mesmo** protótipo em formas diferentes: uma linha para o extraído (legível) e,
  se o humano quiser, uma para o mobile (só diferenças).
- **Protótipo diretório = uma linha só** (caminho com `/` final; **1** chamada a
  `de-classificar-prototipo`, que faz a varredura interna). Pasta de avulsos (ex.:
  `requisitos/` com vários `.md`) → **uma linha por arquivo**. Sinais de app/mock e globs
  de exclusão (`node_modules/`, `dist/`, binários, lockfiles) em
  `../de-classificar-prototipo/references/estrategia-varredura-prototipo.md` §1 e §3.
- O resultado é a **tabela de roteamento** (artefato → `tipo` → folha) que alimenta a
  Fase 1; o orquestrador **não** lê o corpo nem extrai os 9 alvos aqui, isso é das folhas.

**GATE 0c (roteamento):** escopo **vazio/inacessível** → **pare** e reporte (não escaneie o
repo sozinho). **Tipo indecidível** por sinal barato (repo misto sem tipo único; protótipo
**sem mock claro**; extensão/estrutura ambígua) ou **`nao-analisavel`** (binário/imagem) →
**não adivinhe**: agrupe e **pergunte ao humano** antes de classificar. Item indeciso fica
**fora** da tabela até a definição.

### Fase 1: Classificação das folhas (fan-out **paralelo**)

A partir da **tabela de roteamento** (Fase 0), despache as folhas (`de-classificar-doc` /
`-codigo` / `-prototipo`) **em paralelo**: um lote de subagentes concorrentes, **1 por
grupo coeso/arquivo** (o protótipo é **1 única** chamada a `de-classificar-prototipo`).
Granularidade, prompt-template e limites em `references/orquestracao-e-subagentes.md`.
Entrada = **lista de caminhos + 9 alvos** (taxonomia em
`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`) **+ schema do fragmento**;
saída = **fragmento** (YAML + achados) + dúvidas. Subagentes **não perguntam ao usuário**.

**Barreira:** aguarde **todos** os fragmentos do lote antes de costurar.
**GATE 1 (retorno enxuto):** subagente que cola parágrafos/código ou excede o
limite → **rejeite e reinstrua** a resumir/indexar (evidência ≤ 120 chars). Acumule
fragmentos + a lista única de dúvidas; **não** os cole no mapa ainda.

### Fase 2: Montagem do MAPA + GATE de validação humana

**Costure** os fragmentos em `RAIZ_DESIGN/_map/mapa-artefatos.md`, **sem reler os
artefatos**, conforme `references/orquestracao-e-subagentes.md` → "Costura no mapa" e
validando contra `…/schema-mapa-artefatos.md` §5 (id único global, `tipo`/alvos no
vocabulário, `parte_de` válido, `alvos_presentes ⊆ alvos_examinados`, `total_artefatos`
coerente). Toda entrada nova nasce `revisao_humana.status: pendente` /
`marca_mudanca.fonte: agente`. Preserve entradas humanas existentes (não sobrescreva
`fonte: humano` / `status ∈ {aprovado, ajustado}` sem confirmação).

**GATE 2 (validação humana do mapa: HITL):** apresente o mapa (ou resumo enxuto) e
**aguarde**. O humano pode **aprovar**, **ajustar à mão** ou **pedir reclassificação**
de um item → o orquestrador **reaciona** a folha adequada (volta à Fase 1 só para o
item) e recostura. **Não avance sem o mapa validado.**

### Fase 3: Inconsistências (Etapa 2) + GATE

Com o mapa validado, despache **`de-analisar-inconsistencias`** passando o **MAPA** (não
os artefatos). Ela cruza os achados pelos 9 alvos via **localizações relativas**, detecta
contradições **reais** e persiste `_revisao/relatorio-de-inconsistencias.md`.

**GATE 3 (definição humana: HITL):**

- **Zero conflito** → "requisitos harmônicos"; libera a Etapa 3.
- **Há conflito** → apresente o relatório agrupado e **aguarde a definição humana, item a
  item**. Harmonizar um artefato de origem ocorre **dentro de
  `de-analisar-inconsistencias`**, sob **confirmação por item + `.bak` + log** (única
  skill autorizada a editar fontes). Sem confirmação, registra-se
  "seguir-com-definição" e **nada é editado**. Só avança com todos os itens definidos.

### Fase 4: Produção de design (Etapa 3) + GATEs 4a/4b/4c

Só após a Etapa 2 sem pendências. Cada passo é despachado em subagente recebendo o
**MAPA/inventário** (não os artefatos brutos). **A cadeia inventário → MER é
sequencial** (gargalos únicos por desenho, o MER é pré-requisito de todas as
produtoras); **só a produção de entidades/relações/fluxos é paralela**.

1. **Prontidão do MER**, `de-revisar-entidades-regras` consolida o inventário
   (entidades, atributos, ações, estados, **regras de negócio**, atores, fluxos), **toma
   e congela** a decisão *status-como-atributo vs sub-entidade de histórico* e grava
   `_revisao/inventario-de-entidades.md`. **GATE 4a:** lacuna bloqueante / decisão de
   status ambígua → **pergunta ao humano**; validação humana do inventário antes de seguir.
2. **MER**, `de-produzir-mer` consome o inventário e gera `RAIZ_DESIGN/MER.md`
   (`erDiagram`) com procedência e tabela entidade→slug. **GATE 4b:** o MER só é
   gravado se passar no checklist sintático (= GATE 1 do consumidor a jusante);
   cardinalidade/tipo/PK/N:M sem evidência → devolve dúvida → **pergunte**.
3. **Entidades / Relações / Fluxos (fan-out paralelo)**: gravado o MER, despache **em
   paralelo** `de-produzir-entidade` (1/entidade) → `descriptions/<entidade>.md`,
   `de-produzir-relacionamento` (1/relação) → `relations/<e1>_<e2>.md` e
   `de-produzir-fluxo` (1/fluxo) → `flows/<fluxo>.md`. São independentes e idempotentes
   (cada um grava só o próprio arquivo). Detalhe e barreiras em
   `references/pipeline-e-gates.md`.

**Barreira:** aguarde **toda** a produção antes do GATE 4c.
**GATEs 4c (transversais):** **não-edição cruzada do MER** (entidade/relação/fluxo que
descobre divergência **devolve ao orquestrador**, que encaminha a `de-produzir-mer`, o
MER é fonte única de entidades/cardinalidades); **órfãos** (item que sumiu das fontes)
**não são apagados**, reportados ao humano. Apresente o conjunto produzido para conferência.

### Fase 5: Handoff opcional MER → `drizzle-from-mermaid-erd`

**Ofereça** (não encadeie) o handoff do `MER.md` para `drizzle-from-mermaid-erd`
(atualiza as tabelas Drizzle em `lib/schema.ts` e gera a migration). **GATE 5:** só ocorre com **aprovação explícita**; o
MER entregue já deve passar no **GATE 1** do consumidor sem retrabalho. Sem aprovação,
encerra-se aqui, com os artefatos de design prontos sob `RAIZ_DESIGN`.
