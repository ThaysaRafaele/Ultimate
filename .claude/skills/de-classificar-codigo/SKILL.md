---
name: de-classificar-codigo
description: >-
  Classifica UM arquivo de código-fonte (TypeScript/React do Next.js App Router,
  tabelas Drizzle, repos, validações, scripts .mjs) e devolve o fragmento com os 9
  alvos fixos, ancorados por símbolo (`sym:`). Acionada por `design-entidades` ao
  extrair os alvos de um arquivo de código.
---

# de-classificar-codigo: classificação de código-fonte por alvo fixo

**Skill-folha da Etapa 1.** Entrada: o **caminho de um único** arquivo de código-fonte
(TypeScript/React do Next.js App Router, tabelas Drizzle, repos, validações, scripts `.mjs`),
indicado pelo orquestrador. Processo: lê o arquivo **uma vez**, reconhece suas unidades
(tabelas, route handlers, repos, validações, páginas, componentes, scripts), mapeia cada
construção para os **9 alvos fixos** (REQ, RN, ENT, ATR, ACT, EST, REL, ATOR, FLX) e
ancora cada achado por **símbolo** (`sym:<arquivo>#<qualificador>`). Saída: o **fragmento**
no schema canônico do mapa (YAML do artefato + tabela de achados) + a lista de dúvidas,
**devolvidos ao orquestrador** para serem costurados no mapa, **sem nunca executar** o
código. Não escreve no mapa, não decide modelagem, não harmoniza conflitos.

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`.

**Específico da folha:** classifica **exatamente o arquivo indicado**. Imports e
referências a outros módulos viram **observação** ao orquestrador, nunca expansão de escopo
(nunca abre o vizinho por conta própria). Classificar é **ler e interpretar texto**:
`tsc`/lint/test/instalar/`npm run dev`/rodar script contam como **executar** e são
**proibidos**. Mock de API (se houver) é **DADO**, lido como especificação, nunca invocado.
Precisão de classificação **nunca** justifica executar (o que "só rodando se descobre" vira
inferência de baixa confiança ou dúvida). A `Evidência` de cada achado é trecho **≤ 120
chars**, sem **segredo** (`.env.local`/chave/token só por **localização**, nunca o valor).
Contradição **entre** artefatos é só **sinalizada** (resolve na Etapa 2). Quando o arquivo é
**interno de um protótipo**, vale também
`../mapa-artefatos-base/references/seguranca-prototipo.md`.

Cada fase é um **GATE**: gate que falha → **encerre** e devolva o motivo, **sem** fragmento
parcial.

---

## Workflow

### Fase 1: localização, leitura e marca de mudança

Receba o caminho do orquestrador; **não escaneie** o repo atrás dele. Confirme que o
arquivo existe e é **código-fonte textual** (TS/TSX, JS/MJS, SQL de migration, JSON de
dados), leia-o **uma vez** (somente-leitura) e identifique o **papel** dele na stack (tabela,
rota, repo, validação, tela). O papel guia o mapeamento da Fase 3. Calcule a **marca de
mudança** do conteúdo normalizado (`sha256`, `bytes`, `linhas`) conforme
`../mapa-artefatos-base/references/fingerprint-e-delta.md` §1.

**GATE 1 (existência/legibilidade):**

- Inexistente/vazio/ilegível → **encerre** e devolva o motivo; sem fragmento.
- **Binário/não-textual** (imagem, artefato compilado, `.next/`) → **não presuma**:
  `nao-analisavel`, **sentinela** de fingerprint (§1.4), `notas`, `alvos_presentes: []`,
  devolve para revisão humana via orquestrador.

### Fase 2: reconhecimento das unidades de código

Mapeie as **unidades** que servirão de âncora, seguindo
`references/heuristicas-localizacao-codigo.md`: tabelas Drizzle, route handlers, repos e
validações (backend) e páginas/componentes/navegação (frontend). Para cada unidade, derive o
**qualificador**: `route:<MÉTODO caminho>`, `fn:<nome>`, `class:<Nome>`,
`class:<Nome>.<metodo>`, `mod:<caminho>` (módulo inteiro) ou `linha:<n>` (fallback). A
âncora completa é `sym:<arquivo>#<qualificador>`.

