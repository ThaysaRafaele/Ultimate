---
name: de-revisar-entidades-regras
description: >-
  Consolida e trava o inventário de domínio (ENT/ATR/ACT/EST/REL/ATOR/FLX + RN
  vinculadas) a partir do mapa validado e das inconsistências decididas, e congela a
  decisão status-atributo vs sub-entidade; persiste
  `_revisao/inventario-de-entidades.md` (handoff do MER). Acione via
  `design-entidades` antes do MER, ou com `/de-revisar-entidades-regras`.
---

# de-revisar-entidades-regras: revisão de entidades/regras e gate de prontidão do MER (Etapa 3, pré-produção)

**Skill da família `design-entidades`, Etapa 3 / pré-produção (roda em subagente).**
Entrada de fronteira: **MAPA validado** (`<RAIZ_DESIGN>/_map/mapa-artefatos.md`)
**+ relatório de inconsistências decidido** (`<RAIZ_DESIGN>/_revisao/relatorio-de-inconsistencias.md`,
nenhum item `decisao: pendente`). Processo, em **duas passagens mediadas pelo orquestrador**:
(A) valida que os requisitos estão harmonizados, **consolida o inventário de domínio**
agrupando os achados do mapa por referência de domínio (ENT/ATR/ACT/EST/REL/ATOR/FLX
**+ RN vinculada**) com **rastreio fonte→item**, aplica os **critérios de prontidão**,
marca as **lacunas** e **propõe** a modelagem de estado de cada entidade: e **para**,
devolvendo ao orquestrador as lacunas bloqueantes e as decisões que exigem o humano;
(B) ao receber de volta as respostas + a validação humana, **congela** cada decisão de
estado, resolve as lacunas e **persiste** o inventário. Saída:
`<RAIZ_DESIGN>/_revisao/inventario-de-entidades.md` (com `schema_version`, rastreio
fonte→item e a decisão de estado congelada por entidade) + **veredito pequeno**. É o
**gate de prontidão do MER**: só libera a produção quando o inventário está completo,
rastreável e sem lacuna bloqueante. É também onde a decisão **status-como-atributo vs
sub-entidade de histórico** é **tomada e congelada uma vez**, `de-produzir-mer` e
`de-produzir-entidade` **consomem sem reler as fontes**.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico da skill:**

- **Nada entra como fato sem origem.** Todo item consolidado (entidade, atributo, ação,
  estado, relação, ator, fluxo, RN) carrega **≥ 1 origem** (`fonte + localização`,
  reusando as âncoras do mapa). Item que não aponta origem **não é fato**: é **lacuna**.
  A definição que o humano dá ao preencher uma lacuna vira origem `humano`.
- **RN é cidadã de primeira classe.** Toda RN do mapa é **vinculada** à entidade/relação/
  fluxo que condiciona (pela referência de domínio do achado), com enunciado curto e
  origem. RN sem alvo de vínculo evidente → **lacuna** ("a que se aplica?"), nunca
  descartada nem deixada solta.
- **Decisão de modelagem de estado é canônica AQUI.** A escolha **status-como-atributo
  vs sub-entidade de histórico** é **tomada e congelada** nesta skill (com `decisao`,
  `justificativa`, `origem`, `decidido_por`). `de-produzir-entidade` **apenas consome**;
  ausência da decisão no inventário faz aquela skill **parar e devolver**, nunca redecidir.
- **Somente-leitura sobre fontes.** Não edita nenhum artefato de origem. Se a
  consolidação revelar uma **divergência real ainda não decidida** (algo que escapou da
  Etapa 2), **não harmoniza**, devolve ao orquestrador a recomendação de
  `/de-analisar-inconsistencias` e **não** persiste sobre conflito aberto. A **única**
  escrita é o inventário (artefato de processo, sob `RAIZ_DESIGN`, gated na Fase 5).
- **Não aciona outras skills.** Falta de reclassificação (mapa desatualizado) →
  nomeia `/de-revisar-mapa`; conflito aberto → `/de-analisar-inconsistencias`; e devolve
  ao orquestrador. Todo fan-out parte e volta ao orquestrador.

Cada fase é um **GATE**: gate que falha → **encerre** (ou devolva a dúvida ao
orquestrador) com mensagem clara, **sem** persistir inventário parcial.

---

## Workflow

### Fase 1: Confirmar requisitos harmonizados (mapa validado + relatório decidido) [Passagem A]

Localize e **leia** (artefatos de processo, pequenos e estruturados, lê-los não viola
a postura; o que se evita é reler as **fontes grandes**):

- o **mapa** em `<RAIZ_DESIGN>/_map/mapa-artefatos.md` e valide-o contra
  `schema-mapa-artefatos.md` (`schema_version` compatível; manifesto; seções; `id` únicos;
  `parte_de`; `total_artefatos`; `alvos_presentes ⊆ alvos_examinados`). Mapa **não validado
  pelo humano** (todas as entradas `revisao_humana.status: pendente`) **não** é base.
