---
name: de-classificar-prototipo
description: >-
  Varre UM protótipo (HTML standalone empacotado, como os "Ultimate Gestao*.html"
  deste repo, ou diretório de app com mock de API) sem estourar contexto: inventário
  barato, classifica as partes relevantes em loop interno e consolida um índice
  pai/filho com os 9 alvos fixos. Acionada por `design-entidades` quando o artefato de
  requisito é um protótipo.
---

# de-classificar-prototipo: varredura e classificação de protótipo funcional

**Skill orquestradora da Etapa 1** (roda em subagente). Entrada: o **caminho de um
protótipo**, em uma de duas formas: (a) **HTML standalone empacotado** (arquivo único com
template + manifesto de recursos embutidos; é o caso deste repo: `Ultimate Gestao.html`,
`Ultimate Gestao Mobile - standalone.html`, `index.html`, e o template já extraído
`_prototype_extracted.html`); ou (b) **diretório de app** com mock de API. Recebe também os
**9 alvos** e o **schema do fragmento**, indicados pelo orquestrador. Tratamento específico
da forma (a) em `references/estrategia-varredura-prototipo.md` §0. Processo: inventaria os
arquivos por **glob** (sem ler o corpo), **prioriza e tipa** cada um, monta um **plano de
lotes** e varre os relevantes em **loop interno com limpeza entre arquivos**, aplicando
**inline** (sem `Task` aninhado) os procedimentos de `de-classificar-codigo`/
`de-classificar-doc`. Saída: um **índice pai/filho** no schema canônico (entrada
`prototipo` com achados de alto nível **FLX/ATOR** + um filho por arquivo relevante,
`parte_de`) + a lista única de dúvidas, **devolvidos ao orquestrador**. Não escreve no
mapa, não decide modelagem, não harmoniza conflitos.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico da skill:** sem estourar contexto, a "delegação" a
`de-classificar-codigo`/`-doc` é a aplicação **inline** de seus procedimentos em loop com
limpeza entre arquivos, **não** `Task` aninhado; o fan-out real por subagentes, se houver,
é decisão do **orquestrador**. Classifica **apenas** dentro da raiz indicada, não escaneia
o repo nem expande para fora dela. Contradição **entre** arquivos do protótipo (mock ×
componente × história de usuário) é só **sinalizada** (resolve na Etapa 2). Segurança ao
tocar protótipo é **autoritativa** em
`../mapa-artefatos-base/references/seguranca-prototipo.md`: **proibido** rodar/buildar/
instalar/subir dev-server; **mock de API é DADO**, lido como especificação, nunca invocado
nem suas URLs (externas ou internas) seguidas; **segredos** (`.env*`, chave, token, `NEXT_PUBLIC_*`
sensível) só por **localização** em `notas`, nunca o valor; precisão de classificação
**nunca** justifica executar.

Cada fase é um **GATE**: gate que falha → **encerre** e devolva o motivo, **sem** índice parcial.

---

## Workflow

### Fase 1: Inventário barato por glob (sem ler corpo)

Receba o **caminho-raiz do protótipo**; **não escaneie** o repo atrás dele nem expanda
para fora da raiz. Liste os arquivos por **glob**, aplicando os globs de inclusão/exclusão
de `references/estrategia-varredura-prototipo.md` §1 (exclui `node_modules/`, `dist/`,
`build/`, `coverage/`, `.git/`, assets binários, lockfiles, bundles minificados). Para
cada arquivo incluído registre **só** `caminho`, `extensão` e `tamanho` (bytes): **sem
ler o corpo**; some o total de arquivos e de bytes de código (insumo do orçamento, Fase 3).

**GATE 1 (existência/acesso):** raiz inexistente, vazia ou inacessível → **encerre** e
devolva o motivo, sem índice. Binário/não-analisável é só listado (tipado `nao-analisavel`
na Fase 2), **nunca** lido/adivinhado.

### Fase 2: Priorização e tipagem por arquivo (ainda sem classificar)

Atribua a cada arquivo um **tipo** (`codigo` | `documento`/`diagrama` | `nao-analisavel`)
e uma **prioridade** (alta/média/baixa) por sinais **baratos** (caminho/nome/extensão + no
máximo uma espiada de cabeçalho quando o reference permitir). Tabela de tiers e detecção de
mock em `references/estrategia-varredura-prototipo.md` §2–3. Relevantes = alta + média;
baixa entra só se sobrar orçamento.

**HTML standalone:** não há glob; o "inventário" são as **partes** do arquivo (template
legível, scripts de tela, manifesto de recursos), conforme §0 do reference. Recursos
embutidos em base64/comprimidos são `nao-analisavel`, nunca decodificados para "ver o que há".

**GATE 2 (mock ausente):** se **nenhum** mock de API for detectado, **não presuma**
comportamento de API: registre como **observação/dúvida** ao orquestrador (o mock é peça
de alto valor, sua ausência é, por si, um sinal; pode estar em outro artefato ou não
existir). Nunca fabrique endpoints/respostas.

### Fase 3: Plano de delegação em lotes + GATE de orçamento

