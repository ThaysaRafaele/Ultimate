# Catálogo de inconsistências, severidade e template do relatório

> **Reference da skill `de-analisar-inconsistencias` (Etapa 2).** Define **o que
> conta como conflito real** (catálogo **conservador**, para minimizar fadiga de
> decisão), **como medir severidade**, e o **template** do artefato de saída
> `<RAIZ_DESIGN>/_revisao/relatorio-de-inconsistencias.md`. Os alvos citados são
> os 9 de `../../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`; a estrutura
> do mapa e a gramática das âncoras de localização vêm de
> `../../mapa-artefatos-base/references/schema-mapa-artefatos.md`. Este arquivo **não
> redefine** taxonomia nem schema do mapa, só o catálogo e o relatório desta
> etapa.
>
> **Princípio do catálogo: só conflito REAL.** Uma divergência só entra no
> relatório quando dois (ou mais) artefatos de requisito afirmam algo
> **incompatível** sobre a **mesma referência de domínio** (mesma entidade,
> atributo, relação, estado, ator, regra ou fluxo). Visões **parciais**
> complementares, **redundância** consistente e diferenças de **vocabulário** que
> não mudam o domínio **não** são conflito (ver "Falsos-positivos").

## 1. Classes de inconsistência

São **seis** classes. Toda inconsistência reportada é classificada em **exatamente
uma** classe (a predominante); cite as demais como nota se aplicável.

### 1.1 Contradição direta

Dois artefatos afirmam, sobre a mesma referência de domínio, fatos
**mutuamente exclusivos**.

- **Alvos típicos:** `RN`, `ATR`, `ACT`, `REQ`.
- **Exemplo:** documento diz "desconto máximo de 10%"; protótipo/mock aplica 20%.
- **Como confirmar:** os dois lados precisam afirmar **o mesmo aspecto** com valores
  incompatíveis (não "um detalha, o outro cala", isso é omissão, §1.2).

### 1.2 Omissão (alvo examinado e ausente)

Um artefato **declara/exige** algo que outro, **tendo examinado o mesmo alvo**,
**não contempla**. Usa-se `alvos_examinados` × `alvos_presentes` do mapa: alvo
**procurado e ausente** num lado, **presente e exigido** no outro.

- **Alvos típicos:** `ATR`, `EST`, `REL`, `RN`, `ATOR`.
- **Exemplo:** história exige o estado "cancelado"; o protótipo (que examinou `EST`)
  não tem esse estado.
- **Cuidado (não inventar omissão):** se o alvo **não foi examinado** naquele
  artefato (`alvos_examinados` não o contém), **não** é omissão, é apenas
  cobertura parcial do mapa; no máximo vira **dúvida** (vale reexaminar), nunca
  conflito.

### 1.3 Ambiguidade

A mesma referência é descrita de forma **vaga ou interpretável de mais de um modo**,
a ponto de **mudar o design** conforme a leitura. Não é contradição (ninguém afirma
o oposto), mas **falta definição**.

- **Alvos típicos:** `RN`, `REQ`, `EST`, `REL`.
- **Exemplo:** "vários itens", 1:N ou N:M? (a leitura muda a cardinalidade).
- **Como confirmar:** a ambiguidade precisa ter **impacto de modelagem** (muda
  cardinalidade, estado, regra ou atributo). Ambiguidade meramente redacional, sem
  impacto, **não** entra.

### 1.4 Divergência de cardinalidade

A **cardinalidade** de uma mesma relação difere entre artefatos (1:1 × 1:N × N:M),
ou a aridade diverge.

- **Alvo típico:** `REL` (com `ENT` envolvidas).
- **Exemplo:** documento diz "um cliente tem **um** endereço"; protótipo modela
  lista de endereços (1:N).
- **Como confirmar:** cite **ambas** as entidades e a cardinalidade de cada lado.

### 1.5 Conflito de estado/status

