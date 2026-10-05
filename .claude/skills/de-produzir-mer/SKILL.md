---
name: de-produzir-mer
description: >-
  Gera o MER (`MER.md`) como `erDiagram` Mermaid sintaticamente válido a partir do
  inventário de entidades travado, no dialeto de `drizzle-from-mermaid-erd`.
  Acione via `design-entidades` ou `/de-produzir-mer` ao pedir "gerar/produzir o
  MER", "extrair o ERD/diagrama entidade-relacionamento", "montar o modelo de
  entidades em Mermaid" ou preparar o MER para gerar as tabelas Drizzle.
---

# de-produzir-mer: produção do MER (erDiagram Mermaid) a partir do inventário

**Skill-folha operacional de produção da Etapa 3.** Entrada: o **inventário de
domínio já consolidado e travado** por `de-revisar-entidades-regras`
(`<RAIZ_DESIGN>/_revisao/inventario-de-entidades.md`, `pronto_para_mer: true`), e,
no máximo, uma **leitura dirigida** de um trecho citado pela localização relativa do
mapa (gramática das âncoras `sec:`/`sym:`/`route:`/`fn:`/`class:`/`mod:`/`linha:` em
`../mapa-artefatos-base/references/schema-mapa-artefatos.md`) para confirmar um ponto
ambíguo. Processo: extrai do inventário os alvos de
modelagem (**ENT, ATR, REL, cardinalidade**), resolve lacunas devolvendo dúvidas,
monta o `erDiagram` no dialeto a jusante e **auto-aplica o checklist sintático antes
de gravar**. Saída: **um único artefato**: o **MER** em `<RAIZ_DESIGN>/MER.md`, um
`erDiagram` Mermaid válido com cabeçalho de procedência, rastreabilidade
entidade→fonte e a **tabela entidade→slug** (índice que `de-produzir-entidade` e
`de-produzir-relacionamento` usam). O MER é a **fonte única de entidades e
cardinalidades** do design; não escreve em outro artefato e o handoff a jusante é
**sinalizado**, nunca encadeado.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico do MER:**

- **Dialeto fiel.** O `erDiagram` segue **exatamente** a gramática do dono
  `../drizzle-from-mermaid-erd/references/mermaid-erd-spec.md`; antes de gravar, a
  skill auto-aplica o checklist sintático dele, o MER só grava **se passaria no GATE 1
  do consumidor** (Fase 5).
- **Procedência e rastreabilidade.** `MER.md` abre com a procedência e traz o
  bloco entidade→fonte + a tabela entidade→slug; o **sha256 não é duplicado** aqui,
  vive no mapa. Detalhe na Fase 6.
- **Não corrige cruzado.** Divergência do inventário (ex.: cardinalidade que não
  fecha) → **devolve ao orquestrador**; nunca harmoniza nem reescreve inventário/mapa/
  fontes.
- **Handoff não-encadeado.** Apenas **sinaliza** ao orquestrador (Fase 7); a
  oferta ao humano, sob aprovação explícita, é do orquestrador.

Cada fase é um **GATE**: só avance quando a atual estiver resolvida; gate que falha →
**encerre** (ou devolva a dúvida ao orquestrador) **sem** gravar um MER parcial/inválido.

---

## Workflow (siga as fases em ordem)

### Fase 1: Validação do inventário (entrada)

Receba do orquestrador o **inventário** (em geral
`<RAIZ_DESIGN>/_revisao/inventario-de-entidades.md`); **não escaneie** o repo atrás
dele, se nenhum inventário/local foi indicado, **devolva a dúvida ao orquestrador** e
aguarde. Valide-o contra
`../de-revisar-entidades-regras/references/criterios-validacao-entidade.md` (§3.6):
`schema_version` compatível, manifesto presente, contadores coerentes, toda entidade
com `id`/`nome`/`papel_dominio`/origem, relações com participantes existentes, RN com
`aplica_a` coerente. Confirme em especial:

- **`pronto_para_mer: true`**, inventário liberado pelo gate de prontidão (sem lacuna
  **bloqueante** aberta).
- Cada entidade com `estados` tem `modelagem_estado.decisao` **congelada**: o
  MER não desenha estados, mas a decisão `sub-entidade-historico` **introduz uma
  entidade** (`modelagem_estado.sub_entidade`) que o MER **deve conter**.

**GATE 1:** inventário **ausente/ilegível** → encerra e direciona a
`/de-revisar-entidades-regras` (e `/de-revisar-mapa` antes, se o mapa estiver
desatualizado), sem fragmento de MER; **`schema_version` incompatível** → encerra com
mensagem clara (não adivinha); **`pronto_para_mer: false`** ou inválido contra o schema
→ **não produz** e devolve ao orquestrador o motivo.

### Fase 2: Extração guiada pelos alvos (ENT, ATR, REL, cardinalidade)

Do inventário **já consolidado** (sem reler fontes), extraia o material do MER
(semântica de ENT/ATR/REL em
`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`):

