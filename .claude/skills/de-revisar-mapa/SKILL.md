---
name: de-revisar-mapa
description: >-
  Revisão incremental do mapa de artefatos: reconcilia `_map/mapa-artefatos.md` com
  o estado atual do repo (fontes novas/alteradas/removidas/órfãs via delta sha256) e
  aplica ajustes humanos, preservando entradas humanas. Acione via `design-entidades`
  no modo incremental, ou com `/de-revisar-mapa`, quando as fontes mudaram ou o
  humano editou o mapa.
---

# de-revisar-mapa: revisão incremental do mapa de artefatos

**Skill da família `design-entidades`, modo incremental (roda em subagente).** Entrada de
fronteira: **o mapa `<RAIZ_DESIGN>/_map/mapa-artefatos.md` + o escopo atual** do repo.
Processo, em **duas passagens mediadas pelo orquestrador**: (A) valida o mapa contra o schema,
calcula o **delta de fontes** pelo sha256 da skill-base, interpreta pedidos humanos e
**devolve** ao orquestrador a lista de delta + tipo sugerido: e **para**; (B) ao receber de
volta os **fragmentos** reclassificados, faz o **merge** preservando entradas humanas e, sob
validação humana via orquestrador, **persiste** o mapa atualizado. Saída: **delta de fontes**
(consumido por `de-reexecutar-incremental`, que não recomputa o fingerprint) + **mapa
atualizado**. Não cria mapa do zero, não aciona classificação, não edita fontes.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico da skill:**

- **Única dona do delta.** O fingerprint sha256 é calculado **aqui e só aqui**;
  `de-reexecutar-incremental` **consome** o delta e não recomputa. `mtime` **nunca** decide;
  `bytes`+`linhas` são só pré-filtro barato; `sha256` é a autoridade.
- **Não edita artefatos de origem.** Harmonização de fontes divergentes é **delegada a
  `de-analisar-inconsistencias`** (única editora, com `.bak` + log). A única escrita desta
  skill é o **mapa** (artefato de processo, sob `RAIZ_DESIGN`, gated na Fase 6).
- **Preservação humana.** Entrada com `marca_mudanca.fonte: humano` **ou**
  `revisao_humana.status ∈ {aprovado, ajustado}` **nunca** é sobrescrita sem confirmação;
  merge por identidade **`fonte + localização relativa`** (substitui só o trecho
  reclassificado, mantém os demais achados, humanos ou não, do mesmo arquivo).
- **`REMOVIDO`/`ÓRFÃO`** são **reportados** ao orquestrador para decisão humana, nunca
  apagados por conta própria.

Cada fase é um **GATE**: gate que falha → **encerre** (ou devolva a dúvida ao orquestrador),
sem persistir mapa parcial.

---

## Workflow

### Fase 1: Localizar o mapa e validar contra o schema [Passagem A]

Localize e **leia** o mapa em `<RAIZ_DESIGN>/_map/mapa-artefatos.md` (default
`docs/entities/_map/`; lê-lo não viola o somente-leitura sobre as fontes, é artefato de processo; o que se evita é reler as
**fontes grandes**). Valide contra `schema-mapa-artefatos.md`: `schema_version` presente e
**compatível**; integridade estrutural (manifesto, seções `## <id>, <caminho>`, `id` únicos,
`parte_de` válido, `total_artefatos`); coerência de alvos (`alvos_presentes ⊆ alvos_examinados`,
§5); e **procedência mínima** por entrada (`marca_mudanca`), sem ela não há base para delta.

**GATE 1: Mapa ausente / sem procedência / `schema_version` incompatível.** **Encerre** e
oriente o **mapeamento inicial** (`/design-entidades` em modo **full**): esta skill **não**
cria mapa do zero.

### Fase 2: Calcular o delta das fontes [Passagem A]

Compare as fontes **registradas no mapa** com o **estado atual** do repo (escopo recebido)
**seguindo estritamente** `fingerprint-e-delta.md`: pré-filtro barato por `bytes`+`linhas`
(`mtime` só como dica, **nunca** decide); **sha256 do conteúdo normalizado** como autoridade,
classificando cada fonte em **uma** classe (`NOVO`/`ALTERADO`/`REMOVIDO`/`INALTERADO`/`ÓRFÃO`);
sentinelas §1.4 (protótipo-índice deriva o delta **dos filhos**; não-analisável usa o sentinela
de 64 zeros). **Não reimplemente** o algoritmo, o conteúdo nunca é presumido.

Produza a **tabela de delta** enxuta: uma linha por fonte que **mudou**; `INALTERADO` fica
fora do reprocessamento. O `tipo_sugerido` usa o enum (`documento | codigo | prototipo`) e
orienta qual `de-classificar-*` o orquestrador re-despachará; `REMOVIDO`/`ÓRFÃO` ficam sem tipo:

```
| caminho | classe | tipo_sugerido | localizacao | nota |
|---------|--------|---------------|-------------|------|
| requisitos/pedidos.md | ALTERADO | documento | sec:validacoes | trecho alterado |
| prototipo/            | ALTERADO | prototipo  |,              | delta vem dos filhos (§1.4) |
| historias/novo.md     | NOVO     | documento |,              | sem entrada no mapa |
| requisitos/antigo.md  | REMOVIDO |,          |,              | reportar impacto; não apagar |
```

**GATE 2: Nada a fazer.** Sem delta (tudo `INALTERADO`) **e** sem pedido humano (Fase 3) →
**encerre** devolvendo **"mapa atualizado: nada a reprocessar"**; não toque o mapa.

### Fase 3: Confirmar a interpretação de pedidos humanos [Passagem A]

Só se houver **pedidos humanos** (acrescentar artefato, apontar utilidade não percebida,
corrigir achado/localização, marcar `nao-analisavel`). Para cada um, **interprete** a intenção
e mapeie-a para uma operação concreta sobre o mapa, **dentro** do vocabulário do schema.

**GATE 3: Pedido ambíguo.** Pedido que não identifique com clareza qual artefato/alvo/
localização → **não adivinhe**: devolva a **dúvida** ao orquestrador. Pedido que exigiria
**editar uma fonte** (não o mapa) → **sinalize** que pertence a `de-analisar-inconsistencias`;
não execute aqui.

### Fase 4: Devolver delta + tipo sugerido [Passagem A]

Devolva ao orquestrador, de forma **enxuta**: a **lista de delta** `NOVO`/`ALTERADO` com tipo
sugerido (nome canônico da sub-skill) e localização do trecho p/ `ALTERADO` (reclassificação
parcial); `REMOVIDO`/`ÓRFÃO` **reportados** p/ decisão humana; operações de pedido humano
interpretadas (Fase 3); e a lista de **dúvidas** acumulada. **Esta skill não aciona
`de-classificar-*`**: apenas nomeia e devolve; o **orquestrador** re-despacha as folhas
(em subagentes próprios, só no delta) e re-entrega os fragmentos para a Fase 5.

**GATE 4: Retorno enxuto.** Lista/tabela + dúvidas, **sem** colar conteúdo de fonte nem
blocos de código; se grande, **indexe** (uma linha por fonte).

### Fase 5: Merge preservando entradas humanas [Passagem B]

Reentrada **após** o orquestrador re-entregar os **fragmentos** reclassificados. Para cada
fragmento: **valide** contra `schema-mapa-artefatos.md` (inválido → **rejeita** e devolve, sem
gravar parcial); **merge por identidade `fonte + localização relativa`**, substitua só os
achados do trecho reclassificado, **preserve** os demais achados/notas do mesmo arquivo (merge,
não substituição cega); atualize `marca_mudanca` (novo `sha256`/`bytes`/`linhas`; `mtime_iso`
como dica) e marque `revisao_humana.status: pendente` / `marca_mudanca.fonte: agente` no que o
agente reclassificou; aplique as operações de pedido humano (Fase 3); `REMOVIDO` → marca/retira
a entrada **reportando o impacto** (não apaga design); atualize o manifesto (`gerado_em`,
`total_artefatos`).

**GATE 5: Colisão humano × reclassificação.** Entrada `ALTERADO` protegida (`fonte: humano`
**ou** `status ∈ {aprovado, ajustado}`) → **não sobrescreva**: apresente a colisão e pergunte
(via orquestrador). Decisão pendente mantém a entrada humana intacta.

### Fase 6: Validação humana antes de persistir [Passagem B]

Devolva ao orquestrador o **resumo do delta** (entradas novas/alteradas/removidas, colisões
resolvidas, pedidos aplicados) + o **pedido de validação**: em subagente, **não pergunta ao
usuário**. Só **após a aprovação** repassada pelo orquestrador, **persiste** o mapa em
`<RAIZ_DESIGN>/_map/mapa-artefatos.md` (única escrita): revalide o mapa inteiro contra o schema,
mantenha as fontes `INALTERADO` exatamente como estavam e devolva um **veredito pequeno** (o que
mudou + pendências). O delta fica disponível para `de-reexecutar-incremental` **consumir** (sem
recomputar).

**GATE 6: Validação humana.** **Nada é persistido** sem aprovação (via orquestrador). Sem
aprovação → não grava e devolve o delta proposto + pendências; com aprovação → grava e revalida.