Os **estados** de uma entidade, ou as **transições** entre eles, divergem entre
artefatos: conjunto de estados diferente, ordem/gatilho de transição incompatível,
ou um estado terminal num lado e não-terminal no outro.

- **Alvos típicos:** `EST` (com `ACT`/`RN` do gatilho).
- **Exemplo:** história: `rascunho → enviado → aprovado`; protótipo:
  `rascunho → aprovado` (sem "enviado").
- **Como confirmar:** liste os estados/transições de cada lado; aponte a divergência
  exata. Alimenta diretamente a decisão *status-como-atributo vs sub-entidade*
  (tomada depois em `de-revisar-entidades-regras`), aqui só se **harmoniza o
  conjunto de estados**, não se decide o modelo.

### 1.6 Ator divergente

**Quem** pode realizar uma ação / **sob que papel/permissão** difere entre
artefatos.

- **Alvos típicos:** `ATOR` (com `ACT`/`RN`).
- **Exemplo:** RN: "só o gestor aprova"; protótipo: botão "Aprovar" visível a
  qualquer usuário autenticado.
- **Como confirmar:** cite o ator/permissão de cada lado e a ação em disputa.

## 2. Severidade

Três níveis. A régua é o **risco de produzir um design errado e difícil de
reverter**, não o "tamanho" textual da divergência.

| Severidade | Critério                                                                                   | Exemplos típicos |
|------------|--------------------------------------------------------------------------------------------|------------------|
| **alta**   | Bloqueia modelagem coerente: o MER/entidade/relação sairia **errado** se não resolvido.    | Divergência de cardinalidade; contradição direta de RN estrutural; conjunto de estados incompatível. |
| **média**  | Não bloqueia, mas leva a **omissão ou imprecisão** relevante no design.                     | Omissão de atributo/estado exigido; ator divergente sem impacto estrutural imediato. |
| **baixa**  | Divergência **menor** ou **incerta**; risco de design errado **pequeno**.                   | Ambiguidade redacional com leve impacto; conflito só **sugerido** por achado `Confiança: baixa`. |

**Regra conservadora:** na dúvida real entre "é conflito" e "não é", **prefira
`baixa` com nota de incerteza** a `alta` "por precaução". Severidade alta exige
incompatibilidade **clara e confirmada**.

## 3. Falsos-positivos (descartar, não reportar)

**Não** são conflito (descarte na Fase 3):

- **Visão parcial complementar:** um artefato **detalha** o que o outro **resume**,
  sem contradição (ex.: história menciona "pedido"; o documento lista seus campos).
- **Redundância consistente:** a mesma informação repetida, **igual**, em dois
  artefatos.
- **Vocabulário/sinônimo:** "cliente" × "comprador" para o **mesmo** conceito, sem
  divergência de atributos/regra.
- **Granularidade de exemplo:** o protótipo mostra dados de exemplo (mock) que **não
  contradizem** a regra: mock é **dado**, não especificação normativa (ver
  `../../mapa-artefatos-base/references/seguranca-prototipo.md`).
- **Alvo não-examinado:** ausência num artefato cujo `alvos_examinados` **não** cobre
  o alvo, vira **dúvida** (reexaminar), nunca conflito.

Quando um candidato cai aqui, **registre o descarte** internamente (para o veredito),
mas **não** crie item no relatório.

## 4. Template do relatório (`relatorio-de-inconsistencias.md`)

Artefato de **fronteira versionado**: `schema_version` inicial = `1`. Persiste
em `<RAIZ_DESIGN>/_revisao/relatorio-de-inconsistencias.md`. Estrutura: **manifesto
global** + **uma entrada por conflito** (na Passagem A, `decisao: pendente` /
`acao: nenhuma`; na Passagem B, preenchidos).

### 4.1 Manifesto global (bloco YAML no topo)

