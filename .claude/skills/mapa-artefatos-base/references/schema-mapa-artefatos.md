# Schema do mapa de artefatos e do fragmento de classificação

> **Fonte única.** Esta é a definição **canônica** da estrutura do
> mapa `docs/entities/_map/mapa-artefatos.md` **e** do **fragmento** que cada
> skill de classificação devolve ao orquestrador para ser costurado no mapa. O
> fragmento usa **exatamente** o mesmo vocabulário de campos do mapa, nenhuma
> skill define um schema próprio. Toda skill que lê ou escreve o mapa/fragmento
> cita este arquivo por caminho relativo
> (`../mapa-artefatos-base/references/schema-mapa-artefatos.md`).
>
> Os 9 alvos referidos aqui são os de `taxonomia-alvos-fixos.md`. O cálculo de
> `marca_mudanca.sha256`/`bytes`/`linhas` é o de `fingerprint-e-delta.md`.

## Visão geral do arquivo `mapa-artefatos.md`

O mapa é **um único arquivo** markdown, composto de:

1. **Manifesto global** no topo: um bloco ` ```yaml ` com metadados do mapa.
2. **Uma seção por artefato**: um heading `## <id>, <caminho>` seguido de
   (a) um bloco ` ```yaml ` "cabeçalho do artefato" e (b) uma tabela "Achados por
   alvo fixo".

Nada além disso é estrutural. Comentários humanos em prosa são permitidos entre
seções, mas **os blocos YAML e a tabela são o contrato**, é o que as skills leem.

---

## 1. Manifesto global

Primeiro bloco do arquivo. Campos:

```yaml
schema_version: 1
gerado_em: 2026-06-14T10:30:00Z
raiz_requisitos: [requisitos/, prototipo/]
total_artefatos: 7
```

| Campo            | Obrig. | Tipo            | Regra                                                              |
|------------------|--------|-----------------|-------------------------------------------------------------------|
| `schema_version` | sim    | inteiro         | Deve ser compatível com o leitor (ver "Contrato de versão").      |
| `gerado_em`      | sim    | string ISO-8601 | UTC, com `Z` ou offset explícito.                                 |
| `raiz_requisitos`| sim    | lista de string | ≥ 1 caminho relativo à raiz do repo; de onde vieram os artefatos. |
| `total_artefatos`| sim    | inteiro ≥ 0     | Deve igualar o nº de seções `## <id>, <caminho>` no arquivo.     |

---

## 2. Seção de artefato

Para cada artefato, um heading e dois blocos:

```
## <id>: <caminho>
```

O `<id>` e o `<caminho>` no heading **repetem** os campos `id`/`caminho` do bloco
YAML abaixo (redundância proposital, para leitura humana e para localizar a seção
rapidamente). Em divergência, o **bloco YAML prevalece**.

### 2.1 Cabeçalho do artefato (bloco YAML)

```yaml
artefato:
  id: pedido-requisitos            # slug único no mapa
  caminho: requisitos/pedidos.md
  tipo: documento
  parte_de: null
  titulo: Requisitos de Pedidos
  marca_mudanca: { sha256: 3b1f…c9, bytes: 8421, linhas: 212, mtime_iso: 2026-06-14T09:58:00Z, fonte: agente }
  revisao_humana: { status: pendente, data: null, por: null }
  alvos_presentes: [REQ, ENT, ATR]
  alvos_examinados: [REQ, RN, ENT, ATR, ACT, EST, REL, ATOR, FLX]
  notas: ""
```

Regras de cada campo, inclusive subcampos de `marca_mudanca`/`revisao_humana`, na
tabela abaixo.

