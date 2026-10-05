---
name: de-reexecutar-incremental
description: >-
  Re-execução incremental do design: consome o delta de `de-revisar-mapa`, projeta o
  impacto fonte→design pelos cabeçalhos de procedência (cadeia inventário → MER →
  entidades → relações → fluxos) e devolve o subconjunto mínimo a regenerar. Acione
  via `design-entidades` após `de-revisar-mapa`, ou com `/de-reexecutar-incremental`,
  para regenerar só o design afetado.
---

# de-reexecutar-incremental: re-execução incremental do design

**Skill da família `design-entidades`, ramo incremental (roda em subagente).** Entrada de
fronteira: **o mapa reconciliado `<RAIZ_DESIGN>/_map/mapa-artefatos.md` + o delta de
fontes já calculado por `de-revisar-mapa` + os cabeçalhos de procedência** do design prévio
(`MER.md`, `descriptions/*`, `relations/*`, `flows/*`), **nunca** as fontes brutas nem o
fingerprint para recalcular. Processo, em **duas passagens mediadas pelo orquestrador**: (A)
valida pré-condições, **consome** o delta (não recomputa), projeta o impacto reverso
fonte→design pela procedência, monta o **plano incremental** (regenera / mantém / órfãos /
candidatos novos) e o **devolve** ao orquestrador para aprovação humana: e **para**; (B) ao
receber de volta os **manifestos** das produtoras (reacionadas só no subconjunto pelo
orquestrador), reconcilia com o plano e **verifica a consistência** pós-regeneração. Saída:
**plano incremental** (Passagem A) + **veredito de consistência** (Passagem B), retornos
enxutos. Não recomputa fingerprint, não edita fontes e **não grava design nem mapa** (quem
grava são as produtoras e `de-revisar-mapa`).

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico da skill:**

- **Consome o delta, não recomputa.** Há **uma só** lógica de delta, a de
  `de-revisar-mapa`. Esta skill **recebe** o delta classificado
  (`NOVO`/`ALTERADO`/`REMOVIDO`/`INALTERADO`/`ÓRFÃO`, sentinelas §1.4) e **não** recalcula
  `sha256`/`bytes`/`linhas` nem reabre as fontes para hashear. O fingerprint vive **só no
  mapa**; o design guarda apenas a **lista de caminhos** das fontes (procedência), nunca o hash.
- **Projeção de impacto via procedência.** O índice reverso `fonte → artefato` se constrói
  lendo o campo `procedencia.fontes[]` do cabeçalho YAML de cada artefato de design. **Todo**
  artefato cujo `fontes[]` contém um caminho em delta é **candidato a regenerar**. Cabeçalhos de
  procedência são artefatos de **processo** (pequenos): lê-los **não** viola o retorno enxuto; o
  que se evita é reler as **fontes grandes** (que aqui nem são lidas).
- **Cadeia de produção (consumida, não redecidida).** A ordem é **inventário → MER → entidades
  → relações → fluxos**. Delta que toca o **domínio** (ENT/ATR/REL/EST/RN) exige
  **re-consolidar o inventário** em `de-revisar-entidades-regras` (que **recongela** a decisão
  status-como-atributo vs sub-entidade) **antes** do MER; delta que toca só FLX regenera
  só o(s) fluxo(s). Esta skill **projeta** a ordem; não decide conteúdo de domínio.
- **Não aciona produtoras nem revisões.** Devolve ao orquestrador o subconjunto mínimo + a
  ordem; o **orquestrador** reaciona `de-revisar-entidades-regras` / `de-produzir-*` (em
  subagentes próprios, só no subconjunto) e re-entrega os manifestos para a Passagem B.
- **Não edita artefatos de origem.** Se a mudança reintroduzir contradição entre fontes, a
  **harmonização** é **delegada a `de-analisar-inconsistencias`** (única editora, com `.bak` +
  log), via orquestrador.
- **Projetora + verificadora, não escritora.** O design (com o cabeçalho de procedência
  atualizado, `escopo: incremental:<subconjunto>` + `fontes[]` atuais) é **reescrito pelas
  produtoras**; o **mapa**, só por `de-revisar-mapa`. Esta skill **verifica** que isso aconteceu
  e devolve pedidos ao orquestrador, não é segunda escritora do design nem do mapa.
