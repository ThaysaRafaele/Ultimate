# Convenção de nomes e saída dos artefatos de design

> **Dono único na base.** Define as convenções **comuns** das skills produtoras
> (`de-produzir-entidade`, `de-produzir-relacionamento`, `de-produzir-fluxo`):
> nomenclatura de arquivo, cabeçalho de procedência, idempotência, manifesto de retorno,
> tratamento de órfãos e **não-edição cruzada do MER**. As três produtoras **citam**
> este arquivo (em vez de copiá-lo) e escrevem **um único arquivo-alvo**, sob `RAIZ_DESIGN`
> (default `docs/entities`), na árvore interna **imutável**.
>
> **Não redefine** taxonomia, schema do mapa nem schema do inventário, vivem em
> `taxonomia-alvos-fixos.md`, `schema-mapa-artefatos.md` e
> `../../de-revisar-entidades-regras/references/criterios-validacao-entidade.md`. Em
> divergência, os destinos fixos sob `RAIZ_DESIGN` e a nomenclatura aqui prevalecem.

---

## 1. Raiz de saída e árvore imutável

Toda skill produtora escreve **sob `RAIZ_DESIGN`** (uma única variável de raiz,
default `docs/entities`). A árvore interna é **fixa** e **não configurável** pelas
skills:

```
<RAIZ_DESIGN>/
  MER.md                          # fonte única de entidades e cardinalidades (de-produzir-mer)
  descriptions/<entidade>.md      # 1 por entidade            (de-produzir-entidade)
  relations/<e1>_<e2>.md          # 1 por relacionamento binário (de-produzir-relacionamento)
  flows/<fluxo>.md                # 1 por caso de uso / fluxo (de-produzir-fluxo)
```

Nenhuma skill produtora cria subpastas novas, renomeia as existentes nem escreve
fora de `RAIZ_DESIGN`. Isso mantém o **gate de isolamento** do harness efetivo
(Fase 13): com `RAIZ_DESIGN` apontando ao sandbox, o `/docs/entities` real nunca é
tocado.

## 2. Slug

`slug(nome)` é a forma canônica usada em **todo** nome de arquivo e id de artefato:

- minúsculas;
- **sem acento/diacrítico** (`ç`→`c`, `ã`→`a`, …);
- espaços e separadores → **hífen** (`-`);
- **singular**;
- **kebab-case** (`[a-z0-9-]+`).

Exemplos: `"Processo Administrativo"` → `processo-administrativo`; `"Pedido"` →
`pedido`; `"Nota de Empenho"` → `nota-de-empenho`.

**Origem única do slug.** Os slugs **já vêm prontos** do inventário
(`entidade.id`, `fluxo.id`) e são **reusados** no `MER.md` como **tabela
entidade→slug** (índice canônico). As skills produtoras **reusam** esse slug,
**nunca** recalculam, traduzem nem renomeiam. Se o nome de um arquivo-alvo exigir
um slug que **não** está no índice do MER nem no inventário, isto é uma divergência
→ **devolve ao orquestrador** (zero presunção), não inventa o slug.

## 3. Nome de arquivo por tipo de artefato

### 3.1 Entidade → `descriptions/<slug>.md`

Um arquivo por entidade, nomeado pelo slug da entidade. Quando o inventário decidiu
`modelagem_estado.decisao: sub-entidade-historico`, a **sub-entidade de histórico** é,
ela mesma, **uma entidade do MER** e ganha **seu próprio** `descriptions/<slug_sub>.md`,
produzido em um **despacho separado** de `de-produzir-entidade` (o orquestrador
despacha 1 por entidade), **nunca** como efeito colateral do arquivo da entidade-mãe
(§5, um único arquivo-alvo por execução).

### 3.2 Relacionamento → `relations/<slug_e1>_<slug_e2>.md` (par alfabético)

- **Sempre binário.** Um arquivo por relação **entre exatamente duas entidades**.
- Os dois slugs são **ordenados alfabeticamente** e unidos por `_`, determinístico
  e localizável por qualquer das entidades. Ex.: `cliente` + `pedido` →
  `relations/cliente_pedido.md` (nunca `pedido_cliente.md`).
- A **direcionalidade** do fluxo de informação fica no **conteúdo** (campo do
  template), **nunca** no nome do arquivo.

### 3.3 Relacionamento N-ário (aridade > 2) → entidade associativa + binárias

`relations/` é **sempre binário**. Uma relação N-ária (`n_aria: true` no inventário,
`entidades` com ≥ 3 slugs) é **sempre** resolvida como:

1. uma **entidade associativa** com seu próprio `descriptions/<assoc>.md`; e
2. **N relacionamentos binários** em `relations/`, cada um ligando a associativa a
   uma das participantes (par alfabético).

A criação da entidade associativa é **decisão de modelagem** que pertence ao MER
(fonte única de entidades): a produtora **não** materializa a associativa por conta
própria, **devolve ao orquestrador/`de-produzir-mer`** a proposta de nome/slug e
aguarda. O exemplo da especificação `entity1_entity2_entity3.md` é tratado por essa
tradução; **nunca** se cria um arquivo de relação com três slugs.