**GATE 2 (unidades):** sem unidade simbólica reconhecível (config solta, fragmento de
dados) → registre em `notas` e use `mod:`/`linha:` de fallback; **não invente** símbolos.

### Fase 3: mapeamento construção → alvo fixo

Para **cada** unidade, aplique o mapeamento construção→alvo. **A tabela completa está em
`references/heuristicas-localizacao-codigo.md`** (semântica em
`../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`). Mapeamento canônico:
`pgTable`→**ENT**; coluna (`text`/`integer`/`date`...)→**ATR**; `.references()`, coluna
`<x>Id` ou join no repo→**REL** (implícita quando não há FK); coluna/transição de
`status`→**EST** (+**ACT** se a transição é causada por ação explícita; EST sozinho em
transição automática/temporal); handler `GET|POST|PUT|DELETE` de `route.ts`→**ACT**
(+**FLX** se orquestra vários passos); repo/handler que coordena passos→**FLX**;
`validate*`/`unique()`/`.notNull()`/cálculo de regra→**RN**; checagem de sessão/papel→**ATOR**
(hoje inexistente no repo); comportamento que cumpre necessidade declarada→**REQ**
(inferido); comentário de "decisões confirmadas" em script→**RN/REQ**. Regras:

- **Coincidências geram duas linhas** com a **mesma** âncora: transição por ação → `ACT`
  **e** `EST`; tabela que também é o usuário do sistema → `ENT` **e** `ATOR`.
- **Confiança.** Estrutura explícita (coluna, unique, handler) → `alta`; comportamento
  **inferido** (REQ a partir de rota; relação sem FK; intenção de transição não óbvia) →
  `media`/`baixa` com nota de inferência (`baixa` = candidato a inconsistência na Etapa 2).
- **Rota completa:** o caminho vem da pasta do `route.ts`
  (`app/api/games/[id]/stats/route.ts` → `route:PUT /api/games/[id]/stats`); segmentos
  dinâmicos ficam entre colchetes.

**GATE 3 (ambiguidade/contradição):** comportamento indecidível sem executar → **não
execute**: inferência de baixa confiança **ou** dúvida ao orquestrador. Achado fora dos 9
alvos → **não invente**, vira dúvida. Contradição **real** com outro artefato (ex.: a
validação do servidor contraria a do formulário, ou a tabela contraria o protótipo) → **não
resolva**: registre e **sinalize** o conflito nas dúvidas (resolução é da Etapa 2).

### Fase 4: montagem e validação do fragmento

Monte o **fragmento** na forma canônica de
`../mapa-artefatos-base/references/schema-mapa-artefatos.md` §3 (YAML `artefato:` + tabela),
com `tipo: codigo`, `marca_mudanca.fonte: agente`, `revisao_humana.status: pendente`,
`presentes ⊆ examinados`. `parte_de` aponta ao protótipo-pai **apenas** quando o
orquestrador indicou que este é arquivo interno de um protótipo. Use `notas` para
`nao-analisavel` (GATE 1), fallback de âncora (GATE 2) ou a **localização de um segredo**
(nunca o valor). O `id` é **proposta**: unicidade global e `total_artefatos` são
conferidos pelo **orquestrador** ao costurar.

**Auto-valide** contra as "Regras de validação de entrada" (schema §5) **antes** de devolver,
sem reescrevê-las aqui.

**GATE 4 (validação):** regra do §5 que falhe → **corrija** (ou transforme em dúvida) e
revalide. **Nunca** devolva fragmento que não passaria na validação da skill escritora.

### Fase 5: devolução enxuta

Devolva, em uma resposta curta: (1) o **fragmento** validado, e **só** isso de conteúdo
classificado; (2) a **lista de dúvidas/observações** separada (comportamento indecidível,
conflitos a sinalizar para a Etapa 2, **localização de segredos** sem valor, vizinhos
importados que talvez precisem entrar no escopo sem expandir, limitações de âncora).

**GATE 5 (retorno enxuto):** sem colar blocos de código; muitos achados → **indexe**
(uma linha por achado, evidência curta); se exceder um retorno razoável, devolva o índice e
sinalize que o orquestrador pode dividir o arquivo em escopos.
