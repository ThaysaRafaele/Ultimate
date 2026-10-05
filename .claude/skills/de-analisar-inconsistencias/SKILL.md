---
name: de-analisar-inconsistencias
description: >-
  Cruza o MAPA validado pelos 9 alvos fixos para achar contradições reais entre
  artefatos (cardinalidade, estado/status, ator, omissão) e produz
  `_revisao/relatorio-de-inconsistencias.md` para definição humana item a item.
  Acione via `design-entidades` após validar o mapa, ou com
  `/de-analisar-inconsistencias`.
---

# de-analisar-inconsistencias: análise de inconsistências e harmonização (Etapa 2)

**Skill da família `design-entidades`, Etapa 2 (roda em subagente).** Entrada de
fronteira: **o MAPA validado** (`<RAIZ_DESIGN>/_map/mapa-artefatos.md`, default
`docs/entities/_map/`), aprovado no GATE 2 do orquestrador. Processo, em **duas passagens
mediadas pelo orquestrador**: (A) valida o mapa contra o schema, **cruza os achados pelos
9 alvos fixos** guiando-se pelas **localizações relativas** (sem reler as fontes grandes),
detecta **contradições reais**, classifica por classe/severidade e **devolve** ao
orquestrador o relatório agrupado para **definição humana item a item**: e **para**; (B)
ao receber de volta as definições + autorizações, aplica o **protocolo de edição segura**
nos itens autorizados e **persiste** o relatório. Saída:
`<RAIZ_DESIGN>/_revisao/relatorio-de-inconsistencias.md` (com `schema_version`, decisão e
ação por item) + **veredito pequeno**. É a **única skill do fluxo autorizada a editar
artefatos de origem**, e só sob o protocolo da Fase 5.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico da skill:**

- **Única editora de fontes.** É a **única** skill que pode escrever num artefato de
  origem, e **só** pela Fase 5, sob o protocolo (confirmação por item + `.bak` + log). Toda
  outra escrita (relatório, log) é **artefato de processo** sob `RAIZ_DESIGN`. A re-execução
  incremental **delega** a harmonização a esta skill, não edita fonte por conta própria.
- **Só conflito REAL.** Catálogo **conservador** para minimizar fadiga de decisão: na dúvida
  entre "é conflito" e "é só estilo/redundância/visão parcial/mock", **não reportar** (ou
  severidade **baixa** com nota de incerteza). `tipos-de-inconsistencia.md` é a régua;
  severidade **alta** exige incompatibilidade clara e confirmada.
- **Conflitos entre artefatos pertencem AQUI.** A classificação (Etapa 1) apenas **sinaliza**
  divergências (`Confiança: baixa`, notas de conflito); a **resolução** acontece nesta skill,
  sob definição humana, nunca durante a classificação.
- **Pós-edição invalida o mapa.** Editar uma fonte muda seu fingerprint → a entrada do mapa
  fica desatualizada. **Reporta** ao orquestrador (recomenda `/de-revisar-mapa` no escopo
  afetado); **não** corrige o mapa por conta própria (delta é dono de `de-revisar-mapa`).

Cada fase é um **GATE**: gate que falha → **encerre** (ou devolva a dúvida ao orquestrador),
sem editar fonte nem persistir relatório parcial.

---

## Workflow

### Fase 1: Confirmar o mapa validado e válido contra o schema [Passagem A]

Localize e **leia** o mapa em `<RAIZ_DESIGN>/_map/mapa-artefatos.md` (artefato de processo,
pequeno, lê-lo não viola o retorno enxuto do subagente; o que se evita é reler as **fontes grandes**). Valide contra
`schema-mapa-artefatos.md`: `schema_version` presente e **compatível**; integridade
estrutural (manifesto, seções `## <id>, <caminho>`, `id` únicos, `parte_de` válido,
`total_artefatos`, `alvos_presentes ⊆ alvos_examinados`); e **validação humana**, o mapa
passou pelo GATE 2 (não está com todas as entradas `revisao_humana.status: pendente`).

**GATE 1: Mapa ausente / não validado / desatualizado / `schema_version` incompatível.**
**Encerre** e **direcione**: mapa inexistente → mapeamento inicial (`/design-entidades`
full); mapa desatualizado → `/de-revisar-mapa`. Esta skill **cruza** um mapa pronto, não
mapeia nem reconcilia.

### Fase 2: Cruzamento por alvo fixo (clusters com limpeza) [Passagem A]

Cruze os achados do mapa **por alvo fixo** (taxonomia dos 9 alvos em
`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`), em **clusters de alvo** com
limpeza de contexto entre eles (sem `Task` aninhado), comparando achados da **mesma
referência de domínio** **entre artefatos diferentes**, guiado pelas **localizações
relativas** do mapa:

- **ENT/ATR:** mesma entidade com atributos/tipos/obrigatoriedade divergentes? Campo que um
  afirma e outro, tendo **examinado** o alvo, **omite**?
- **EST:** conjunto de estados / ordem de transição divergem entre artefatos?
- **REL:** cardinalidade (1:1/1:N/N:M) e semântica coerentes entre as fontes?
- **ATOR/ACT/RN:** **quem** age e **sob que regra** batem? (ex.: RN "só o gestor aprova" ×
  tela que deixa qualquer usuário aprovar.)
- **REQ/FLX:** fluxo do protótipo contraria um requisito/história declarada?
- **Omissão:** use `alvos_examinados` × `alvos_presentes`: alvo **procurado e ausente** num
  lado, **presente e exigido** noutro; "nem examinado" **não** é conflito.