- **Entidades (ENT):** uma por seção `entidade:`, guarde `id` (slug), `nome` e a
  `origem`. **Inclua também as sub-entidades de histórico** declaradas em
  `modelagem_estado.sub_entidade` (decisão `sub-entidade-historico`): são entidades do
  MER, com origem herdada da entidade-mãe + a decisão de modelagem.
- **Atributos (ATR):** os `atributos[]` de cada entidade (`nome`, `tipo` quando
  evidenciado); identifique o(s) **candidato(s) a PK** (Fase 3).
- **Relações (REL):** uma por seção `relacao:`, as duas entidades (`entidades`,
  alfabéticas), a `cardinalidade` (`1:1`/`1:N`/`N:M`) e, se `n_aria: true`, a marca de
  aridade > 2 (Fase 3). Atributos de ligação alimentam a representação de N:M.

Os **slugs vêm prontos do inventário** (`entidade.id`: minúsculo, sem
acento, kebab-case, singular), a skill **reusa**, não recalcula nem renomeia.

**GATE 2:** se o inventário, apesar de `pronto_para_mer: true`, não trouxer uma
entidade/relação rastreável que o MER claramente precisaria (incoerência interna, ex.:
relação que cita entidade inexistente), **não invente**: devolve ao orquestrador como
divergência do inventário (candidata a `/de-revisar-entidades-regras`).

### Fase 3: Resolução de lacunas de modelagem (zero presunção)

Garanta que **tudo que o `erDiagram` exige** está evidenciado. Agrupe e **devolva ao
orquestrador** toda lacuna abaixo: **não** preencha por conta própria:

- **PK por entidade.** Sem identificador evidenciado (nenhum `id`/chave clara e nenhuma
  convenção registrada no inventário) → devolve a dúvida ("qual a PK de `<entidade>`?");
  **não** cria um `id` presumido.
- **Tipo de atributo.** O bloco Mermaid exige `tipo` **e** `nome`. Atributo com
  `tipo: null` (lacuna não-bloqueante) que entra no bloco → **agrupe** e **devolva a
  dúvida** (definir o tipo ou confirmar que fica **fora** do bloco); **não** mapeie para
  tipo padrão.
- **Cardinalidade.** Toda relação binária precisa de `cardinalidade ∈ {1:1, 1:N, N:M}`.
  Relação que chegou como **lacuna aceita** sem cardinalidade
  (`prontidao.status: lacuna-aceita`) → **devolva a dúvida**; o MER não desenha uma
  linha de relacionamento sem classe.
- **N:M e N-ário.** N:M **binário** é representável direto no `erDiagram`
  (`}o--o{`; a tabela associativa é decisão do consumidor a jusante). Relação
  **N-ária** (`n_aria: true`, aridade > 2) precisa virar **entidade associativa +
  relações binárias** no MER (fonte única de entidades): **proponha** o nome/slug da
  associativa (derivado das participantes) e **devolva ao orquestrador para
  confirmação**, não materialize a associativa silenciosamente.

**GATE 3:** havendo **qualquer** lacuna de modelagem, **devolva a lista agrupada** e
**pare**: **nenhum** MER é montado/gravado nesta passagem. Só prossiga quando o
orquestrador re-entregar as definições. Lacuna que o humano **aceitou** (ex.: atributo
sem tipo fica fora do bloco) é registrada como tal e **não** trava mais.

### Fase 4: Montagem do `erDiagram`

Com tudo definido, monte o `erDiagram` **estritamente** conforme
`../drizzle-from-mermaid-erd/references/mermaid-erd-spec.md` ("Sintaxe de
relacionamento", "Cardinalidades válidas" e "Como ler cardinalidade para modelagem",
**a tabela cardinalidade↔notação está lá**, não a reproduza):

1. Inicie o bloco com `erDiagram`.
2. **Uma linha de relacionamento por relação**, com a notação **espelhada** da classe
   do inventário (`1:1`→`||--||`, `1:N`→`||--o{`, `N:M`→`}o--o{`) e **rótulo
   obrigatório** após `:` (use a `semantica` da relação, em forma curta/`snake`).
   - **Linha sólida `--`** é o padrão; **tracejada `..`** (não-identificante) **apenas**
     quando a semântica evidenciar existência independente. Se a natureza
     **identificante** (FK integrando a PK → PK composta) for ambígua **e** mudar a PK,
     isso é lacuna de Fase 3 (devolve dúvida), não palpite aqui.
   - A optionalidade fina (`o{` "zero-ou-muitos" vs `|{` "um-ou-muitos") usa a forma
     **mais permissiva** por padrão, refinada à mandatória **só** quando a participação
     mínima é evidenciada, **sem** alterar a **classe** (1:1/1:N/N:M) de que o consumidor
     depende, que **nunca** é presumida.
3. **Blocos de atributos** por entidade: `tipo nome restricao`, com `PK`/`FK`/`UK`
   conforme definido. Toda entidade tem **≥ 1 atributo PK**. Inclua as **sub-entidades
   de histórico** como entidades próprias, com sua FK para a entidade-mãe (relação
   binária correspondente).