Monte o plano de delegação sobre os arquivos **relevantes**: **lotes por afinidade**
(mesma rota/feature/pasta, teto **~5 arquivos** por unidade); **1-por-unidade** para
arquivos **grandes/críticos** (mock de API central, model extenso), ver
`references/estrategia-varredura-prototipo.md` §4.

**GATE 3 (orçamento: decisão fechada):** acima de **~40 arquivos relevantes** **ou**
**~2 MB de código** relevante, **não prossiga**: devolva ao orquestrador o inventário
priorizado + o plano de lotes e **aguarde decisão** (confirmar prosseguimento / reduzir
escopo / o orquestrador assumir o fan-out por subagentes próprios). Abaixo do limite, siga
para a Fase 4. O subagente **não pergunta ao usuário**, devolve o pedido ao orquestrador.
(Limite definido **aqui**, fonte única; `references/estrategia-varredura-prototipo.md`
§6 e `../mapa-artefatos-base/references/seguranca-prototipo.md` apenas o repetem.)

### Fase 4: Varredura com limpeza entre arquivos (loop interno; sem `Task` aninhado)

Percorra os lotes/arquivos em **loop interno**. Para **cada** arquivo:

1. **Leia** (somente-leitura) e calcule a **marca de mudança** (`sha256`/`bytes`/`linhas`
   do conteúdo normalizado, conforme
   `../mapa-artefatos-base/references/fingerprint-e-delta.md` §1).
2. **Classifique inline**, aplicando a heurística da skill-folha adequada **sem acioná-la
   como `Task`**: código/mock →
   `../de-classificar-codigo/references/heuristicas-localizacao-codigo.md` (âncoras `sym:`);
   texto/diagrama → `../de-classificar-doc/references/heuristicas-localizacao-secao.md`
   (âncoras `sec:`). A semântica dos alvos é a de
   `../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`.
3. **Monte o fragmento** no schema canônico (entrada pai/filho `parte_de`, âncoras e
   validação em `../mapa-artefatos-base/references/schema-mapa-artefatos.md`; `tipo:
   codigo`/`documento`; `parte_de` = `id` do protótipo-pai, fixado na Fase 5) e
   **auto-valide** contra o schema §5 antes de fechar.
4. **Limpe**: descarte o conteúdo do arquivo da memória de trabalho **antes** do próximo.

**GATE 4 (ambiguidade/contradição):** arquivo que só classificaria executando → **não
execute**: inferência de baixa confiança ou **dúvida** ao orquestrador. Achado fora dos 9
alvos → **não invente** alvo; vira dúvida. Contradição **real** entre arquivos (mock ×
componente × história) → **não resolva**: registre o achado e **sinalize** o conflito na
lista única (resolução é da Etapa 2).

### Fase 5: Consolidação em índice pai/filho

Reúna os fragmentos no **índice pai/filho** conforme
`references/estrategia-varredura-prototipo.md` §5:

- **Entrada-pai** (`tipo: prototipo`): todos os campos obrigatórios do schema (§2.1),
  `titulo` (nome do app/diretório); `caminho` da raiz **terminando em `/`**; **sentinela**
  de fingerprint (`sha256` = 64 zeros, `bytes: 0`, `linhas: 0`; o delta da pai deriva dos
  filhos); `fonte: agente`; `revisao_humana: pendente`; `alvos_presentes` com os achados de
  **alto nível**: **FLX** (jornadas/mapa de navegação do router) e **ATOR** (guards de
  auth/perfis), e `alvos_examinados` com os alvos procurados nesse nível (`presentes ⊆ examinados`).
- **Entradas-filho** (`tipo: codigo`/`documento`): um por arquivo relevante classificado na
  Fase 4, cada um com `parte_de` = `id` da entrada-pai.
- **Lista única** de: dúvidas, conflitos a sinalizar para a Etapa 2, **localização de
  segredos** (sem valor), **mock ausente** (GATE 2), arquivos `nao-analisavel`.

**GATE 5 (coerência pai/filho + validação):** auto-valide a entrada-pai contra o schema §5
(todos os campos obrigatórios, `alvos_presentes ⊆ alvos_examinados`, alvos ∈ 9); todo filho
tem `parte_de` apontando à pai; os `id` são únicos **dentro do conjunto devolvido** (a
unicidade global e o `total_artefatos` são conferidos pelo **orquestrador** ao costurar).
Falha → corrige ou devolve dúvida; nunca devolve índice inconsistente.

### Fase 6: Devolução enxuta ao orquestrador

Devolva, em resposta curta: (1) o **índice pai/filho** validado (YAML + tabelas de
achados, evidência **≤ 120 chars**) e **só isso** de conteúdo classificado; (2) a **lista
única** de dúvidas/observações, separada do índice.

**GATE 6 (retorno enxuto):** sem colar blocos de código. Se o conjunto exceder um
retorno razoável (protótipo no limite do orçamento), devolva a **entrada-pai + um índice
resumido por filho** (uma linha por arquivo, evidência curta) e sinalize ao orquestrador
para **receber os filhos em lotes** ou **assumir o fan-out** (liga-se ao GATE 3). Nunca
devolva tudo de uma vez se isso poluir o contexto do orquestrador.