- **`REMOVIDO`/`ÓRFÃO` não são apagados.** Artefato cuja única fonte sumiu vira **órfão** →
  **reportado** ao orquestrador para decisão humana, **nunca** apagado.
- **Schema/versão de fronteira.** Valida o `schema_version` do mapa, MER, inventário e dos
  cabeçalhos de procedência que lê; incompatível → **encerra** com mensagem clara.
- **Escopo da base.** O cenário **`ALTERADO`** é o coberto em detalhe; **`NOVO`** (candidatos
  novos) e **`REMOVIDO`** (órfãos) são tratados pelos mesmos gates de zero presunção (Fase 3).

Cada fase é um **GATE**: gate que falha → **encerre** (ou devolva a dúvida ao orquestrador),
**sem** iniciar regeneração parcial.

---

## Workflow

### Fase 1: Pré-condições: localizar mapa + procedências e validar coerência [Passagem A]

Confirme que veio do **modo incremental** (GATE 0b do orquestrador). Localize o mapa em
`<RAIZ_DESIGN>/_map/mapa-artefatos.md` e os **artefatos de design prévios** (`MER.md`,
`descriptions/*`, `relations/*`, `flows/*`); **leia** o mapa e o **cabeçalho de procedência** (só
o primeiro bloco YAML de cada artefato, processo, pequeno; lê-lo não viola o retorno enxuto).
Valide contra `../mapa-artefatos-base/references/schema-mapa-artefatos.md` (campos, alvos ∈ 9,
`procedencia.fontes[]`, `schema_version`) e o contrato de procedência:

- **`schema_version`** presente e **compatível** no mapa, MER, inventário e em cada cabeçalho de
  procedência. Incompatível → **encerra** com mensagem clara.
- **Procedência utilizável:** cada artefato carrega `procedencia.fontes[]` (e
  `inventario_fonte`; não-MER também `mer_fonte`). Sem isso não há índice reverso para projetar
  impacto.
- **Coerência mapa × design:** as fontes citadas nas procedências existem no mapa
  (entradas/`raiz_requisitos`). Divergência grosseira (design aponta fonte que o mapa
  desconhece) → **dúvida ao orquestrador**, não adivinhação.

**GATE 1: Pré-condições ausentes/inconsistentes.** Sem **mapa reconciliado**, sem **design
prévio**, sem **procedência utilizável** ou `schema_version` incompatível → **não** prossiga
incrementalmente: **devolva** a recomendação de rodar o **full** (`/design-entidades`), ou
`/de-revisar-mapa` antes, se o mapa existe mas o delta não foi calculado. Esta skill **não** cria
design do zero nem recomputa fingerprint.

### Fase 2: Consumir o delta de `de-revisar-mapa` (não recomputa fingerprint) [Passagem A]

Receba do orquestrador o **delta de fontes já calculado** por `de-revisar-mapa` (tabela `caminho
| classe | tipo_sugerido | localizacao | nota`, classes `NOVO`/`ALTERADO`/`REMOVIDO`/`INALTERADO`/
`ÓRFÃO` e sentinelas §1.4 já aplicadas). **Não** recalcule `sha256`/`bytes`/`linhas` nem reabra as
fontes para hashear: a autoridade do delta é
`../mapa-artefatos-base/references/fingerprint-e-delta.md` (classes
`NOVO`/`ALTERADO`/`REMOVIDO`/`INALTERADO`/`ÓRFÃO`, sentinelas §1.4, consumida, nunca recomputada
aqui) e a **fronteira de fontes** atribui o cálculo **exclusivamente** a `de-revisar-mapa`.

- Separe o delta **acionável** (`NOVO`/`ALTERADO`/`REMOVIDO`) do **inerte** (`INALTERADO`, não
  dispara regeneração) e dos **`ÓRFÃO`** (referência interna pendurada, vira relatório, não
  regeneração).
- Para cada `ALTERADO`, preserve a **localização relativa** do trecho (quando o delta a trouxer):
  permite limitar a regeneração ao que mudou e saber se o trecho toca o **domínio** (Fase 3).

**GATE 2: Delta ausente ou nulo.** Sem delta do orquestrador → **devolva** a recomendação de
rodar `/de-revisar-mapa` primeiro (o delta é dela), sem recomputar. Delta acionável **vazio**
(tudo `INALTERADO`) e sem `ÓRFÃO` a reportar → **encerre** devolvendo **"design atualizado, nada
a regenerar"**.