| Campo                  | Obrig. | Tipo / enum                                  | Regra                                                                                 |
|------------------------|--------|----------------------------------------------|---------------------------------------------------------------------------------------|
| `id`                   | sim    | slug `[a-z0-9-]+`                            | **Único** em todo o mapa.                                                              |
| `caminho`              | sim    | string                                       | Relativo à raiz do repo; arquivo real.                                                 |
| `tipo`                 | sim    | `documento| nenhuma>|codigo| nenhuma>|prototipo| nenhuma>|diagrama`     | Fora do enum → inválido.                                                               |
| `parte_de`            | não    | id existente | nenhuma>| `null`                       | Preenchido **apenas** em arquivos internos de um protótipo; aponta para um `tipo: prototipo`. |
| `titulo`               | sim    | string                                       |,                                                                                     |
| `marca_mudanca.sha256` | sim    | hex (64)                                     | sha256 do conteúdo **normalizado**; para protótipo-índice (dir) e arquivo não-analisável, o **sentinela** de 64 zeros (ver `fingerprint-e-delta.md` §1.4). |
| `marca_mudanca.bytes`  | sim    | inteiro ≥ 0                                  | Bytes do conteúdo normalizado; `0` no caso do sentinela (§1.4).                        |
| `marca_mudanca.linhas` | sim    | inteiro ≥ 0                                  | Linhas do conteúdo normalizado; `0` no caso do sentinela (§1.4).                       |
| `marca_mudanca.mtime_iso` | não | string ISO-8601 | nenhuma>| `null`                   | Apenas dica; **nunca** decide delta.                                                   |
| `marca_mudanca.fonte`  | sim    | `agente| nenhuma>|humano`                             | `humano` marca entrada criada/editada à mão (preservada na re-execução).              |
| `revisao_humana.status`| sim    | `pendente| nenhuma>|aprovado| nenhuma>|ajustado`               | `aprovado`/`ajustado` são preservados (ver fingerprint → preservação).                |
| `revisao_humana.data`  | cond.  | string ISO-8601 | nenhuma>| `null`                    | Obrigatório se `status != pendente`.                                                   |
| `revisao_humana.por`   | cond.  | string | nenhuma>| `null`                             | Obrigatório se `status != pendente`.                                                   |
| `alvos_presentes`      | sim    | lista de códigos                             | Subconjunto dos 9 códigos; **encontrados**. Pode ser `[]`.                             |
| `alvos_examinados`     | sim    | lista de códigos                             | Subconjunto dos 9 códigos; **procurados** (mesmo que ausentes). `presentes ⊆ examinados`. |
| `notas`                | não    | string                                       |,                                                                                     |

> **`alvos_presentes` × `alvos_examinados`.** `presentes` = o que **foi achado**;
> `examinados` = o que **foi procurado**. A diferença (`examinados − presentes`)
> distingue "procurei e não há" de "nem procurei", essencial para detectar
> inconsistências por **omissão** na Etapa 2. Invariante: `presentes ⊆ examinados`.

### 2.2 Tabela "Achados por alvo fixo"

Imediatamente após o bloco YAML do artefato. **Uma linha por achado.** Alvo
ausente é **omitido** da tabela (ausência = não estar em `alvos_presentes[]`; não
se cria linha vazia). Colunas, nesta ordem:

```
### Achados por alvo fixo

| Alvo | Localização relativa | Resumo | Confiança | Evidência |
|------|----------------------|--------|-----------|-----------|
| ENT  | sym:lib/schema.ts#class:pedidos | Entidade Pedido (pedido de compra) | alta | export const pedidos = pgTable("pedidos", { |
| ATR  | sym:lib/schema.ts#class:pedidos | Campos: id, total, status, cliente_id | alta | total: numeric("total") |
| EST  | sym:lib/pedidos-repo.ts#fn:aprovarPedido | rascunho → aprovado ao aprovar | media | .set({ status: "aprovado" }) |
```

| Coluna                 | Regra                                                                                          |
|------------------------|------------------------------------------------------------------------------------------------|
| `Alvo`                 | **Um** dos 9 códigos (`taxonomia-alvos-fixos.md`). Fora dos 9 → entrada inválida.              |
| `Localização relativa` | Âncora conforme "Gramática das âncoras" abaixo. Nunca offset de linha como chave primária.      |
| `Resumo`               | ≤ uma frase. Para REL/ENT+ATOR/EST: cite a contraparte/estados no resumo.                       |
| `Confiança`            | enum `alta| nenhuma>|media| nenhuma>|baixa`. `baixa` = candidata a inconsistência na Etapa 2.                     |
| `Evidência`            | Trecho curto **citável do próprio arquivo**, **≤ 120 caracteres**. Sem segredos.      |

