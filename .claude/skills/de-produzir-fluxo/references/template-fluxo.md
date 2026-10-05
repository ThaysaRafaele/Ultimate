# Template do fluxo / caso de uso (`flows/<slug>.md`)

> **Reference da skill `de-produzir-fluxo`.** Define a **estrutura de saída** de um
> caso de uso / fluxo, gabarito **copiável**. As seções marcadas **(obrigatória)**
> sempre existem (mesmo que com "nenhum/, "); **pré/pós-condições** são
> não-bloqueantes ("não evidenciado" quando ausentes). Os campos vêm do inventário
> (`../../de-revisar-entidades-regras/references/criterios-validacao-entidade.md`, §3.4
> fluxo e §3.5 RN); o cabeçalho de procedência e o bloco Fontes seguem
> `../../mapa-artefatos-base/references/convencao-nomes-artefatos.md` (§4). Slug =
> `fluxo.id` do inventário, nunca recalculado. **Cópia controlada** desta skill
> (gate de paridade).

---

## Esqueleto (copiar e preencher)

````markdown
```yaml
procedencia:
  schema_version: 1
  skill_geradora: de-produzir-fluxo
  gerado_em: <ISO-8601 UTC>
  escopo: full | incremental:<subconjunto>
  fontes:
    - <caminho/da/fonte-1>
    - <caminho/da/fonte-2>
  inventario_fonte: docs/entities/_revisao/inventario-de-entidades.md
  mer_fonte: docs/entities/MER.md
```

# Caso de uso: <Nome do fluxo> (`<slug>`)

## Objetivo (obrigatória)

<objetivo: o que o caso de uso realiza no domínio, em 1–2 frases.>

## Atores (obrigatória)

| Ator | Papel no caso de uso | Fonte |
|------|----------------------|-------|
| <ator> | <papel> | <fonte#ancora> |

## Pré-condições / pós-condições

- **Pré-condições:** <lista | nenhuma>| "não evidenciado">.
- **Pós-condições:** <lista | nenhuma>| "não evidenciado">.

## Entidades e relações envolvidas (obrigatória)

| Item | Slug / par | Papel no fluxo |
|------|------------|----------------|
| Entidade | <slug> | <papel> |
| Relação  | <slug_e1>_<slug_e2> | <relação afetada> |

## Passos (obrigatória)

| Ordem | Ação | Entidade | Efeito (ACT/EST) | Fonte |
|-------|------|----------|------------------|-------|
| 1 | <acao> | <slug> | <ACT | nenhuma>| EST (muda estado)> | <fonte#ancora> |

## Regras de negócio aplicáveis (RN): (obrigatória)

| RN (id) | Enunciado | Fonte |
|---------|-----------|-------|
| <rn-id> | <enunciado curto> | <fonte#ancora> |

<!-- Se nenhuma RN vinculada: manter a seção com a linha "Nenhuma RN vinculada no inventário." -->

## Fontes (obrigatória)

- <caminho/da/fonte-1>, <ancora(s)>
- <caminho/da/fonte-2>, <ancora(s)>
````

---

## Regras de preenchimento

1. **Slug no título e no nome do arquivo** = `fluxo.id` do inventário. Nunca
   recalcular nem traduzir.
2. **Atores e entidades já vêm resolvidos** do inventário (integridade referencial
   §3.6 regra 7): toda entidade/ator citado **existe** no MER/inventário. Referência
   pendurada → a skill **não grava** e devolve ao orquestrador (GATE 2 da skill).
3. **Efeito de cada passo:** `muda_estado: true` no inventário é registrado como
   **EST** (mudança de estado de entidade); os demais como **ACT**. **Não** presumir
   efeito de estado não evidenciado.
4. **Relações afetadas:** registrar o par alfabético (`<e1>_<e2>`) quando o fluxo
   atravessa uma relação existente. Não inventar relação inexistente no inventário/MER.
5. **Pré/pós-condições** são não-bloqueantes: "não evidenciado" quando ausentes,
   **nunca** preenchidas por palpite (zero presunção).
6. **Bloco RN é obrigatório** (RN é cidadã de primeira classe): sem RN vinculada,
   manter a seção com a nota explícita, **não** remover.
7. **Todo passo/efeito cita a fonte + localização relativa**; **sem** transcrever
   segredos. O `sha256` não aparece aqui (vive no mapa).