```yaml
schema_version: 1                 # obrigatório. inteiro. contrato do relatório
gerado_em: 2026-06-15T14:00:00Z   # obrigatório. ISO-8601 UTC
mapa_fonte: docs/entities/_map/mapa-artefatos.md  # obrigatório. mapa cruzado
fontes_cruzadas:                  # obrigatório. lista (>=1) de caminhos de requisito cruzados
  - requisitos/pedidos.md
  - historias/checkout.md
  - prototipo/
total_conflitos: 2                # obrigatório. inteiro >= 0. == nº de entradas de conflito
resumo_severidade: { alta: 1, media: 1, baixa: 0 }  # obrigatório. contagem por severidade
```

`total_conflitos: 0` é o **relatório mínimo "harmônico"** (GATE 3): manifesto +
nenhuma entrada de conflito.

### 4.2 Entrada por conflito (heading + bloco YAML)

```
## conflito-01: Cardinalidade Pedido↔Endereço
```

```yaml
conflito:
  id: conflito-01
  classe: divergencia-cardinalidade   # enum (§1): contradicao-direta | omissao | ambiguidade | divergencia-cardinalidade | conflito-estado | ator-divergente
  severidade: alta
  alvos: [REL, ENT]
  referencia_dominio: "relação Pedido↔Endereço"
  lados:                          # >= 2; cada um: fonte, localizacao (âncora), afirmacao, evidencia (<=120 chars, sem segredo)
    - fonte: requisitos/pedidos.md
      localizacao: sec:enderecos
      afirmacao: "um cliente tem um endereço"
      evidencia: "Cada cliente possui um endereço de entrega."
    - fonte: prototipo/
      localizacao: sym:models/cliente.js#class:Cliente
      afirmacao: "cliente tem lista de endereços (1:N)"
      evidencia: "enderecos: Endereco[]"
  o_que_decidir: "Cardinalidade canônica: 1:1 ou 1:N?"
  decisao: pendente               # Passagem A: pendente; Passagem B: definição final do humano
  acao: nenhuma
  edicao: { arquivo: null, backup: null, log: null }   # só quando acao == harmonizado
  notas: ""
```

| Campo                | Obrig. | Regra                                                                                  |
|----------------------|--------|----------------------------------------------------------------------------------------|
| `id`                 | sim    | slug `[a-z0-9-]+`, único no relatório.                                                  |
| `classe`             | sim    | Um dos 6 enums de §1.                                                                   |
| `severidade`         | sim    | `alta| nenhuma>|media| nenhuma>|baixa` (§2).                                                              |
| `alvos`              | sim    | Códigos da taxonomia (∈ 9).                                                             |
| `referencia_dominio` | sim    | A entidade/relação/estado/regra/fluxo em disputa.                                       |
| `lados`              | sim    | ≥ 2; cada um com `fonte`, `localizacao` (âncora do schema), `afirmacao`, `evidencia` ≤ 120 chars **sem segredo**. |
| `o_que_decidir`      | sim    | Pergunta objetiva para o humano (Passagem A).                                           |
| `decisao`            | sim    | `pendente` na Passagem A; **definição final** do humano na Passagem B.                  |
| `acao`               | sim    | `nenhuma` (Passagem A) → `harmonizado` | nenhuma>| `seguir-com-definicao` (Passagem B).          |
| `edicao`             | cond.  | Obrigatório quando `acao == harmonizado` (arquivo, backup, log). Ver `protocolo-edicao-segura.md`. |

### 4.3 Regras de validação do relatório (gate da skill escritora)

1. **Versão.** `schema_version` presente e compatível; incompatível → encerra.
2. **Coerência de contagem.** `total_conflitos` == nº de entradas; `resumo_severidade`
   bate com as entradas.
3. **Enums.** `classe`, `severidade`, `acao` nos enums acima; `alvos` ∈ 9.
4. **Lados.** ≥ 2 lados; cada `localizacao` é uma âncora válida do schema; cada
   `evidencia` ≤ 120 chars e **sem segredo**.
5. **Persistência final (GATE 6).** Nenhum item com `decisao: pendente` no relatório
   **final**; `acao == harmonizado` exige bloco `edicao` preenchido.
6. **`id` único** no relatório.