- Coincidências de alvo (ACT+EST, ENT+ATOR) geram **duas linhas** com a **mesma**
  localização (ver taxonomia → desambiguação).
- Se a tabela tiver linhas com códigos que não constam em `alvos_presentes[]`, ou
  vice-versa, a entrada está **inconsistente** → a skill escritora rejeita (para e
  reporta).

---

## 3. Fragmento de classificação (retorno do subagente)

Quando uma skill de classificação roda em subagente, ela **não escreve no mapa**:
devolve ao orquestrador um **fragmento** com **exatamente** o mesmo vocabulário,
o bloco YAML `artefato:` (seção 2.1) **mais** as linhas da tabela de achados
(seção 2.2). O orquestrador costura o fragmento no mapa **sem reler o artefato**.

Forma canônica do fragmento (um por artefato classificado):

```yaml
artefato:
  id: <slug>
  caminho: <relativo>
  tipo: <enum>
  parte_de: <id|null>
  titulo: <string>
  marca_mudanca: { sha256: <hex>, bytes: <int>, linhas: <int>, mtime_iso: <iso|null>, fonte: agente }
  revisao_humana: { status: pendente, data: null, por: null }
  alvos_presentes: [<códigos>]
  alvos_examinados: [<códigos>]
  notas: <string>
```
```
| Alvo | Localização relativa | Resumo | Confiança | Evidência |
|------|----------------------|--------|-----------|-----------|
| <código> | <âncora> | <resumo> | <conf> | <evidência> |
```

Regras adicionais do fragmento:

- O fragmento recém-classificado sempre vem com `revisao_humana.status: pendente`
  e `marca_mudanca.fonte: agente`. O orquestrador/`de-revisar-mapa` é que
  **preserva** entradas humanas existentes ao costurar (ver fingerprint →
  preservação).
- O fragmento é **enxuto**: YAML + linhas de tabela, **sem** colar
  parágrafos do artefato nem blocos de código. Evidência é trecho ≤ 120 chars.
- Pendências/ambiguidades **não vão** no fragmento como achados inventados: o
  subagente devolve, em separado, uma **lista de dúvidas** ao orquestrador (zero
  presunção), o fragmento só carrega o que foi efetivamente classificado.

---

## 4. Gramática das âncoras de localização

A `Localização relativa` é **textual e resistente a edição**, nunca um offset de
linha como chave primária. Duas famílias:

### Texto (artefatos `documento`/`diagrama` em markdown)

| Âncora                         | Quando usar                                          | Exemplo                         |
|--------------------------------|-----------------------------------------------------|---------------------------------|
| `sec:<slug-do-título>`         | Achado dentro de uma seção com heading.             | `sec:requisitos-funcionais`     |
| `sec:<slug>#<n>`               | Heading repetido: slug + nº de ocorrência (1-based). | `sec:validacoes#2`             |
| `linha:<n>`                    | **Fallback**, item solto sem heading.              | `linha:48`                      |

`slug` = minúsculas, sem acento/diacrítico, espaços→hífen, kebab-case (mesma regra
de slug das entidades).

### Código (artefatos `codigo`; arquivos internos de `prototipo`)

Forma: `sym:<arquivo>#<qualificador>`, onde `<arquivo>` é relativo à raiz do repo
e `<qualificador>` é **um** de:

| Qualificador                  | Quando usar                              | Exemplo                                   |
|-------------------------------|------------------------------------------|-------------------------------------------|
| `route:<MÉTODO caminho>`      | Route handler (`app/api/**/route.ts`).   | `sym:app/api/pedidos/route.ts#route:POST /api/pedidos` |
| `fn:<nome>`                   | Função/handler de módulo.                | `sym:lib/pedidos-repo.ts#fn:aprovarPedido` |
| `class:<Nome>`                | Classe/tabela `pgTable`/componente.      | `sym:lib/schema.ts#class:pedidos`       |
| `class:<Nome>.<metodo>`       | Método de uma classe.                    | `sym:lib/schema.ts#class:pedidos.aprovar` |
| `mod:<caminho>`               | Módulo inteiro (sem unidade específica). | `sym:app/pedidos/page.tsx#mod:app/pedidos/page.tsx` |
| `linha:<n>`                   | **Fallback**, nenhum qualificador simbólico se aplica. | `sym:next.config.ts#linha:12`     |

Notas:

- O prefixo `sym:` sempre precede o `<arquivo>#<qualificador>`. Para `linha:` em
  código, mantenha o `sym:<arquivo>#linha:<n>` (a âncora é dentro de um arquivo).
- Em `route:`, o método vai em maiúsculas e o caminho como declarado.
- Escolha do qualificador por alvo: ver `taxonomia-alvos-fixos.md` → "Como
  registrar a localização relativa por alvo".

---

## 5. Regras de validação de entrada (gate da skill escritora)

Toda skill que **escreve** no mapa ou **emite/consome** um fragmento valida, antes
de gravar/aceitar. Falha em qualquer item → **para e reporta/pergunta** (zero
presunção); nunca grava parcial nem "conserta" silenciosamente.

1. **Versão.** `schema_version` presente e compatível com o leitor. Incompatível →
   encerra com mensagem clara.
2. **Campos obrigatórios.** Todos os marcados "sim"/"cond." na seção 2.1 presentes
   (e os condicionais quando a condição se aplica). Ausente → rejeita.
3. **Enums.** `tipo ∈ {documento, codigo, prototipo, diagrama}`;
   `marca_mudanca.fonte ∈ {agente, humano}`; `revisao_humana.status ∈ {pendente,
   aprovado, ajustado}`; `Confiança ∈ {alta, media, baixa}`. Fora do enum → rejeita.
4. **Alvos no vocabulário.** Todo código em `alvos_presentes`, `alvos_examinados`
   e na coluna `Alvo` é um dos **9** da taxonomia. Código fora dos 9 → rejeita.
5. **Coerência de alvos.** `alvos_presentes ⊆ alvos_examinados`; todo código que
   aparece em alguma linha da tabela está em `alvos_presentes`, e vice-versa.
6. **Unicidade de `id`.** Nenhum outro artefato no mapa usa o mesmo `id`. Colisão →
   rejeita (não renumera sozinho).
7. **`parte_de` válido.** Se preenchido, aponta para um `id` existente de
   `tipo: prototipo`. Pai inexistente → rejeita.
8. **Evidência segura.** `Evidência` ≤ 120 chars e **não** contém segredo
   (`.env`, token, chave), segredo é reportado só por **localização**.
9. **`total_artefatos`.** No manifesto, igual ao nº de seções de artefato.

---

## 6. Contrato de versão (`schema_version`)

- Valor inicial: **`schema_version: 1`**, corresponde a esta estrutura e aos 9
  alvos de `taxonomia-alvos-fixos.md` exatamente como definidos hoje.
- **Mesma versão** (compatível): acréscimo de campo **opcional**, nova pista de
  detecção na taxonomia, novo exemplo. Leitores antigos continuam válidos.
- **Bump de versão** (incompatível): 10º alvo; campo **obrigatório** novo; mudança
  de enum (`tipo`/`status`/`fonte`/`confiança`); mudança da gramática de âncoras;
  remoção/renomeação de campo. Acompanha **nota de migração** neste arquivo.
- Todo **leitor** compara `schema_version` e **encerra com mensagem clara** se
  incompatível, em vez de adivinhar. O mesmo contrato vale para os demais
  artefatos de fronteira (MER, inventário, relatório).
