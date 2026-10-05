---
name: de-classificar-doc
description: >-
  Classifica UM documento de texto (Markdown/`.txt`, história de usuário, doc de
  requisitos ou regra de negócio, diagrama ER/estado em Mermaid) e devolve o
  fragmento com os 9 alvos fixos, ancorados por seção (`sec:`). Acionada por
  `design-entidades` ao extrair os alvos de um documento textual.
---

# de-classificar-doc: classificação de documento de texto por alvo fixo

**Skill-folha da Etapa 1.** Entrada: o **caminho de um único** documento textual
(Markdown, `.txt`, história de usuário, documento de requisitos/regra de negócio, ou
diagrama descrito em markdown/Mermaid), indicado pelo orquestrador/roteador. Processo:
lê o arquivo **uma vez**, mapeia sua estrutura de seções, procura nele os **9 alvos
fixos** (REQ, RN, ENT, ATR, ACT, EST, REL, ATOR, FLX) e ancora cada achado por seção
(`sec:<slug>`). Saída: o **fragmento** no schema canônico do mapa (YAML do artefato +
tabela de achados) + a lista de dúvidas, **devolvidos ao orquestrador** para serem
costurados no mapa. Não escreve no mapa, não decide modelagem, não harmoniza conflitos.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico da folha:** classifica **exatamente o arquivo indicado**, nunca abre, lê
ou classifica vizinhos por iniciativa própria (vizinho relevante vira **observação**, não
expansão de escopo). A `Evidência` de cada achado é trecho **≤ 120 chars** do próprio
documento.

Cada fase é um **GATE**: gate que falha → **encerre** e devolva ao orquestrador o que
impediu (arquivo ausente/ilegível/ambíguo), **sem** fragmento parcial.

---

## Workflow

### Fase 1: Leitura e marca de mudança

Receba o caminho do orquestrador; **não escaneie o repositório** atrás dele. Confirme
que o arquivo existe e é **textual**, leia-o **uma vez** (somente-leitura) e calcule a
**marca de mudança** do conteúdo normalizado (`sha256` hex, `bytes`, `linhas`) conforme
`../mapa-artefatos-base/references/fingerprint-e-delta.md` §1, entra em `marca_mudanca`.

**GATE 1 (existência/legibilidade):**

- Ausente, vazio ou ilegível → **encerre** e devolva caminho + motivo; sem fragmento.
- **Binário/não-textual** chegado por engano (`.png`, `.drawio`, imagem de diagrama) →
  **não presuma conteúdo**: marque `nao-analisavel`, use o **sentinela** de fingerprint
  (§1.4: `sha256` = 64 zeros, `bytes`/`linhas` = 0), registre a natureza em `notas`,
  `alvos_presentes: []`, e devolva para **revisão humana** via orquestrador.

### Fase 2: Reconhecimento da estrutura de seções

Mapeie a estrutura para saber onde cada achado ancora, seguindo
`references/heuristicas-localizacao-secao.md`: headings, títulos numerados (`RF-01`…) e
âncoras explícitas → derive o **slug** (`sec:<slug>`; heading repetido → `sec:<slug>#<n>`;
item solto sem heading → fallback `linha:<n>`). **Bloco de diagrama Mermaid/markdown**
(`erDiagram`, diagrama de estado, tabela de entidade) é tratado **aqui**: seus achados
ENT/REL/ATR/EST ancoram na **seção que o contém** (`sec:<slug>`), não em símbolo de código.

**GATE 2 (estrutura mínima):** sem nenhuma seção identificável → registre a limitação em
`notas` e use `linha:` como fallback; **não invente** seções inexistentes.

### Fase 3: Extração por alvo fixo

Varra o documento procurando **cada um dos 9 alvos** da taxonomia (definição em
`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`). Registre em
`alvos_examinados[]` **todos** os que procurou (em geral os 9), isso distingue "procurei
e não há" de "não examinei". Para cada achado, uma linha de tabela: `Alvo`, `Localização
relativa` (âncora da Fase 2), `Resumo` (≤ uma frase), `Confiança` (`alta|media|baixa`),
`Evidência` (≤ 120 chars). Regras:

- **Coincidências geram duas linhas** com a **mesma** localização: ACT que muda estado →
  `ACT` **e** `EST`; conceito que é entidade e ator → `ENT` **e** `ATOR`. Não escolha um só.
- **História de usuário** ("Como <ator>, quero <objetivo>, para <benefício>") → `REQ` (o
  objetivo) **e** `ATOR` (o papel), na mesma seção.
- **RN é cidadã de primeira classe**: registre regras de negócio explícitas mesmo as
  "óbvias". **Confiança `baixa`** = candidata a inconsistência na Etapa 2.
- `alvos_presentes[]` = só os códigos que **de fato** apareceram numa linha (procurado-e-
  ausente fica em `examinados`, fora de `presentes`, opcionalmente anotado em `notas`).

**GATE 3 (ambiguidade/conflito):** achado que **não cabe** em nenhum dos 9 alvos → **não
invente** um 10º, vira dúvida. Trecho que parece **contradizer** outro artefato →
registre o achado com a confiança adequada e **sinalize** o possível conflito nas dúvidas
(resolução é da Etapa 2). Ambiguidade interna genuína → dúvida ao orquestrador, não palpite.

### Fase 4: Montagem e validação do fragmento

Monte o **fragmento** na forma canônica de
`../mapa-artefatos-base/references/schema-mapa-artefatos.md` §3 (bloco YAML `artefato:` +
tabela de achados), com `tipo: documento` (ou `diagrama`, se o arquivo é um diagrama em
markdown dedicado), `marca_mudanca.fonte: agente`, `revisao_humana.status: pendente`,
`presentes ⊆ examinados` e `notas` quando aplicável (não-analisável, fallback `linha:`,
alvos procurados-e-ausentes relevantes). O `id` é **proposta**: a unicidade global e o
`total_artefatos` são conferidos pelo **orquestrador** ao costurar (o subagente não
enxerga o mapa inteiro).

**Auto-valide** contra as "Regras de validação de entrada" (schema §5) **antes** de
devolver, sem reescrevê-las aqui.

**GATE 4 (validação):** regra do §5 que falhe → **corrija o fragmento** (ou, se a falha
vem de ambiguidade real, transforme em dúvida) e revalide. **Nunca devolva fragmento que
não passaria na validação da skill escritora**, o orquestrador o rejeitaria.

### Fase 5: Devolução enxuta

Devolva, em uma resposta curta: (1) o **fragmento** validado: e **só** isso de conteúdo
classificado; (2) a **lista de dúvidas/observações** separada (alvos não classificáveis,
possíveis conflitos a sinalizar para a Etapa 2, vizinhos que talvez precisem entrar no
escopo sem expandir por conta própria, limitações de localização).

**GATE 5 (retorno enxuto):** sem colar parágrafos do documento nem repetir o
conteúdo lido. Fragmento grande (muitos achados) → **indexe** (uma linha por achado,
evidência curta); se ainda exceder um retorno razoável, devolva o índice e sinalize que o
documento pode merecer ser quebrado em escopos menores pelo orquestrador.
