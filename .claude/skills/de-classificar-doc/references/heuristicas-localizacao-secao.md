# Heurísticas de localização por seção (documentos de texto)

> **Uso.** Reference da skill `de-classificar-doc`. Detalha **como reconhecer** as
> âncoras de localização de cada achado em documentos reais. A **gramática** das
> âncoras (`sec:<slug>`, `sec:<slug>#<n>`, `linha:<n>`) é a de
> `../../mapa-artefatos-base/references/schema-mapa-artefatos.md` §4 (Texto), não a
> redefina aqui; em divergência, o schema prevalece.

Regra de ouro: a chave de localização **nunca** é um offset de linha como
referência primária (frágil a edição). Prefira **seções** (`sec:<slug>`); só caia para
`linha:<n>` quando nenhuma seção contiver o achado.

## 1. Derivação do slug

`slug` segue a regra canônica (minúsculas, **sem acento/diacrítico**, espaços/pontuação
→ hífen, hifens repetidos colapsam, kebab-case, a mesma das entidades), aplicada ao
**texto visível do heading**: sem o `#`, sem numeração ornamental, sem markdown inline
(`` `código` ``, `**negrito**`).

| Título do heading              | `sec:<slug>`                                |
|--------------------------------|---------------------------------------------|
| `## Requisitos Funcionais`     | `sec:requisitos-funcionais`                 |
| `### 3.1 Regras de Negócio`    | `sec:regras-de-negocio` (o número numera; o slug é do texto) |
| `# Glossário (domínio)`        | `sec:glossario-dominio`                     |

> Quando o número faz parte da identidade da seção (requisito referido como "3.1"),
> pode-se preservá-lo (`sec:3-1-regras-de-negocio`) **se** for o que ancora de forma
> estável. O importante é **reproduzir** determinísticamente o título visível, não inventar.

## 2. Como reconhecer seções

### 2.1 Headings Markdown
Fonte primária. Reconheça `#`…`######`. O **escopo** de uma seção vai do seu heading até
o próximo heading de nível **igual ou superior**.

### 2.2 Títulos numerados e identificadores de requisito
Códigos como `1.1`, `RF-01`, `RNF-02`, `US-12` são âncoras frequentes. Dois casos:

- Código **no heading** (`### RF-01, Cadastro`): trate como heading normal; o slug sai
  do texto (preserve o código se for a âncora estável, ver §1).
- Código rotulando **item solto** numa lista/parágrafo (`- RF-01: o sistema deve …`): a
  localização é a **seção que contém a lista** (`sec:<slug>`); cite o código no
  `Resumo`/`Evidência`. Use `linha:<n>` só se o item não estiver sob nenhuma seção.

### 2.3 Âncoras explícitas
`{#minha-ancora}` (Markdown estendido) ou `<a name="...">` (HTML): se o autor define uma
âncora explícita, **prefira-a** ao slug derivado (`sec:minha-ancora`).

### 2.4 Tabelas e listas
Tabelas concentram **ATR** (campos), **REL** (linhas de relacionamento), matrizes de
permissão (**ATOR**) e faixas de **RN**; listas concentram campos, **EST** ("status
possíveis: rascunho, enviado, aprovado") ou passos de **FLX**. A localização é a **seção
que os contém**; diga no `Resumo` qual linha/colunas/passos e ponha um trecho curto na
`Evidência`. Não enderece célula por coordenada, seção + `Resumo` é a âncora estável.

## 3. Diagramas descritos em markdown/Mermaid

Blocos de diagrama **dentro** de um markdown são tratados aqui (não pela skill de código).
A âncora é sempre a **seção que contém o bloco** (`sec:<slug>`); o tipo de achado depende
do diagrama:

- **`erDiagram`** ou descrição de entidade-relacionamento: cada entidade → **ENT**; cada
  bloco de atributos → **ATR**; cada linha `A ||--o{ B : "faz"` → **REL** (cite as duas
  entidades e a cardinalidade no `Resumo`).
- **Diagrama de estado** (`stateDiagram`, "X → Y"): cada transição → **EST**; se causada
  por ação explícita, marque **ACT** + **EST** na mesma seção.
- **Fluxograma**/jornada que descreve um caso de uso → **FLX** (passos como ACTs).

A `Evidência` é um trecho **≤ 120 chars** do próprio bloco (a linha do relacionamento ou
da transição), nunca o bloco inteiro.

> **Imagem binária de diagrama** (`.png`, `.drawio`, captura) **não** é bloco markdown
> legível: vira entrada `nao-analisavel` (sentinela de fingerprint) para revisão humana,
> ver GATE 1 da skill e `fingerprint-e-delta.md` §1.4. Nunca presuma o conteúdo de uma imagem.

## 4. Fallback `linha:<n>` (último recurso)

Use **apenas** quando o achado não está sob nenhuma seção identificável (documento sem
headings; preâmbulo antes do primeiro heading). Mesmo então: prefira a **menor** unidade
estável (a linha do enunciado, não um bloco) e registre em `notas` que a localização caiu
para `linha:` por ausência de estrutura.

## 5. Checklist (antes de fechar cada achado)

- [ ] Há seção que contém o achado? Então a âncora é `sec:<slug>` (`#<n>` se o heading repete).
- [ ] O slug foi derivado **determinísticamente** do título visível (sem acento, kebab-case)?
- [ ] Achado em tabela/lista/diagrama → ancorado na **seção** que os contém, com a
      especificidade no `Resumo` e trecho curto na `Evidência`?
- [ ] Caí para `linha:<n>` **só** por ausência real de seção, e anotei isso?
- [ ] `Evidência` ≤ 120 chars, **sem segredo**?