### Fase 3: Projeção de impacto reverso fonte→design (conjunto mínimo) [Passagem A]

Para cada fonte do **delta acionável**, calcule o subconjunto afetado cruzando o **índice
reverso** (procedência) com a **cadeia de produção** (DAG). O resultado é o **conjunto mínimo
a regenerar, ordenado pelo DAG**.

**1. Impacto direto (índice reverso):** todo artefato de design cujo `procedencia.fontes[]`
contém o caminho da fonte em delta é candidato a regenerar.

**2. Invalidação a montante (cadeia de produção):** classifique o que o trecho em delta toca,
lendo a tabela "Achados por alvo fixo" do mapa para aquela fonte/localização:

- **Toca o domínio (ENT/ATR/REL/EST/RN):** o **inventário** é re-consolidado por
  `de-revisar-entidades-regras` (recongela a decisão status-atributo vs sub-entidade) **antes** do
  MER. Se entidades/atributos/
  cardinalidades mudarem, o **MER** é regenerado (`de-produzir-mer`) e a mudança **desce em
  cascata** para as **descrições** das entidades afetadas, as **relações** que as envolvem e os
  **fluxos** que as referenciam. Inclua **só** os artefatos que citam entidades/relações de fato
  alteradas (não o design inteiro).
- **Toca só fluxo (FLX):** regenere **apenas** o(s) `flows/<slug>.md` afetado(s); inventário e
  MER **não** entram.
- **Toca só detalhe de descrição** (ex.: texto de RN de uma entidade, sem mudar o modelo):
  regenere **apenas** a `descriptions/<slug>.md` afetada; MER intacto.

**3. Cenários por classe de delta** (base = `ALTERADO`; demais recomendados):

- **`ALTERADO` (base):** aplica 1 + 2 acima.
- **`NOVO` (recomendado):** fonte nova pode introduzir **entidades/relações/fluxos novos** →
  marque como **candidatos novos** (passam por `de-revisar-entidades-regras` para descobrir
  ENT/REL/FLX → MER → novas descrições/relações/fluxos). Candidatos novos **não** são criados às
  cegas: vão ao plano para **confirmação humana**.
- **`REMOVIDO` (recomendado):** artefato cuja **única** fonte sumiu vira **órfão** → **reportar**
  ao orquestrador (não apaga). Artefato com **múltiplas** fontes em que só uma sumiu →
  **regenera** a partir das fontes restantes (a removida sai do `fontes[]`). Se a fonte removida
  contribuía entidades, o inventário entra na re-consolidação.

**GATE 3: Delta ambíguo / suspeita de rename / harmonização necessária.**
- **Rename** (um `REMOVIDO` de caminho X + um `NOVO` de caminho Y aparentados): a detecção é
  **evolução futura** (`fingerprint-e-delta.md` §4): **não** reconcilie sozinha; **devolva ao
  orquestrador** para o humano confirmar (evita apagar/duplicar design).
- **Localização não mapeável** a alvos (não dá para saber se o trecho toca o domínio): **devolva
  a dúvida** ao orquestrador, não presuma o pior nem o melhor.
- **Necessidade de harmonizar** (a mudança reintroduz contradição entre fontes): **delegue a
  `de-analisar-inconsistencias`** (via orquestrador): esta skill **não** edita fonte.

### Fase 4: Montar e devolver o plano incremental [Passagem A]

Monte o **plano incremental** e devolva-o ao orquestrador de forma **enxuta** para
**aprovação humana**, sem colar conteúdo de fonte:

- **Regenera**: subconjunto mínimo, **ordenado pelo DAG**, com a skill produtora canônica de
  cada item (`de-revisar-entidades-regras` quando o inventário entra; `de-produzir-mer`;
  `de-produzir-entidade`/`-relacionamento`/`-fluxo`) e o **porquê** (qual fonte em delta o
  disparou).
- **Mantém**: o que **não** é tocado (e fica intacto), idealmente como **contagem** (não lista
  exaustiva), evidenciando a economia incremental.
- **Órfãos**: artefatos cuja única fonte foi `REMOVIDO`: **reportados** para decisão humana
  (manter / apagar / reapontar), **nunca** apagados aqui.
- **Candidatos novos**, entidades/relações/fluxos sugeridos por fontes `NOVO`: propostos para
  **confirmação humana** (não criados às cegas).