4. **N-ário confirmado** (Fase 3): inclua a **entidade associativa** aprovada + as N
   **relações binárias** dela para cada participante (`relations/` a jusante permanece
   sempre binário).

Não adicione entidade, atributo, relação ou chave que não venha do inventário (ou de
uma definição re-entregue pelo orquestrador).

**GATE 4: Montagem fiel ao inventário.** O `erDiagram` reflete **apenas** o que o
inventário (ou uma definição re-entregue) evidencia. Se faltar algo necessário ao
montar (PK, tipo, cardinalidade, associativa de N-ário), **volte ao GATE 3** e devolva
a dúvida, **nunca** improvise entidade/atributo/chave no diagrama.

### Fase 5: Validação sintática (auto-aplicação do checklist: GATE de gravação)

**Antes de gravar**, percorra sobre o `erDiagram` montado os checklists de
`../drizzle-from-mermaid-erd/references/mermaid-erd-spec.md`, o **"Checklist de
validação sintática (Fase 1)"** (começa com `erDiagram`; toda relação usa cardinalidade
**válida** e tem **rótulo** após `:`; chaves `{`/`}` balanceadas; todo atributo tem
**tipo e nome**; entidades citadas declaradas; sem nomes/atributos duplicados) **e** o
**"Checklist de completude (Fase 2)"** (cada entidade com **PK identificável**;
cardinalidades interpretáveis; tipos suficientes para as colunas). **Não reproduza** os
itens aqui, o dono é o reference.

**GATE 5:** se **qualquer** item falhar, **NÃO grave**. Reporte ao orquestrador o
**trecho problemático, a linha (se disponível) e o porquê**; se a falha for uma lacuna
de modelagem, **devolva a dúvida** (volta ao GATE 3). O MER só é gravado quando passaria,
sem retrabalho, no **GATE 1 do consumidor** a jusante.

### Fase 6: Gravação do `MER.md` (procedência + rastreabilidade + tabela slug)

Grave **um único arquivo** em `<RAIZ_DESIGN>/MER.md`, **idempotente** (sobrescreve só o
alvo), com esta estrutura:

1. **Cabeçalho de procedência**, primeiro bloco do arquivo:

   ```yaml
   procedencia:
     schema_version: 1            # artefato de fronteira
     skill_geradora: de-produzir-mer
     gerado_em: <ISO-8601 UTC>
     escopo: full | incremental:<subconjunto>
     fontes:                      # caminhos relativos das fontes (união das origens do inventário); SEM sha256 (vive no mapa)
       - requisitos/pedidos.md
       - prototipo/
     inventario_fonte: docs/entities/_revisao/inventario-de-entidades.md
   ```

2. O **`erDiagram`** validado (bloco ` ```mermaid `).
3. **Bloco de rastreabilidade entidade→fonte**, uma linha por entidade, reusando a
   `origem` do inventário (`fonte + localização relativa`), sem reproduzir conteúdo:

   ```
   | Entidade | Slug | Fonte(s) (localização relativa) |
   |----------|------|---------------------------------|
   | Pedido   | pedido | requisitos/pedidos.md#sec:entidades; prototipo/ → sym:lib/schema.ts#class:pedidos |
   ```

4. **Tabela entidade→slug (índice)**, o índice canônico que `de-produzir-entidade`
   e `de-produzir-relacionamento` usam para nomear `descriptions/<slug>.md` e
   `relations/<slug_e1>_<slug_e2>.md`. (Pode ser a mesma tabela do item 3, desde que a
   coluna `Slug` esteja presente.)

**Antes de persistir**, **revalide** que o conteúdo gravado bate com o `erDiagram`
aprovado na Fase 5, que todo slug do índice corresponde a uma entidade do diagrama e que
a procedência lista as fontes corretas. O MER **não** duplica o sha256.

**GATE 6:** grava **somente** o MER completo e validado; índice/procedência incompletos
→ **não** persiste e devolve o que falta. Não toca inventário, mapa nem fontes.

### Fase 7: Sinalização do handoff a jusante (não-encadeado)

Devolva ao orquestrador um **veredito pequeno**: caminho do `MER.md`; contagem de
entidades/relações; resultado do checklist sintático (PASSOU); lista de eventuais
dúvidas/itens devolvidos; e a **sinalização de que o handoff está disponível**.

O handoff do MER para `drizzle-from-mermaid-erd` (atualizar as tabelas Drizzle em `lib/schema.ts`) **não é
automático** e **não é acionado por esta skill** (sem `Task` aninhado): a skill
apenas **informa** que o MER produzido **passa no GATE 1 do consumidor** e cita o
contrato de `references/handoff-drizzle.md`. Quem **oferece** o handoff ao humano,
**sob aprovação explícita**, é o **orquestrador** (`design-entidades`, Fase 5).

**GATE 7:** **nunca** acione `drizzle-from-mermaid-erd` por conta própria; apenas
sinalize. Sem aprovação, o fluxo encerra com o `MER.md` pronto sob `RAIZ_DESIGN`.