### 3.4 Fluxo / caso de uso → `flows/<slug>.md`

Um arquivo por caso de uso, nomeado por `slug(nome_do_caso_de_uso)` (= `fluxo.id`
do inventário).

## 4. Cabeçalho de procedência obrigatório: bloco "Fontes"

**Todo** artefato de design começa com um cabeçalho de procedência (bloco
```yaml`procedencia`), é o que permite ao incremental projetar quais artefatos uma
fonte alterada afeta. Estrutura mínima:

```yaml
procedencia:
  schema_version: 1            # artefatos de fronteira versionados; demais: omitível
  skill_geradora: de-produzir-entidade   # nome canônico da skill (nomes-canonicos.md)
  gerado_em: <ISO-8601 UTC>
  escopo: full | incremental:<subconjunto>
  fontes:                      # caminhos relativos das fontes (das origens do inventário); SEM sha256
    - requisitos/pedidos.md
    - prototipo/
  inventario_fonte: docs/entities/_revisao/inventario-de-entidades.md
  mer_fonte: docs/entities/MER.md          # quando o MER foi consultado como índice/coerência
```

- `fontes[]` reusa os **caminhos** das `origem` do inventário: **sem** duplicar o
  `sha256` (o fingerprint vive **só** no mapa).
- Além do cabeçalho, **todo achado** dentro do artefato cita a **fonte + localização
  relativa** (âncoras de `schema-mapa-artefatos.md`:
  `sec:`/`sym:`/`route:`/`fn:`/`class:`/`mod:`/`linha:`), reusadas do inventário,
  rastreabilidade direta ao arquivo de origem, sem reproduzir o conteúdo.

## 5. Idempotência (sobrescreve só o alvo)

Cada produtora escreve **um único arquivo-alvo** e é **idempotente**: regerar
sobrescreve **apenas** aquele arquivo, sem efeito colateral em outros artefatos de
design. Nunca toca o `MER.md`, o inventário, o mapa, as fontes nem os artefatos de
outras entidades/relações/fluxos. Reexecuções (inclusive incrementais) reescrevem
só o subconjunto-alvo.

## 6. Não-edição cruzada do MER

O `MER.md` é a **fonte única de entidades e cardinalidades**. As produtoras de
entidade/relacionamento/fluxo **nunca** o editam por conta própria. Ao descobrir:

- uma **sub-entidade nova** (ex.: decisão de histórico que introduz entidade);
- uma **divergência de cardinalidade** entre o que o artefato precisa e o MER;
- uma **entidade associativa** necessária para um N-ário;

a skill **não** corrige nem reescreve o MER (nem o inventário, nem outra fonte):
**devolve o achado ao orquestrador**, que o encaminha a `de-produzir-mer` (e, se
preciso, a `de-revisar-entidades-regras`). A produtora **só** prossegue com o que o
MER/inventário evidenciam ou com uma definição **re-entregue** pelo orquestrador.

## 7. Tratamento de órfãos (não apaga)

Um **órfão** é um artefato de design existente (`descriptions/*`, `relations/*`,
`flows/*`) cuja entidade/relação/fluxo **sumiu** do MER/inventário (fonte removida
ou renomeada). Órfãos **não são apagados** pela skill: a produtora **reporta o
órfão ao orquestrador** para decisão humana (manter, arquivar ou remover). Remoção
de artefato de design é decisão humana, nunca automática (zero presunção).

## 8. Manifesto de retorno enxuto ao orquestrador

Toda produtora roda **em subagente** e devolve ao orquestrador um **manifesto
pequeno**: **nunca** cola o conteúdo do artefato gerado nem trechos das fontes:

```yaml
manifesto:
  skill: de-produzir-entidade
  alvo: descriptions/pedido.md       # caminho do único arquivo escrito (ou null se não gravou)
  status: gravado | nao-gravado
  contagens: { atributos: 4, estados: 3, rn: 2 }   # contadores pequenos, conforme a skill
  duvidas: []                        # lacunas/divergências devolvidas (zero presunção)
  cruzados: []                       # achados devolvidos ao orquestrador (sub-entidade nova, divergência de cardinalidade, órfão)
```

Se um gate falhar (lacuna, divergência com o MER, fonte ausente), o `status` é
`nao-gravado`, `alvo: null`, e as `duvidas`/`cruzados` carregam o que o orquestrador
precisa resolver, o subagente **não pergunta ao usuário**, **não aciona outras
skills** (sem `Task` aninhado) e **não grava** artefato parcial.

## 9. Segurança herdada

Postura herdada: `postura-global.md` (somente-leitura; mock = dado, URLs não seguidas;
segredos só por **localização**, nunca transcritos) e, ao confirmar trecho dentro de um
protótipo, `seguranca-prototipo.md`.
