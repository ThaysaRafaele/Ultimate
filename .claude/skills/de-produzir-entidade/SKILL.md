---
name: de-produzir-entidade
description: >-
  Gera UMA descrição de entidade (`descriptions/<slug>.md`) a partir do inventário
  travado e do MER: papel de domínio, atributos, ações, estados e RN vinculadas, com
  `stateDiagram-v2` opcional. Acione via `design-entidades` após o MER, ou com
  `/de-produzir-entidade`, ao documentar uma entidade de domínio.
---

# de-produzir-entidade: descrição de entidade a partir do inventário + MER

Skill-folha de produção. **Entrada:** inventário de domínio travado
(`de-revisar-entidades-regras`), `MER.md` (índice entidade→slug, fonte única de entidades) e
**slug-alvo**. **Processo:** extrai do inventário o material da entidade e **aplica** a
decisão de modelagem de estado já congelada. **Saída:** um único arquivo
`<RAIZ_DESIGN>/descriptions/<slug>.md`.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`. Saída comum (slug,
procedência, idempotência por-alvo, não-edição cruzada do MER/inventário/mapa/fontes, órfão,
manifesto): `../mapa-artefatos-base/references/convencao-nomes-artefatos.md`.

**Específico da entidade:**

- **Consome a decisão de estado, não a toma** (`atributo-status` vs `sub-entidade-historico`
  vs `sem-estado`, congelada em `modelagem_estado.decisao` por `de-revisar-entidades-regras`).
- **`stateDiagram-v2` opcional**, só com transições evidenciadas (Fase 3).
- **Bloco de RN obrigatório** na descrição (mesmo "nenhuma RN vinculada").

Cada fase é um **GATE**: falhou → encerre ou devolva a dúvida ao orquestrador, **sem** gravar
descrição parcial/presumida.

---

### Fase 1: Entrada e validação

Receba inventário (`_revisao/inventario-de-entidades.md`), MER e slug-alvo (não escaneie o
repo). Valide o inventário contra
`../de-revisar-entidades-regras/references/criterios-validacao-entidade.md` (§3.6:
`schema_version` compatível, manifesto presente, `pronto_para_mer: true`) e confirme o
slug-alvo na tabela entidade→slug do MER.

**GATE 1:** inventário/MER ausente·ilegível ou `schema_version` incompatível → encerre com
motivo (direcione a `/de-revisar-entidades-regras` + `/de-produzir-mer`); `pronto_para_mer:
false`/inválido → não produz; slug-alvo ausente do MER → devolve (órfão/divergência, não inventa).

### Fase 2: Extração e aplicação da decisão de estado

Em `## entidade-<slug>, <Nome>`, extraia cada item com sua `origem` (semântica em
`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`; âncoras em
`../mapa-artefatos-base/references/schema-mapa-artefatos.md`): **ENT** (`papel_dominio`, faceta
`e_ator`/`papel_ator`), **ATR** (`atributos[]`: nome/tipo/obrigatório/`rn`), **ACT** (`acoes[]`
com `muda_estado`), **EST** (bloco `estados`: `valores[]`+`transicoes[]`, se houver), **RN**
(ids de `entidade.rn[]`/`atributos[].rn`/`transicoes[].rn` resolvidos em `## regras-de-negocio`).
Aplique `modelagem_estado` (só com `estados`): `atributo-status` → atributo `status`/`situacao`
com `valores[]`; `sub-entidade-historico` → mudanças na `sub_entidade` (**deve constar do
MER**); `sem-estado` → sem status. Sem `estados`: "sem ciclo de estados relevante".

**GATE 2:** sem `papel_dominio`, sem `≥ 1 atributo com origem` (§1.1) ou RN pendurada (§3.6
regra 6) → devolve (divergência do inventário). `estados` sem `modelagem_estado.decisao`
congelada (ou `justificativa` vazia / `decidido_por` ausente) → **não decide**, devolve.
`sub-entidade-historico` com `sub_entidade` fora do MER → cruzado (sub-entidade nova →
`de-produzir-mer`); **não edita o MER**.

### Fase 3: Montagem e gravação idempotente

Monte **estritamente** conforme `references/template-descricao-entidade.md` (`tipo: null` →
"não evidenciado", nunca palpite). **`stateDiagram-v2`** só com `transicoes` **evidenciadas**
que passem o checklist sintático mínimo do template (regra 5); senão omite o bloco e mantém a
lista textual (pendência no manifesto). Grave **um único**
`descriptions/<slug>.md`, idempotente, com o slug reusado do MER. A **sub-entidade de
histórico** é entidade do MER com **despacho próprio**: aqui só **referenciada** na seção
Estágios/status, **nunca** gravada como `descriptions/<slug_sub>.md` (convenção §3.1/§5).

**GATE 3:** revalide a fidelidade ao template antes de persistir (toda seção obrigatória, bloco
RN, procedência, achados com fonte + localização, sem segredo, slug ∈ MER); incompleto → não
persiste, devolve o que falta.

### Fase 4: Manifesto e cruzados

Devolva o **manifesto pequeno** (convenção §8): caminho; contagens (atributos/estados/ações/RN);
**dúvidas** (lacunas devolvidas); **cruzados**, sub-entidade nova (→ `de-produzir-mer`),
divergência de modelagem (→ `de-revisar-entidades-regras`), órfão (entidade sumida das fontes
→ decisão humana). Sub-entidade já no MER → sinalize o slug como **descrição a produzir em
despacho próprio** (dependência de produção, não problema). Sem colar a descrição.

**GATE 4:** nunca edita MER/inventário para resolver cruzado nem apaga órfão, apenas
**reporta**; o orquestrador encaminha.
