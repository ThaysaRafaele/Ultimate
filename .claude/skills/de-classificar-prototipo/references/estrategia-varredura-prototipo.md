# Estratégia de varredura de protótipo (inventário, mock, lote, consolidação)

> **Uso.** Reference de apoio à skill `de-classificar-prototipo`. Define **como
> inventariar barato**, **detectar mock de API**, **lotear** a delegação e
> **consolidar** os achados em índice pai/filho. A **gramática** das âncoras e o
> **schema** do fragmento são os de
> `../../mapa-artefatos-base/references/schema-mapa-artefatos.md`; a **semântica**
> dos alvos é a de `../../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`;
> o **mapeamento construção→alvo por arquivo** (aplicado inline na varredura) é o
> de `../../de-classificar-codigo/references/heuristicas-localizacao-codigo.md`
> (código/mock) e `../../de-classificar-doc/references/heuristicas-localizacao-secao.md`
> (texto/diagrama). Em divergência, schema e taxonomia prevalecem.
>
> **Segurança.** Tudo aqui é **somente-leitura**; a fonte autoritativa das
> proibições é `../../mapa-artefatos-base/references/seguranca-prototipo.md` (na base).

## 0. Protótipo HTML standalone (forma deste repo)

Os protótipos deste repo são **arquivos HTML únicos empacotados** (exportados de uma
ferramenta de design), sem backend e sem mock de API:

| Arquivo | O que é | Como tratar |
|---|---|---|
| `_prototype_extracted.html` | Template **já extraído e legível** (marcação + script de tela) | **Fonte primária** de leitura. É ignorado pelo git (scratch local); se não existir, use o bloco `<script type="__bundler/template">` do bundle. |
| `Ultimate Gestao.html`, `index.html` | Bundle desktop (template + `__bundler/manifest` com recursos embutidos) | Leia só o template; o manifesto (fontes, imagens, JS de runtime em base64) é `nao-analisavel`. |
| `Ultimate Gestao Mobile - standalone.html` | Bundle mobile (~1,5 MB) | Mesmo tratamento; interessa só o que **difere** do desktop (telas/campos exclusivos). |

Partes e prioridade:

- **alta**: marcação das telas (títulos, rótulos de campo, colunas de tabela, botões de
  ação, menus) → ENT/ATR/ACT/FLX; dados de exemplo (nomes de time, campeonato,
  placares) → ENT/ATR com confiança `baixa`; script `text/x-dc` (estado da tela, handlers) → ACT/EST/RN.
- **baixa**: `<style>`, `@font-face`.
- **nao-analisavel**: manifesto e recursos base64/comprimidos. Nunca decodificar.

