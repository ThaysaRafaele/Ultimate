# Pipeline ponta-a-ponta, gates HITL e contrato de chamada

> **Escopo.** Reference da skill `design-entidades`: dá o **mapa de alto nível** do
> pipeline (quem chama quem, em que ordem), marca **onde cada gate
> human-in-the-loop ocorre** e fixa o **contrato de chamada** entre etapas,
> sempre passando **MAPA / MER / inventário / relatório** (artefatos de fronteira
> versionados), **nunca** os artefatos de requisito brutos. Nomes em
> `../../mapa-artefatos-base/references/nomes-canonicos.md`; estrutura dos artefatos
> de fronteira em `../../mapa-artefatos-base/references/schema-mapa-artefatos.md`.

## Visão geral (full)

```
/design-entidades  (contexto principal, orquestrador)
  │
  ├─ Fase 0   Coleta de fontes ............... GATE 0  (pergunta se ausente; não escaneia sozinho)
  │           Modo full vs incremental ....... GATE 0b (pergunta se houver mapa/design prévios)
  │           Inventário barato (inline) ..... GATE 0c (escopo vazio → para; tipo ambíguo/nao-analisavel → pergunta)
  │           → tabela de roteamento (artefato → tipo → folha)
  │
  ├─ ETAPA 1, MAPA
  │   Fase 1  de-classificar-doc / -codigo / -prototipo  ‖ FAN-OUT PARALELO (1/grupo coeso)
  │           ............................. GATE 1  (retorno enxuto: fragmento + dúvidas)
  │   Fase 2  ══ barreira: aguarda todos os fragmentos ══ → costura no _map/mapa-artefatos.md
  │           ............................. GATE 2  (validação humana do mapa, HITL)
  │
  ├─ ETAPA 2, INCONSISTÊNCIAS
  │   Fase 3  de-analisar-inconsistencias (subagente; entrada = MAPA)
  │           → _revisao/relatorio-de-inconsistencias.md
  │           ............................. GATE 3  (definição humana por item; edição de origem só aqui, c/ backup)
  │
  ├─ ETAPA 3, PRODUÇÃO DE DESIGN
  │   Fase 4  de-revisar-entidades-regras (entrada = MAPA) → _revisao/inventario-de-entidades.md   « SEQUENCIAL »
  │           ............................. GATE 4a (prontidão; decisão status-atributo vs sub-entidade congelada)
  │           de-produzir-mer (entrada = inventário) → MER.md                                       « SEQUENCIAL (gargalo) »
  │           ............................. GATE 4b (MER só grava se passar no checklist sintático)
  │           ┌─ de-produzir-entidade → descriptions/<entidade>.md      ┐
  │           ├─ de-produzir-relacionamento → relations/<e1>_<e2>.md    │  ‖ FAN-OUT PARALELO (pós-MER)
  │           └─ de-produzir-fluxo → flows/<fluxo>.md                    ┘
  │           ══ barreira: aguarda toda a produção ══
  │           ............................. GATE 4c (não-edição cruzada do MER; órfãos reportados, não apagados)
  │
  └─ Fase 5  handoff opcional MER → drizzle-from-mermaid-erd
            ............................. GATE 5  (só com aprovação explícita; nunca automático)
```

Todas as escritas ficam **sob `RAIZ_DESIGN`** (default `docs/entities`), na árvore
fixa. `_map/` e `_revisao/` são infra de processo (prefixo `_`), versionados.

## Paralelismo no pipeline (dois pontos de fan-out)

O orquestrador despacha **em paralelo** apenas onde o trabalho é naturalmente
independente; o restante é **sequencial por desenho**:

- **Etapa 1, Fase 1: classificação das folhas:** fan-out concorrente (1 subagente
  por grupo coeso/arquivo). Mecânica e restrições em
  `orquestracao-e-subagentes.md` → "Fan-out paralelo da classificação". **Barreira**
  antes da costura no mapa e do **GATE 2**.
- **Etapa 3, Fase 4: produção de entidades/relações/fluxos (pós-MER):**
  `de-produzir-entidade` (1/entidade), `de-produzir-relacionamento` (1/relação) e
  `de-produzir-fluxo` (1/fluxo) são **independentes e idempotentes** (cada um grava
  só o próprio arquivo) → fan-out concorrente. **Barreira** antes do **GATE 4c**
  (não-edição cruzada do MER / órfãos).

**Gargalos sequenciais (nunca paralelizados):** a consolidação do **inventário**
(`de-revisar-entidades-regras`) e a geração do **MER** (`de-produzir-mer`), o MER é
**pré-requisito de todas** as produtoras, então nada do passo 3 começa antes do MER
gravado e do GATE 4b. **Gates HITL (0/0b/0c/2/3/4a) são barreiras absolutas:** nenhum
fan-out os atravessa. No **modo incremental**, todo fan-out cobre só o **subconjunto
afetado**. Mantido: nenhum subagente aciona outro; todo fan-out volta ao
orquestrador.

## Onde cada gate ocorre (resumo)

