---
name: de-produzir-relacionamento
description: >-
  Gera UM arquivo de relacionamento (`relations/<e1>_<e2>.md`, slugs em ordem
  alfabética) a partir do inventário travado e do MER: significado, atributos de
  ligação, cardinalidade e direcionalidade, com RN vinculadas. Acione via
  `design-entidades` após o MER, ou com `/de-produzir-relacionamento`, ao documentar
  uma relação entre entidades.
---

# de-produzir-relacionamento: descrição de relacionamento a partir do inventário + MER

Skill-folha de produção. **Entrada:** inventário de domínio travado, `MER.md` (fonte única de
entidades e cardinalidades) e **par de slugs da relação-alvo** (ou o `id` da relação).
**Processo:** extrai do inventário a relação binária, **lê a cardinalidade no MER** e resolve
a direcionalidade. **Saída:** um único arquivo
`<RAIZ_DESIGN>/relations/<slug_e1>_<slug_e2>.md` (par alfabético).

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`. Saída comum (slug, par
alfabético, procedência, idempotência por-alvo, não-edição cruzada do MER/inventário/mapa/fontes,
N-ário→associativa, órfão, manifesto): `../mapa-artefatos-base/references/convencao-nomes-artefatos.md`.

**Específico do relacionamento:**

- **Cardinalidade é lida do MER, não escolhida** (fonte única). Divergência MER×inventário ou
  MER sem a relação → para e devolve, **não** reescreve o MER.
- **Direcionalidade é zero-presunção** (`direcional`/`bidirecional`): só com evidência (Fase 3).
- **N-ário (aridade > 2)** → propõe entidade associativa + binárias; **não** materializa
  (`relations/` é sempre binário).
- **Bloco de RN obrigatório** na descrição (mesmo "nenhuma RN vinculada").

Cada fase é um **GATE**: falhou → encerre ou devolva a dúvida ao orquestrador, **sem** gravar
descrição parcial/presumida.

---

### Fase 1: Entrada e validação

Receba inventário, MER e o **par de slugs** (ou `id`); não escaneie o repo. Valide o
inventário contra `../de-revisar-entidades-regras/references/criterios-validacao-entidade.md`
(§3.3 relação; §3.5 RN; §3.6: `schema_version` compatível, `pronto_para_mer: true`) e confirme
que o MER contém **as duas entidades** do par e a **linha de relacionamento**.

**GATE 1:** inventário/MER ausente·ilegível ou `schema_version` incompatível → encerre com
motivo (direcione a `/de-revisar-entidades-regras` + `/de-produzir-mer`); `pronto_para_mer:
false`/inválido → não produz; entidade(s) do par ou relação ausente(s) do MER → divergência,
devolve (não inventa).

### Fase 2: Extração da relação + cardinalidade do MER

Na seção de relação (`relacao:`) do par-alvo, extraia cada item com sua `origem` (semântica
REL/ATR/RN/ATOR em `../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`; âncoras em
`../mapa-artefatos-base/references/schema-mapa-artefatos.md`): `entidades` (dois slugs
alfabéticos), `semantica`, `atributos_ligacao[]`, `n_aria` e ids de `rn` (resolvidos em
`## regras-de-negocio`). **Cardinalidade vem do MER:** localize a linha do `erDiagram` entre
as duas entidades e interprete a classe (`1:1`/`1:N`/`N:M`) **estritamente** pelo mapeamento
notação↔classe de `../drizzle-from-mermaid-erd/references/mermaid-erd-spec.md` (dialeto
único), nunca por presunção; confira coerência com o `cardinalidade` do inventário.

**GATE 2:** divergência de cardinalidade MER×inventário (ou ausente nos dois sem
`lacuna-aceita`) ou notação fora do dialeto → para e devolve (MER é fonte única; não escolhe
nem reescreve). RN pendurada → devolve. `n_aria: true` → vá à Fase 3 (não produz arquivo com
3+ slugs).

### Fase 3: Direcionalidade e N-ário (zero presunção)

**Direcionalidade** ∈ `direcional (origem→destino) | bidirecional`, **só** quando evidenciada
(semântica, sentido de propagação de dados, papel das entidades); não evidenciada → devolve a
dúvida, **não** presume um padrão.

**N-ário (aridade > 2)** → resolve como **entidade associativa** (com seu `descriptions/<assoc>.md`)
**+ N relações binárias**. Como criar a associativa é decisão do MER, a skill **propõe** o
nome/slug e **devolve ao orquestrador/`de-produzir-mer`**; não materializa nem cria os binários
antes de ela existir no MER.

**GATE 3:** direção não evidenciada → devolve a dúvida; N-ário sem associativa confirmada no
MER → devolve a proposta e **pare** (nada gravado). Só prossiga com as definições re-entregues.

### Fase 4: Montagem, gravação idempotente e manifesto

Monte **estritamente** conforme `references/template-relacionamento.md` (cardinalidade citando
a linha do MER; direcionalidade com a evidência). Grave **um único**
`relations/<slug_e1>_<slug_e2>.md` (par **alfabético** unido por `_`), idempotente. **Antes de
persistir**, revalide: par alfabético; cardinalidade idêntica à do MER; direcionalidade ∈
`{direcional, bidirecional}`; bloco RN presente; achados com fonte; sem segredo. Devolva então o
**manifesto pequeno** (convenção §8): caminho; cardinalidade; direcionalidade; **dúvidas**;
**cruzados**, divergência de cardinalidade (→ `de-produzir-mer`), entidade associativa proposta
(→ `de-produzir-mer`), órfão (relação sumida das fontes → decisão humana). Sem colar a descrição.

**GATE 4:** par fora de ordem / cardinalidade não conferida / seção ausente → não persiste,
devolve o que falta. Nunca edita MER/inventário/mapa/fontes para resolver cruzado nem apaga
órfão, apenas **reporta**.