- o **relatório** em `<RAIZ_DESIGN>/_revisao/relatorio-de-inconsistencias.md` e valide-o
  contra `tipos-de-inconsistencia.md` (`schema_version` compatível; `total_conflitos`
  coerente). **Exija nenhum item `decisao: pendente`**: todo conflito com a **definição
  final** do humano (`acao ∈ {harmonizado, seguir-com-definicao}`).

Conflito **`seguir-com-definicao`** (fonte intacta, verdade fixada pelo humano) → a
**decisão do relatório prevalece** na consolidação (guarde para a Fase 2). Conflito
**`harmonizado`** (fonte editada, fingerprint mudado) **não** refletido no mapa → mapa
**desatualizado** (caso do GATE 1).

**GATE 1, Requisitos não harmonizados / relatório ausente ou pendente / mapa
desatualizado / `schema_version` incompatível.** **Encerre** e **direcione**: relatório
ausente ou pendente → `/de-analisar-inconsistencias`; mapa desatualizado (fonte
harmonizada não refletida) → `/de-revisar-mapa`. Esta skill **consolida** requisitos já
harmônicos, não harmoniza nem reconcilia.

### Fase 2: Consolidar o inventário por alvo fixo (RN vinculada + rastreio fonte→item) [Passagem A]

Agrupe os achados do mapa **por referência de domínio**, montando o inventário conforme o
template de `references/criterios-validacao-entidade.md §3`. A consolidação é guiada pelas
tabelas "Achados por alvo fixo" do mapa (taxonomia e fronteiras ENT×ATOR/ACT⊃EST em
`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`) e pelas **decisões do
relatório** (que prevalecem): **sem** reler as fontes grandes:

- **Entidades (ENT):** uma entrada por entidade, com `nome`, `slug`, papel no domínio
  e **origem**. Conceito que é **ENT e ATOR** entra como entidade **carregando a faceta de
  ator** (ENT×ATOR da taxonomia), não como duas coisas soltas.
- **Atributos (ATR):** sob a entidade dona, `nome`, `tipo`/`obrigatorio` quando
  evidenciados, **origem** e **RN aplicáveis**. Atributo sem entidade dona clara ou sem
  origem → **lacuna** (Fase 3).
- **Ações e estados (ACT/EST):** ações de cada entidade e, em especial, as **transições de
  estado** (origem→destino + gatilho), com origem. **ACT⊃EST** (toda transição é também
  ação). Aqui **só se registra** o conjunto de estados/transições: o **modelo** é decidido
  na Fase 4.
- **Relações (REL):** uma entrada por relação binária, com as **duas** entidades,
  **cardinalidade** (quando evidenciada), semântica, atributos de ligação e RN. Relação
  **N-ária** (aridade > 2) é registrada como tal + nota "resolver como entidade associativa
  + binárias na produção", a tradução é da skill produtora.
- **Atores (ATOR):** os papéis que atuam sobre cada entidade/ação, vinculados onde atuam.
- **Fluxos (FLX):** uma entrada por caso de uso, com `objetivo`, **atores**, **entidades
  envolvidas**, a **sequência de ações** (ACT/EST) e RN.
- **RN: vínculo obrigatório:** cada RN do mapa é **ligada** à entidade/relação/fluxo que
  condiciona, com enunciado curto e origem; RN sem alvo evidente → **lacuna**.

**Rastreio fonte→item obrigatório:** todo item carrega **≥ 1 origem** (`fonte + localização`,
reusando as âncoras do mapa). Item sem origem **não é fato**: é **lacuna**.

**Confirmação dirigida (somente-leitura), excepcional.** Se um `tipo`/`obrigatorio` de
atributo for genuinamente ambíguo e a evidência do mapa não bastar, abra **apenas** o
trecho citado pela localização, **não** releia o arquivo nem expanda para vizinhos;
protótipo sob `../mapa-artefatos-base/references/seguranca-prototipo.md`. Persistindo a
ambiguidade, **não invente**: registre como **lacuna**.

**GATE 2: Inventário rastreável e enxuto.** Produto = inventário **interno**
estruturado, **todo item rastreado à origem** e **RN vinculada**; nada colado das fontes
além das evidências curtas (≤ 120 chars). Se crescer, **indexe** por entidade/relação/fluxo.

### Fase 3: Aplicar critérios de prontidão e marcar lacunas [Passagem A]

Avalie cada entrada contra os **critérios de prontidão** de
`references/criterios-validacao-entidade.md §1` (por entidade/atributo/relação/fluxo/RN),
**sem re-listá-los aqui**. Para cada critério não atendido, abra uma **lacuna** e
classifique-a, pela régua do §1, como:

- **bloqueante**: impede um MER/descrição coerente (ex.: relação **sem cardinalidade**,
  entidade **sem nenhum atributo com origem**, **RN sem vínculo**, fluxo sem objetivo/ator/
  entidade/sequência);
- **não-bloqueante**, anotação que o design pode carregar (ex.: `tipo` de atributo
  desconhecido, semântica de relação ausente).

