# Fingerprint e classificação de delta

> **Fonte única.** Este arquivo define, **uma única vez**, (1) como
> calcular o fingerprint de uma fonte e (2) como classificar o delta entre o
> estado registrado no mapa e o estado atual do repositório. As skills que tratam
> mudança, `de-revisar-mapa` (que **calcula** o delta) e
> `de-reexecutar-incremental` (que **consome** o delta já calculado), citam este
> arquivo por caminho relativo e **não reimplementam** o algoritmo.
>
> **Fronteira de responsabilidade.** Há **uma só** lógica de delta: a do mapa.
> `de-revisar-mapa` a executa e atualiza o mapa; `de-reexecutar-incremental`
> reusa o resultado (não recomputa fingerprint). O **mapa é a única fonte de
> verdade do fingerprint** das fontes; os artefatos de design guardam apenas a
> **lista de caminhos** das fontes (procedência), nunca o sha256.

## 1. Fingerprint de uma fonte

O fingerprint de cada fonte é o **sha256 do conteúdo normalizado**. `bytes` e
`linhas` são verificação **barata** feita antes de hashear; `mtime` é apenas dica
secundária e **nunca** decide delta.

### 1.1 Normalização (determinística e reproduzível à mão)

Aplique, **nesta ordem**, antes de hashear:

1. **Decodificar como UTF-8.** Arquivo não-textual/binário (ex.: `.png`,
   `.drawio`, imagem) → **não** se calcula fingerprint de conteúdo: marca-se
   `nao-analisavel` (nota no artefato) e aplica-se o **sentinela** da subseção 1.4;
   conteúdo não é presumido.
2. **Remover BOM** UTF-8 inicial, se houver.
3. **Normalizar fim de linha:** `CRLF` (`| nenhuma>r| nenhuma>n`) e `CR` (`| nenhuma>r`) → `LF` (`| nenhuma>n`).
4. **Garantir exatamente um `| nenhuma>n` final:** remover linhas em branco finais
   excedentes e assegurar que o conteúdo termina com um único `| nenhuma>n` (arquivo vazio
   permanece vazio).

> **O que a normalização NÃO faz.** Não remove espaços em branco internos nem
> trailing spaces por linha, não reindenta, não reordena, não baixa caixa. Isso é
> proposital: em **código**, espaços/indentação podem ser semânticos; normalizar
> demais mascararia mudança real. A normalização cobre só ruído de editor
> (CRLF/BOM/linha final), suficiente para evitar delta espúrio sem esconder
> conteúdo.

### 1.2 Cálculo

- `sha256` = sha256 **hexadecimal** dos bytes do conteúdo normalizado (passo 1.1).
- `bytes` = número de bytes do conteúdo normalizado.
- `linhas` = número de `| nenhuma>n` no conteúdo normalizado.

Os três vivem em `marca_mudanca` (ver `schema-mapa-artefatos.md`). Reproduzível à
mão com ferramentas padrão (ex.: normalizar CRLF→LF e `sha256sum`), o que mantém o
mapa auditável por humano.

### 1.3 Pré-filtro barato

Antes de hashear na re-execução, compare `bytes` **e** `linhas` registrados com os
atuais:

- Se **ambos** batem **e** o `mtime` atual ≤ `mtime_iso` registrado → muito
  provável `INALTERADO`; ainda assim, **confirme com sha256** quando for decidir
  reprocessamento (o sha256 é a autoridade; bytes/linhas/mtime só evitam hashear à
  toa em larga escala).
- Se `bytes` **ou** `linhas` diferem → seguramente mudou; hasheie para registrar o
  novo sha256 e classifique como `ALTERADO`.

`mtime` **sozinho** nunca classifica: um `touch` sem edição não é mudança; uma
edição que preserva `mtime` (raro) ainda é pega pelo sha256.

### 1.4 Fingerprint de entradas que não são arquivo de texto único (sentinela)

Nem toda entrada do mapa é um arquivo de texto hasheável. Dois casos têm
**fingerprint canônico por sentinela**, definido aqui (fonte única) e refletido
no `schema-mapa-artefatos.md`:

1. **Entrada-índice de protótipo** (`tipo: prototipo`, `caminho` terminando em
   `/`): representa um diretório, não um arquivo. Usa o **sentinela**
   `sha256` = **64 zeros** (`0000…0`), `bytes: 0`, `linhas: 0`. O delta dessa
   entrada **não** vem de hash próprio: deriva **exclusivamente** dos filhos
   (entradas com `parte_de` apontando a ela). A entrada-índice é `ALTERADO`
   quando **qualquer** filho é `NOVO`/`ALTERADO`/`REMOVIDO`; `INALTERADO` quando
   todos os filhos são `INALTERADO`.
2. **Arquivo não-analisável** (binário/não-textual: `.png`, `.drawio`, imagem,
   ver passo 1.1, item 1): usa o mesmo **sentinela** (`sha256` = 64 zeros, `bytes: 0`,
   `linhas: 0`) e fica **fora** do reprocessamento por sha256. Sua reavaliação se
   dá por `bytes`/`mtime` como **dica** + **revisão humana** (o conteúdo nunca é
   presumido). Registre a natureza não-analisável em `notas`.

Em ambos os casos, os campos `marca_mudanca.sha256`/`bytes`/`linhas` **continuam
presentes e obrigatórios** (o sentinela É o valor), preservando o schema; o que
muda é a **origem** do delta (filhos, no caso do protótipo; humano/dica, no caso
do binário), nunca um cálculo de hash de conteúdo inexistente.

## 2. Classificação de delta

Comparando o conjunto de fontes registrado no mapa (`raiz_requisitos` + entradas)
com o estado atual do repositório, cada fonte recebe **uma** classe:

| Classe        | Condição                                                                             | Ação típica                                                                 |
|---------------|--------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| `NOVO`        | Existe no repo, **não** há entrada no mapa.                                           | Classificar (novo fragmento) e inserir entrada.                            |
| `ALTERADO`    | Há entrada no mapa **e** o `sha256` atual difere do registrado.                       | Reclassificar o trecho/arquivo; atualizar a entrada (preservando o humano). |
| `REMOVIDO`    | Há entrada no mapa, o arquivo **não** existe mais no repo.                            | Marcar/retirar a entrada; reportar impacto (não apagar design sozinho).     |
| `INALTERADO`  | Há entrada **e** o `sha256` atual é igual ao registrado.                              | **Não reprocessar** (regra central de economia).                            |
| `ÓRFÃO`       | Entrada no mapa cujo `parte_de` aponta para um pai inexistente, ou referência cruzada quebrada. | Reportar ao orquestrador para decisão humana; não inferir reparo.   |

> **`REMOVIDO` × `ÓRFÃO`.** `REMOVIDO` é a fonte que sumiu. `ÓRFÃO` é uma
> **referência interna do mapa** que ficou pendurada (ex.: filho de protótipo cujo
> pai foi removido). Ambos viram relatório ao humano, nunca remoção silenciosa.

### Regra central: "só reprocessa o que mudou"

A re-execução só toca fontes `NOVO`/`ALTERADO`/`REMOVIDO`. `INALTERADO` é deixado
exatamente como está, incluindo seus achados e sua `revisao_humana`. Esta é a
base da re-execução incremental: o custo do reprocessamento é proporcional ao
delta, não ao tamanho do repositório.

## 3. Preservação de entradas humanas

Entradas marcadas como intervenção humana são **protegidas** contra sobrescrita
automática:

- `marca_mudanca.fonte: humano` **ou** `revisao_humana.status ∈ {aprovado,
  ajustado}` → a re-execução **não** sobrescreve a entrada sem confirmação.
- Quando uma fonte assim aparece como `ALTERADO` (o arquivo mudou de verdade,
  sha256 difere) há **colisão** entre "o humano fixou isto" e "a fonte mudou": a
  skill **apresenta a colisão e pergunta** (mantém o humano vs. reclassificar),
  nunca decide sozinha.
- Ao reclassificar sob confirmação, preserva-se o que o humano acrescentou que o
  agente não detectaria de novo (achados/notas marcados), fazendo **merge**, não
  substituição cega. A identidade para merge é **fonte + localização relativa**
  (permite reclassificar só o trecho alterado de um arquivo grande, sem perder os
  demais achados humanos do mesmo arquivo).