Âncoras: `sec:<slug-da-tela-ou-bloco>` (ex.: `sec:tela-boletim`) ou `linha:<n>` dentro do
arquivo. Divergência protótipo × código implementado é **sinal** para a Etapa 2, não erro.
Funcionalidade presente só no protótipo (ex.: login "Senha/Sair", "Visão geral", "Gerar
análise") vira **REQ** com confiança `media` e nota "não implementado".

O restante deste reference (§1 em diante) vale para a forma **diretório de app**.

## 1. Inventário barato: globs de inclusão e exclusão

O inventário é o **primeiro** passo e é **barato**: lista caminho, extensão e
tamanho (bytes), **sem ler o corpo**. Aplique:

### Incluir (candidatos a relevância)

- Código de app: `**/*.{js,jsx,ts,tsx,mjs,cjs}`, `**/*.vue`, `**/*.html` de tela.
- Mock de API: `**/mocks/**`, `**/__mocks__/**`, `**/handlers.{js,ts}`,
  `**/browser.{js,ts}`, `**/server.{js,ts}`, `**/db.json`, `**/routes.json`,
  `**/*.openapi.{json,yaml,yml}`, `**/openapi.{json,yaml,yml}`,
  `**/swagger.{json,yaml,yml}`.
- Estrutura/navegação: `**/router/**`, `**/routes.{js,ts}`, `**/App.{vue,jsx,tsx}`,
  `**/main.{js,ts}`.
- Texto de domínio dentro do protótipo: `**/*.md`, `**/*.txt` (README de feature,
  notas de tela).

### Excluir (ruído: nunca inventariar/ler)

- `**/node_modules/**`, `**/dist/**`, `**/build/**`, `**/.next/**`, `**/.nuxt/**`,
  `**/.output/**`, `**/coverage/**`, `**/.git/**`, `**/.cache/**`.
- **Lockfiles:** `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`,
  `bun.lockb`, `poetry.lock`.
- **Assets binários e fontes:** `**/*.{png,jpg,jpeg,gif,svg,ico,webp,avif}`,
  `**/*.{woff,woff2,ttf,eot}`, `**/*.{mp4,webm,mp3,wav}`, `**/*.{pdf,zip,gz}`.
- **Bundles minificados / mapas:** `**/*.min.{js,css}`, `**/*.map`.
- Estilos puros sem domínio: `**/*.{css,scss,sass,less}` (prioridade **baixa**;
  só entram se sobrar orçamento).

Arquivos binários que escaparem do filtro são tipados `nao-analisavel` (Fase 2 do
`SKILL.md`), listados, **nunca** lidos/adivinhados.

## 2. Priorização (tiers)

Atribua prioridade por sinais **baratos** (caminho/nome/extensão; no máximo uma
espiada de cabeçalho para confirmar mock):

| Prioridade | Arquivos                                                                 | Por quê |
|------------|--------------------------------------------------------------------------|---------|
| **alta**   | **Mock de API** (MSW, `db.json`, OpenAPI/Swagger); **models/domínio**; **router/navegação** | Densidade máxima de ENT/ATR/REL/ACT/FLX/ATOR |
| **média**  | Stores/estado global; services/hooks; componentes de **fluxo**/telas | ACT/FLX/EST e ATR de formulário |
| **baixa**  | Estilos, utilitários sem domínio, config sem regra                       | Pouco ou nenhum alvo de domínio |

Relevantes = **alta + média**; **baixa** entra só se o orçamento (seção 6)
permitir.

## 3. Detecção de mock de API

O mock é a peça de mais alto valor (**dado, não comando**). Reconheça por
**nome de arquivo + espiada mínima**, sem invocar:

| Tecnologia        | Pistas baratas                                                            | O que extrair (inline, via heurísticas de código §4) |
|-------------------|---------------------------------------------------------------------------|------------------------------------------------------|
| **MSW**           | `handlers.{js,ts}`, `rest.get/post/...`, `http.*`, `setupWorker`/`setupServer` | cada handler = **ACT** sobre **ENT**; shape da resposta = **ATR**; `*_id` = **REL**; âncora `fn:`/`route:` |
| **json-server**   | `db.json`, `routes.json`                                                   | coleções = **ENT**; campos = **ATR**; relação por id = **REL** |
| **OpenAPI/Swagger** | `openapi.{json,yaml}`, `swagger.{json,yaml}`, chaves `paths`/`components` | `paths` = **ACT/FLX** (`route:<MÉTODO caminho>`); `components.schemas` = **ENT/ATR**; `$ref` = **REL** |
| **Mirage/axios-mock** | `mirage`, `makeServer`, `new MockAdapter`                              | rotas declaradas = **ACT/ENT/ATR/REL** |
| **fixtures**      | `**/fixtures/**`, `*.fixture.{js,ts,json}`                                 | dados de exemplo = **ENT/ATR**; confiança `baixa` |

**GATE de mock ausente:** se a varredura **não** encontrar nenhum mock, isso é um
**sinal** (não um erro a contornar): registre como observação/dúvida ao
orquestrador, o mock pode estar em outro artefato, ou o protótipo pode não ter um.
**Nunca** fabrique endpoints/respostas.

## 4. Critério de lote (delegação interna)

A varredura roda em **loop interno com limpeza**, sem `Task` aninhado. O
loteamento organiza esse loop:

- **Lotes por afinidade:** agrupe arquivos da **mesma rota/feature/pasta** (ex.: a
  view + o store + o handler de mock de "pedidos"). Coesão melhora a inferência de
  **FLX** sem reler.
- **Teto ~5 arquivos** por unidade de classificação.
- **1-por-unidade** para arquivos **grandes ou críticos**: mock de API central
  (`db.json`/`openapi` extenso), model grande, router principal. Eles merecem
  contexto dedicado e limpeza imediata.
- **Limpeza entre lotes/arquivos:** descarte o conteúdo lido antes do próximo, para
  o contexto do subagente não crescer com o protótipo.

## 5. Consolidação em índice pai/filho

Ao fim do loop, monte o índice no schema canônico (pai/filho):

- **Entrada-pai** (`tipo: prototipo`): preenche **todos** os campos obrigatórios do
  schema (§2.1), `titulo` (nome do app/diretório do protótipo); `caminho` da raiz
  **com `/` final**; **sentinela** de fingerprint (`sha256` = 64 zeros, `bytes: 0`,
  `linhas: 0`, `../../mapa-artefatos-base/references/fingerprint-e-delta.md` §1.4),
  cujo **delta deriva dos filhos**, não de hash próprio; `fonte: agente`;
  `revisao_humana: pendente`. `alvos_presentes` da pai carrega os achados de **alto
  nível** (e `alvos_examinados` lista os alvos **procurados** nesse nível,
  tipicamente FLX/ATOR, com `presentes ⊆ examinados`):
  - **FLX**, jornadas e mapa de navegação (do router/`routes`, das telas que
    encadeiam ações).
  - **ATOR**, guards de auth/perfis (`meta.requiresAuth`, `beforeEach`, SSO).
- **Entradas-filho** (`tipo: codigo`/`documento`): um fragmento por arquivo
  relevante classificado, cada um com `parte_de` = `id` da entrada-pai.
- **Âncoras dos filhos:** `sym:<arquivo>#<qualificador>` (código) ou `sec:<slug>`
  (texto/diagrama), **sempre** relativas à raiz do repo (não à raiz do protótipo).

A consolidação é **enxuta**: YAML + tabelas de achados, evidência ≤ 120
chars, **sem** colar código. Uma **lista única** acompanha o índice com: dúvidas,
conflitos a sinalizar para a Etapa 2, **localização de segredos** (sem valor),
**mock ausente**, arquivos `nao-analisavel`.

## 6. Orçamento (decisão fechada)

- **Limite:** acima de **~40 arquivos relevantes** **ou** **~2 MB de código**
  relevante → **devolva ao orquestrador** o inventário priorizado + o plano de
  lotes e **aguarde confirmação** antes do fan-out (confirmar / reduzir escopo /
  orquestrador assume o fan-out por subagentes próprios). Abaixo do limite,
  prossiga.
- **Retorno enxuto no limite:** se o índice consolidado ficar grande, devolva a
  **entrada-pai + um resumo por filho** (uma linha por arquivo) e sinalize que o
  orquestrador deve **receber os filhos em lotes** ou **assumir o fan-out**.
- O subagente **nunca pergunta ao usuário**: pedidos de confirmação de orçamento
  vão ao **orquestrador** (zero presunção).

## 7. Checklist da varredura

- [ ] Inventário **barato** (glob; sem ler corpo); exclusões aplicadas
      (`node_modules`/`dist`/assets/lockfiles/minificados).
- [ ] Cada arquivo **tipado** (`codigo`/`documento`/`nao-analisavel`) e
      **priorizado** (alta/média/baixa).
- [ ] **Mock** detectado e tratado como dado; mock ausente **sinalizado** (não
      fabricado).
- [ ] Lotes por afinidade, teto ~5; 1-por-unidade para grandes/críticos.
- [ ] **Orçamento** verificado; confirmação pedida ao orquestrador acima do limite.
- [ ] Índice **pai/filho** coerente (`parte_de` válido; sentinela na pai; FLX/ATOR
      de alto nível na pai); retorno **enxuto** + lista única de pendências.
