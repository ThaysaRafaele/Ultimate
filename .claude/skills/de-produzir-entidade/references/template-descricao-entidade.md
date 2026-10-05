# Template da descrição de entidade (`descriptions/<slug>.md`)

> **Reference da skill `de-produzir-entidade`.** Define a **estrutura de saída** de
> uma descrição de entidade, gabarito **copiável**. As seções marcadas
> **(obrigatória)** sempre existem (mesmo que com "nenhum/, "); o **fluxograma de
> estado** é **opcional** (só com transições evidenciadas). Os campos vêm do
> inventário (`../../de-revisar-entidades-regras/references/criterios-validacao-entidade.md`,
> §3.2 entidade e §3.5 RN); o cabeçalho de procedência e o bloco Fontes seguem
> `../../mapa-artefatos-base/references/convencao-nomes-artefatos.md` (§4). Slug reusado do índice entidade→slug do MER,
> nunca recalculado. **Cópia controlada** desta skill (gate de paridade).

---

## Esqueleto (copiar e preencher)

````markdown
```yaml
procedencia:
  schema_version: 1
  skill_geradora: de-produzir-entidade
  gerado_em: <ISO-8601 UTC>
  escopo: full | incremental:<subconjunto>
  fontes:
    - <caminho/da/fonte-1>
    - <caminho/da/fonte-2>
  inventario_fonte: docs/entities/_revisao/inventario-de-entidades.md
  mer_fonte: docs/entities/MER.md
```

# Entidade: <Nome> (`<slug>`)

## O que é (obrigatória)

<papel_dominio: o que a entidade representa no contexto da aplicação, em 1–3 frases.>

- **Faceta de ator:** <quando `e_ator: true`, descreve o papel de ator; senão "não é ator".>

## Atributos (obrigatória)

| Atributo | Tipo | Obrigatório | RN | Fonte (localização relativa) |
|----------|------|-------------|----|------------------------------|
| <nome>   | <tipo | nenhuma>| não evidenciado> | <sim | nenhuma>| não | nenhuma>| não evidenciado> | <ids de RN | nenhuma>|| nenhuma> | <fonte#ancora> |

## Estágios / status (obrigatória)

**Modelagem de estado (decisão congelada no inventário):**
`<atributo-status | sub-entidade-historico | sem-estado>`.
<justificativa do inventário (resumo).>

- **Estados possíveis:** <valores[] | nenhuma>| "sem ciclo de estados relevante">.
- **Modelado como:** <atributo `status`/`situacao` na própria entidade  | sub-entidade
  de histórico `<sub_entidade>` (entidade do MER que registra cada transição)>.

| De | Para | Gatilho (ACT) | RN | Fonte |
|----|------|---------------|----|-------|
| <estado> | <estado> | <gatilho> | <ids de RN | nenhuma>|| nenhuma> | <fonte#ancora> |

<!-- Fluxograma de estado OPCIONAL: incluir SÓ com transições evidenciadas. -->
```mermaid
stateDiagram-v2
  [*] --> <estado_inicial>
  <estado_inicial> --> <proximo>: <gatilho>
  <proximo> --> [*]
```

## Ações (obrigatória)

| Ação | Ator | Muda estado? | Fonte |
|------|------|--------------|-------|
| <nome> | <ator> | <sim | nenhuma>| não> | <fonte#ancora> |

## Regras de negócio aplicáveis (RN): (obrigatória)

| RN (id) | Enunciado | Fonte |
|---------|-----------|-------|
| <rn-id> | <enunciado curto> | <fonte#ancora> |

<!-- Se nenhuma RN vinculada: manter a seção com a linha "Nenhuma RN vinculada no inventário." -->

## Fontes (obrigatória)

- <caminho/da/fonte-1>, <ancora(s): sec:/sym:/...>
- <caminho/da/fonte-2>, <ancora(s)>
````

---

## Regras de preenchimento

1. **Slug no título e no nome do arquivo** = `entidade.id` do inventário (= entrada
   da tabela entidade→slug do MER). Nunca recalcular nem traduzir.
2. **Tipo/obrigatoriedade não evidenciados** → registrar "não evidenciado", **nunca**
   preencher por palpite (lacuna não-bloqueante do inventário; zero presunção).
3. **Decisão de estado é consumida, não tomada**: copiar `decisao` +
   `justificativa` do bloco `modelagem_estado`. Entidade com estados **sem** decisão
   congelada → a skill **não grava** e devolve ao orquestrador (GATE 3 da skill).
4. **Sub-entidade de histórico** só é citada quando já **existe no MER**; ela ganha
   seu **próprio** `descriptions/<slug_sub>.md`. Sub-entidade ausente do MER →
   devolve ao orquestrador/`de-produzir-mer` (não edita o MER).
5. **Fluxograma `stateDiagram-v2`** é **opcional**: só com `transicoes` evidenciadas
   e após passar o checklist sintático mínimo (começa com `stateDiagram-v2`; `[*] -->`
   inicial; transições `A --> B: gatilho`; estados ∈ `valores[]`). Caso contrário,
   **omitir o bloco** e manter a lista textual.
6. **Bloco RN é obrigatório** (RN é cidadã de primeira classe): se não há RN
   vinculada, manter a seção com a nota explícita, **não** remover a seção.
7. **Todo achado cita a fonte + localização relativa** (rastreabilidade direta);
   **sem** transcrever segredos. O `sha256` não aparece aqui (vive no mapa).
