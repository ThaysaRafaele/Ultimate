# Template do relacionamento (`relations/<e1>_<e2>.md`)

> **Reference da skill `de-produzir-relacionamento`.** Define a **estrutura de
> saída** de um relacionamento binário: gabarito **copiável**. Todas as seções são
> **obrigatórias** (mesmo que com "nenhum/, "). Os campos vêm do inventário
> (`../../de-revisar-entidades-regras/references/criterios-validacao-entidade.md`,
> §3.3 relação e §3.5 RN) e do **MER** (cardinalidade, fonte única); o cabeçalho de
> procedência e o bloco Fontes seguem
> `../../mapa-artefatos-base/references/convencao-nomes-artefatos.md` (§4). Nome do
> arquivo = par de slugs em **ordem alfabética** unidos por `_`, reusado do
> índice do MER, nunca recalculado. **Cópia controlada** desta skill (gate de
> paridade).

---

## Esqueleto (copiar e preencher)

````markdown
```yaml
procedencia:
  schema_version: 1
  skill_geradora: de-produzir-relacionamento
  gerado_em: <ISO-8601 UTC>
  escopo: full | incremental:<subconjunto>
  fontes:
    - <caminho/da/fonte-1>
    - <caminho/da/fonte-2>
  inventario_fonte: docs/entities/_revisao/inventario-de-entidades.md
  mer_fonte: docs/entities/MER.md
```

# Relacionamento: <Entidade1> ↔ <Entidade2> (`<slug_e1>_<slug_e2>`)

## Significado da relação (obrigatória)

<semantica: o que a ligação representa no contexto da aplicação, em 1–3 frases.>

## Entidades participantes (obrigatória)

| Entidade (slug) | Papel no relacionamento |
|-----------------|--------------------------|
| <slug_e1>       | <papel do lado 1>       |
| <slug_e2>       | <papel do lado 2>       |

> Slugs em **ordem alfabética** (= nome do arquivo). Determinístico e localizável por
> qualquer das entidades.

## Cardinalidade (obrigatória)

- **Classe:** `<1:1 | 1:N | N:M>`: **lida do MER** (fonte única de cardinalidades).
- **Linha do MER:** `<trecho do erDiagram, ex.: CLIENTE ||--o{ PEDIDO : faz>`.

> Mapeamento notação↔classe conforme
> `../../drizzle-from-mermaid-erd/references/mermaid-erd-spec.md` (dialeto único,
> dono da tabela notação↔classe). Divergência entre o MER e o inventário (ou
> notação fora do dialeto) → a skill **para e devolve ao orquestrador**; **nunca**
> reescreve o MER.

## Direcionalidade do fluxo de informação (obrigatória)

- **Valor:** `<direcional (origem→destino) | bidirecional>`.
- **Quando `direcional`:** **origem** = `<slug>`, **destino** = `<slug>`.
- **Evidência:** <o que sustenta a direção (fonte#ancora). Sem evidência, a skill
  devolve a dúvida ao orquestrador, não preenche por palpite.>

## Atributos de ligação (obrigatória)

| Atributo de ligação | Tipo | Fonte |
|---------------------|------|-------|
| <nome>              | <tipo | nenhuma>| não evidenciado> | <fonte#ancora> |

<!-- Relevante em N:M / associativa. Se nenhum: linha única "Nenhum atributo de ligação." -->

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

1. **Nome do arquivo** = `<slug_e1>_<slug_e2>` em **ordem alfabética**. Ex.:
   `cliente` + `pedido` → `cliente_pedido.md`. Nunca `pedido_cliente.md`.
2. **Cardinalidade vem do MER**, não do palpite. A skill **lê** a linha do
   `erDiagram` e a cita. Divergência MER×inventário → devolve ao orquestrador (GATE 2
   da skill); **não** reescreve o MER.
3. **Direcionalidade é zero-presunção**: só afirmar `direcional`/`bidirecional`
   com evidência. Sem evidência → a skill **não grava** e devolve a dúvida (GATE 3).
4. **N-ário (aridade > 2)** **nunca** vira um arquivo com 3+ slugs: é traduzido em
   **entidade associativa + N relações binárias** (cada uma um arquivo deste
   template). A associativa é **proposta** ao orquestrador/`de-produzir-mer` e só
   existe após confirmação no MER (`relations/` permanece sempre binário).
5. **Bloco RN é obrigatório** (RN é cidadã de primeira classe): sem RN vinculada,
   manter a seção com a nota explícita, **não** remover.
6. **Todo achado cita a fonte + localização relativa**; **sem** transcrever segredos.
   O `sha256` não aparece aqui (vive no mapa).