- **Dúvidas**, ambiguidades acumuladas (Fases 1–3): rename a confirmar, localização não
  mapeável, harmonização a delegar.

**GATE 4: Aprovação humana do plano + retorno enxuto (fim da Passagem A).** Em subagente, esta
skill **não pergunta ao usuário**: **devolve** o plano ao orquestrador, que apresenta ao humano e
colhe a aprovação. **Sem aprovação**, **não** prossegue para a Passagem B (nenhuma regeneração é
disparada). Retorno = **plano + dúvidas** (lista/tabela), **sem** conteúdo de fonte; se grande,
**indexe**.

### Fase 5: Reconciliar os manifestos das produtoras [Passagem B]

Reentrada **após** o orquestrador reacionar, **na ordem do DAG**, as skills do subconjunto
aprovado (`de-revisar-entidades-regras` se o inventário entrou → `de-produzir-mer` se o MER entrou
→ `de-produzir-entidade`/`-relacionamento`/`-fluxo` nos itens afetados), cada uma em **subagente
próprio** (sem `Task` aninhado), e **re-entregar os manifestos**. Para o conjunto recebido:

- **Reconcilie com o plano:** cada item planejado foi regenerado? Apareceu algo fora do plano?
  Divergência → registra para o veredito (Fase 6) e, se relevante, dúvida ao orquestrador.
- **Trate achados cruzados das produtoras:** se uma produtora-folha devolveu **sub-entidade
  nova** (ex.: histórico de status não previsto no MER) ou **divergência de cardinalidade**, isso
  **não** se resolve aqui: **devolva ao orquestrador** como candidato a **nova passagem** por
  `de-revisar-entidades-regras` / `de-produzir-mer` (a folha **não** edita o MER; esta skill
  **não** edita o domínio).
- **Confira a procedência reescrita:** os artefatos regenerados devem trazer, no cabeçalho,
  `escopo: incremental:<subconjunto>` e `fontes[]` atuais (escritos **pelas produtoras**, esta
  skill **não** os reescreve).
- **Marcas do mapa:** se alguma marca do mapa precisar refletir a regeneração, **devolva o pedido
  ao orquestrador** (que roteia para `de-revisar-mapa`, dona do mapa): esta skill **não** grava
  o mapa.

**GATE 5: Divergência estrutural / harmonização tardia.** Produtora que reporte divergência
estrutural (sub-entidade/cardinalidade) exigindo remodelar o domínio → **pause** e **devolva ao
orquestrador** (pode demandar nova passagem por `de-revisar-entidades-regras`/`de-produzir-mer`
antes de concluir). Necessidade de **harmonizar fontes** → **delegue a
`de-analisar-inconsistencias`**: **nunca** edite fonte aqui.

### Fase 6: Verificação de consistência pós-regeneração + veredito [Passagem B]

Antes do veredito final, verifique as **invariantes de consistência** do design regenerado
(somente-leitura sobre os artefatos de processo/design):

- **Integridade referencial:** toda **relação** (`relations/<e1>_<e2>.md`) cita **apenas**
  entidades presentes no MER; o **MER** cita **apenas** entidades com `descriptions/<slug>.md`
  correspondente (ou a lacuna é **reportada**, não "consertada"); nenhum **fluxo**
  (`flows/<slug>.md`) referencia entidade/ator inexistente no MER.
- **Procedência atualizada:** cada artefato regenerado lista as **fontes atuais** e `escopo:
  incremental:<subconjunto>`; nenhum aponta ainda uma fonte `REMOVIDO`.
- **Escopo mínimo respeitado:** **nenhum** artefato **fora** do subconjunto aprovado foi tocado
  (a economia incremental se confirma); artefatos `INALTERADO` intactos.
- **Órfãos e candidatos:** pendências de órfão/candidato novo permanecem **abertas como decisão
  humana** (não foram resolvidas silenciosamente).

Devolva ao orquestrador um **veredito pequeno**: o que foi regenerado, o que permaneceu,
invariantes OK/violadas e a lista de pendências (órfãos, candidatos, dúvidas). Falha de invariante
→ **reporta** (não conserta sozinha; pode exigir nova passagem).

**GATE 6: Consistência pós-regeneração.** O incremental só é dado por **concluído** quando as
invariantes passam (ou a violação foi **reportada** com clareza ao orquestrador). Esta skill
**não** edita artefato para "forçar" consistência: ela **verifica e reporta**.