**Agrupe** as lacunas por referência de domínio.

**GATE 3: Lacuna bloqueante → pergunta agrupada (fim parcial da Passagem A).** Havendo
**lacuna bloqueante**, a skill **não** força a prontidão: **devolve ao orquestrador**
a lista **agrupada**, com a referência de domínio, a origem (ou sua ausência) e **o que
precisa ser definido**. Lacuna **não-bloqueante** é apenas **anotada** no inventário
(`prontidao.lacunas[]`). Nenhuma lacuna é **inventada como fato** nem **preenchida por
presunção**.

### Fase 4: Resolver a modelagem de estado (status-atributo vs sub-entidade): preparação [Passagem A]

Para cada entidade **com estados (EST)**, determine a **modelagem canônica** conforme a
**rubrica** de `references/criterios-validacao-entidade.md §2`, as três opções
(`atributo-status` | `sub-entidade-historico` | `sem-estado`), seus **sinais de decisão** e
o critério de **ambiguidade** estão **lá** (não re-listados aqui). Monte, por entidade com
estados, a **proposta**: a opção, a **justificativa** (ancorada nos sinais §2.2), a
**origem** e se a escolha é **clara** ou **ambígua**.

**GATE 4: Decisão de estado: ambígua → humano obrigatório (fim da Passagem A).** A skill
**não congela sozinha** uma decisão ambígua: casos **claros** seguem como
**proposta** (a confirmar na Fase 5); casos **ambíguos** (sinais conflitantes) são
**decisão humana obrigatória**: **devolvidos ao orquestrador**. A skill **para** aqui:
devolve, de forma **enxuta**, **(a)** as lacunas bloqueantes (Fase 3) e **(b)** as decisões
de modelagem de estado (claras + ambíguas), e aguarda o orquestrador re-entregar as
respostas e a validação. **Nenhum** inventário é persistido nesta passagem.

### Fase 5: Incorporar respostas e validação humana do inventário [Passagem B]

Reentrada **após** o orquestrador re-entregar **(a)** o **preenchimento das lacunas**
bloqueantes, **(b)** as **decisões de modelagem de estado** (ambíguas resolvidas; claras
confirmadas ou ajustadas) e **(c)** a **validação** do inventário. Para cada resposta:

- **Incorpore** o preenchimento de cada lacuna **com a origem que o humano indicou** (a
  definição humana é a verdade canônica; registre origem `humano` quando não houver fonte
  de requisito). Lacuna que o humano **aceitou deixar em aberto** vira `lacuna-aceita` (não
  bloqueia mais), com nota.
- **Congele** cada decisão de modelagem de estado no inventário conforme
  `criterios-validacao-entidade.md §2.3`: opção final, justificativa, origem e
  `decidido_por` (`humano` quando o humano decidiu/ajustou; `agente` quando uma proposta
  clara foi apenas confirmada). É a decisão **canônica** consumida por `de-produzir-entidade`.
- Se a validação apontar um **conflito real ainda não decidido** (escapou da Etapa 2),
  **não** harmonize aqui: registre e **devolva ao orquestrador** a recomendação de
  `/de-analisar-inconsistencias`, e **não** prossiga à persistência sobre conflito aberto.

**GATE 5: Validação humana antes de persistir.** **Nada é persistido** sem **(a)** toda
lacuna bloqueante **resolvida ou explicitamente aceita**, **(b)** toda decisão de estado
**congelada** e **(c)** a **aprovação** do inventário repassada pelo orquestrador. Sem isso
→ **não grava** e devolve o que falta.

### Fase 6: Persistir o inventário e devolver o veredito [Passagem B]

Persista o **inventário final** em `<RAIZ_DESIGN>/_revisao/inventario-de-entidades.md`
conforme o template de `references/criterios-validacao-entidade.md §3`, com `schema_version`
compatível. Antes de gravar, **revalide** contra as **regras de validação do §3.6**:
origem em todo item; toda entidade com estados com **decisão de modelagem congelada**; toda
relação com **cardinalidade** (ou lacuna aceita); RN **vinculadas** (vínculo mútuo
RN↔alvo); integridade referencial de fluxo; contadores coerentes; nenhuma lacuna
**bloqueante** em aberto.

Devolva ao orquestrador um **veredito pequeno**: nº de entidades/relações/fluxos; decisões
de estado por tipo (`atributo-status` × `sub-entidade-historico` × `sem-estado`); lacunas
**aceitas em aberto**; itens **devolvidos** a `/de-analisar-inconsistencias` ou
`/de-revisar-mapa`; e a sinalização de que o inventário está **pronto para o MER**. Travado,
`de-produzir-mer` e `de-produzir-entidade` **consomem sem reler as fontes**.

**GATE 6: Inventário completo e veredito enxuto.** Persiste só **completo e travado** (sem
lacuna bloqueante aberta, sem decisão de estado faltando, sem conflito aberto); item
pendente → **não** persiste como final e devolve o que falta. Veredito **pequeno**
(contagens + listas), sem colar o inventário nem conteúdo de fonte.