| Gate  | Fase | O que bloqueia                                              | Resolução                                              |
|-------|------|------------------------------------------------------------|--------------------------------------------------------|
| 0     | 0    | Nenhuma fonte indicada                                     | Pergunta e aguarda; pode oferecer candidatos.          |
| 0b    | 0    | Mapa/design prévios + modo não dito                       | Pergunta full vs incremental.                          |
| 0c    | 0    | Escopo vazio; tipo ambíguo/`nao-analisavel` (roteamento)  | Para / agrupa e pergunta; nunca adivinha tipo.         |
| 1     | 1    | Retorno de subagente com conteúdo colado / grande          | Rejeita e reinstrui a resumir/indexar.                 |
| 2     | 2    | Mapa não validado pelo humano                              | Aprova / ajusta à mão / pede reclassificação (→ Fase 1).|
| 3     | 3    | Conflito real entre requisitos                             | Definição humana por item; harmoniza só sob confirmação + backup. |
| 4a    | 4    | Lacuna bloqueante / decisão de status ambígua             | Pergunta; decisão congelada no inventário.             |
| 4b    | 4    | MER sintaticamente inválido / lacuna de cardinalidade/PK   | Não grava; devolve dúvida → pergunta.                  |
| 4c    | 4    | Divergência que exigiria editar o MER; órfãos             | Devolve ao orquestrador; órfãos reportados, não apagados. |
| 5     | 5    | Handoff a jusante                                          | Só com aprovação explícita.                            |

Os gates HITL "fortes" (decisão humana obrigatória) são **0, 0b, 0c, 2, 3** e a
validação do inventário em **4a**. Os demais são gates de qualidade/segurança que
o orquestrador resolve com reinstrução ou devolução, sem necessariamente parar
para o humano (exceto quando viram pergunta).

## Contrato de chamada por etapa (passa fronteira, não bruto)

O orquestrador chama cada skill de etapa passando **somente** o artefato de
fronteira adequado, preservando o isolamento de contexto. Todo leitor valida
`schema_version` e **encerra com mensagem clara** se incompatível.

| Skill chamada                  | Entrada (fronteira)                          | Saída                                              |
|--------------------------------|----------------------------------------------|----------------------------------------------------|
| `de-classificar-*` (folha)     | lista de **caminhos** + 9 alvos + schema     | **fragmento** (YAML+achados) + dúvidas             |
| `de-analisar-inconsistencias`  | **MAPA** (`_map/mapa-artefatos.md`)          | `relatorio-de-inconsistencias.md` + veredito       |
| `de-revisar-entidades-regras`  | **MAPA** harmonizado                         | `inventario-de-entidades.md` + veredito            |
| `de-produzir-mer`              | **inventário** (+ mapa p/ localização)       | `MER.md` (procedência + tabela slug) + manifesto   |
| `de-produzir-entidade`         | **inventário** + **MER**                     | `descriptions/<entidade>.md` + manifesto           |
| `de-produzir-relacionamento`   | **MER** (+ inventário)                        | `relations/<e1>_<e2>.md` + manifesto               |
| `de-produzir-fluxo`            | **MAPA** (FLX) + **MER**                      | `flows/<fluxo>.md` + manifesto                     |
| `de-revisar-mapa`              | **MAPA** + escopo atual                       | delta de fontes + mapa atualizado                  |
| `de-reexecutar-incremental`    | **delta** (de `de-revisar-mapa`) + procedência | subconjunto mínimo a regenerar                   |
| `drizzle-from-mermaid-erd`  | **caminho do `MER.md`**                       | `lib/schema.ts` + migration (fora de `RAIZ_DESIGN`)          |

Os subagentes **nunca** recebem os artefatos de requisito brutos colados no prompt
(eles **leem** os caminhos que recebem); o orquestrador **nunca** repassa conteúdo
de fonte de uma etapa para outra, só os artefatos de fronteira acima.

## Caminho incremental (modo selecionado no GATE 0b)

Quando o usuário pede re-execução após mudança/adicão de fontes, o orquestrador
**não** refaz tudo: roteia pelo delta, mantendo todos os gates HITL.

```
GATE 0b → incremental
  │
  ├─ de-revisar-mapa (entrada = MAPA + escopo atual)
  │     calcula o delta das FONTES (NOVO/ALTERADO/REMOVIDO/INALTERADO) por sha256
  │     normalizado (fonte única do algoritmo: fingerprint-e-delta.md);
  │     devolve ao orquestrador a lista pequena de fontes em delta + tipo sugerido.
  │     ............................. GATE (mapa ausente → mapeamento inicial; sem delta → "atualizado")
  │
  ├─ orquestrador reaciona de-classificar-* SÓ no delta → recostura o mapa
  │     (preservando entradas humanas) ............... GATE 2 (validação humana do delta)
  │
  ├─ de-reexecutar-incremental (entrada = delta já calculado; NÃO recomputa fingerprint)
  │     projeta o impacto reverso fonte→artefato de design (via cabeçalhos de
  │     procedência) e devolve o SUBCONJUNTO MÍNIMO a regenerar.
  │     ............................. GATE (plano incremental aprovado pelo humano)
  │
  ├─ orquestrador reaciona as produtoras SÓ no subconjunto afetado
  │     (sem Task aninhado, todo fan-out volta ao orquestrador)
  │
  └─ verificação de consistência pós-regeneração
        (MER cita só entidades existentes; sem relação órfã; procedência atualizada)
```

**Fronteira de responsabilidade:** o **delta de fontes** é calculado **uma
vez**, em `de-revisar-mapa`; `de-reexecutar-incremental` **consome** esse delta
(não recomputa). Qualquer **harmonização** necessária no escopo afetado é
**delegada a `de-analisar-inconsistencias`** (única editora de fontes);
nem o orquestrador nem a incremental editam fonte diretamente.

## Handoff a jusante (Fase 5)

**Handoff não-silencioso:** ao final, o orquestrador **oferece** passar o `MER.md`
para `drizzle-from-mermaid-erd`; só executa **com aprovação explícita**. O MER já
deve passar no **GATE 1** do consumidor (validação sintática do `erDiagram`), por
isso `de-produzir-mer` auto-aplica o checklist sintático antes de gravar (GATE 4b). O
orquestrador passa **o caminho do `MER.md`**, não o conteúdo.