- **Sinais prévios:** achados `Confiança: baixa` (em especial mock de API) e notas de
  conflito da Etapa 1 são **candidatos prioritários**, mas só viram conflito se a
  contradição for **real**.

**Confirmação dirigida (somente-leitura).** Quando o resumo do mapa não bastar, abra
**apenas** o trecho citado pela localização relativa: **não** releia o arquivo inteiro nem
expanda para vizinhos. Trecho de protótipo → siga `seguranca-prototipo.md`. Ambiguidade
persistente → **dúvida** ao orquestrador, não conflito inventado.

**GATE 2: Retorno enxuto.** Produto interno = lista enxuta de candidatos (referência
+ alvos + fontes/localizações + lado-A/lado-B), evidência **≤ 120 chars**, sem colar
parágrafos nem blocos de código; se crescer, **indexe** por cluster.

### Fase 3: Classificar conflitos reais e descartar falsos-positivos [Passagem A]

Para cada candidato, decida se é **conflito real** e, se for, classifique-o conforme
`references/tipos-de-inconsistencia.md`: **classe** (contradição direta, omissão,
ambiguidade, divergência de cardinalidade, conflito de estado/status, ator divergente),
**severidade** (alta/média/baixa pelo critério do catálogo) e **alvos + fontes/localizações
+ evidência** de cada lado.

**Descarte conservador.** Visões **parciais** complementares, **redundância** consistente,
diferenças de **vocabulário** e **mock como dado** (não normativo) **não** são conflito (§3
do catálogo). Na dúvida real → severidade **baixa** com nota, **nunca** "alta por precaução".

**GATE 3: Zero conflito → requisitos harmônicos.** Se, após o descarte, **não restar
conflito real**, persista o **relatório mínimo** (`schema_version`, `total_conflitos: 0`,
fontes cruzadas, conforme o template) e devolva o veredito **"harmônico: libera Etapa 3"**.
**Não** há Passagem B.

### Fase 4: Montar e devolver o relatório agrupado [Passagem A]

Havendo conflitos, monte o **relatório agrupado** conforme o template de
`tipos-de-inconsistencia.md` (por item: `id`, classe, severidade, alvos, fontes/localizações
e evidência de cada lado, **o que decidir**; nasce `decisao: pendente` / `acao: nenhuma`) e
**devolva-o ao orquestrador** para a **definição humana item a item**. A skill **não
pergunta ao usuário**: devolve o relatório + as dúvidas, e o orquestrador coleta, por
item, a **definição final** e se o humano **autoriza harmonizar** a fonte ou prefere
**seguir-com-definição**. A skill **para** aqui; a Passagem B só começa quando o orquestrador
re-entrega as definições.

**GATE 4: Retorno enxuto + definição por item.** Retorno = relatório agrupado + dúvidas,
sem colar conteúdo de fonte além das evidências curtas; se grande, **indexe** (uma linha por
conflito). **Nenhuma fonte é tocada** na Passagem A; a skill não avança sem as definições por
item.

### Fase 5: Protocolo de edição segura [Passagem B]

Reentrada **após** o orquestrador re-entregar, **por item**, a **definição final** e a
**autorização**. Para cada conflito, conforme estritamente
`references/protocolo-edicao-segura.md`:

- **Sem autorização de edição** → `acao: seguir-com-definicao`: a **definição humana** vira
  a verdade canônica para a Etapa 3 (no relatório), **fonte intacta**. É o **default seguro**.
- **Com autorização explícita (item a item)** → aplique o protocolo: **`.bak` ANTES** de
  qualquer escrita (`.bak` pré-existente não é sobrescrito sem versionar); **edição in-loco
  só do trecho divergente** apontado pela localização relativa (nunca reescrita ampla);
  **entrada de log** em `<RAIZ_DESIGN>/_revisao/harmonizacao.log.md` (antes→depois curto sem
  segredo, justificativa, quem/quando); `acao: harmonizado` no item.
- **Edição em lote PROIBIDA:** uma confirmação = um item; cada arquivo editado tem `.bak` e
  log próprios.

**GATE 5: Confirmação + backup antes de editar origem.** Sem autorização por item →
`seguir-com-definicao` (fonte intacta). Sem `.bak` criado antes → **não edita**. Edição em
lote → **proibida**. Fontes editadas → **reporta** ao orquestrador como mapa desatualizado
(recomenda `/de-revisar-mapa`); mapa **não** corrigido aqui.

### Fase 6: Persistir o relatório e devolver o veredito [Passagem B]

Persista o **relatório final** em `<RAIZ_DESIGN>/_revisao/relatorio-de-inconsistencias.md`
conforme o template, com `schema_version` compatível e, **por item**: classe, severidade,
alvos, fontes/localizações, **decisão** (definição humana) e **ação** (`harmonizado` |
`seguir-com-definicao`). É o **rastro** consumido pela Etapa 3 e, no incremental, pela
projeção de impacto. Devolva ao orquestrador um **veredito pequeno**: nº de conflitos por
severidade, `harmonizado` × `seguir-com-definicao`, **fontes editadas** (com `.bak`) que
pedem `/de-revisar-mapa`, e pendências (se houver).

**GATE 6: Relatório completo e veredito enxuto.** Persiste só com **todos os itens
decididos** (nenhum `decisao: pendente`); item pendente → não persiste como final e devolve
o que falta decidir. Veredito **pequeno** (contagens + listas), sem conteúdo de fonte.
