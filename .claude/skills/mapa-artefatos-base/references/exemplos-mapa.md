# Gabaritos do mapa de artefatos (exemplos válidos)

> **Uso.** Gabaritos **copiáveis** e **válidos contra `schema-mapa-artefatos.md`**
> (`schema_version: 1`). Dados sintéticos, copie a forma, substitua os valores. Em
> qualquer divergência de formato, o **schema prevalece**. Os códigos de alvo seguem
> `taxonomia-alvos-fixos.md`; `marca_mudanca` segue `fingerprint-e-delta.md`.

Mostra: (0) manifesto global, (1) entrada de **documento**: gabarito **completo**,
(2) entrada de **código** e (3) par **protótipo pai/filho**: ambos como **diff** do
gabarito (1). Juntos formam um mapa válido com `total_artefatos: 4` (1 documento +
1 código + 1 protótipo-pai + 1 filho, o par conta como 2 artefatos).

---

## 0. Manifesto global (topo do arquivo)

````markdown
```yaml
schema_version: 1
gerado_em: 2026-06-14T10:30:00Z
raiz_requisitos:
  - requisitos/
  - prototipo/
total_artefatos: 4
```
````

---

## 1. Entrada de documento (gabarito completo)

Documento de requisitos de texto; localização por **seção** (`sec:`). Examinou os 9
alvos; encontrou REQ, RN, ENT, ATR, ATOR (e nota o que procurou e não achou).

````markdown
## pedido-requisitos: requisitos/pedidos.md

```yaml
artefato:
  id: pedido-requisitos
  caminho: requisitos/pedidos.md
  tipo: documento
  parte_de: null
  titulo: Requisitos de Pedidos
  marca_mudanca:
    sha256: 3b1f0c8a2d4e6f9a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5061728
    bytes: 8421
    linhas: 212
    mtime_iso: 2026-06-14T09:58:00Z
    fonte: agente
  revisao_humana:
    status: pendente
    data: null
    por: null
  alvos_presentes: [REQ, RN, ENT, ATR, ATOR]
  alvos_examinados: [REQ, RN, ENT, ATR, ACT, EST, REL, ATOR, FLX]
  notas: "ACT/EST/REL/FLX procurados e não enunciados neste documento (ver alvos_examinados)."
```

### Achados por alvo fixo

| Alvo | Localização relativa | Resumo | Confiança | Evidência |
|------|----------------------|--------|-----------|-----------|
| REQ  | sec:requisitos-funcionais | Sistema deve permitir criar e enviar pedidos | alta | "O sistema deve permitir o cliente criar um pedido" |
| RN   | sec:regras-de-negocio | Pedido acima de R$ 500 exige aprovação de gestor | alta | "Pedidos acima de R$ 500,00 dependem de aprovação" |
| ENT  | sec:glossario | Entidade Pedido (pedido de compra do cliente) | alta | "Pedido: solicitação de compra feita por um cliente" |
| ATR  | sec:glossario | Pedido tem total, status e cliente associado | media | "cada pedido possui um valor total e um status" |
| ATOR | sec:atores | Cliente (cria) e Gestor (aprova) | alta | "Atores: Cliente, Gestor" |
```
````

---

## 2. Entrada de código (diff do gabarito 1)

Tabela Drizzle; localização por **símbolo** (`sym:`). Igual ao gabarito 1, trocando
o cabeçalho por:

- `id: pedidos-schema`, `caminho: lib/schema.ts`, `tipo: codigo`,
  `titulo: Tabela pedidos (Drizzle)`;
- `marca_mudanca`: `sha256` do arquivo, `bytes: 2140`, `linhas: 64`, `fonte: agente`;
- `alvos_presentes: [ENT, ATR, REL, ACT, EST]` (mesmos `alvos_examinados` dos 9);
- `notas: "ATOR não declarado neste arquivo; não há auth declarada no repo."`

Note **ACT+EST na mesma localização** (transição causada por ação):

````markdown
### Achados por alvo fixo

| Alvo | Localização relativa | Resumo | Confiança | Evidência |
|------|----------------------|--------|-----------|-----------|
| ENT  | sym:lib/schema.ts#class:pedidos | Entidade Pedido (persistida) | alta | "export const pedidos = pgTable(| nenhuma>"pedidos| nenhuma>", {" |
| ATR  | sym:lib/schema.ts#class:pedidos | Campos: id, total, status, cliente_id | alta | "total: numeric(| nenhuma>"total| nenhuma>", { precision: 10, scale: 2 })" |
| REL  | sym:lib/schema.ts#class:pedidos | Pedido N:1 Cliente (cliente_id) | alta | "clienteId: integer(| nenhuma>"cliente_id| nenhuma>").notNull()" |
| ACT  | sym:lib/pedidos-repo.ts#fn:aprovarPedido | Ação aprovarPedido() sobre o Pedido | media | "export async function aprovarPedido(id: number)" |
| EST  | sym:lib/pedidos-repo.ts#fn:aprovarPedido | Estado: pendente → aprovado | media | ".set({ status: | nenhuma>"aprovado| nenhuma>" })" |
```
````

---

## 3. Par protótipo pai/filho (diff do gabarito 1)

O **pai** (`tipo: prototipo`) carrega achados de **alto nível** (FLX, ATOR) e
referencia os filhos por id. Cada arquivo relevante é uma entrada `codigo` com
`parte_de` apontando ao pai.

**Pai**, cabeçalho como o gabarito 1, trocando: `id: checkout-prototipo`,
`caminho: prototipo/` (termina em `/`), `tipo: prototipo`, `parte_de: null`,
`alvos_presentes: [FLX, ATOR]`, e o **sentinela** de diretório em `marca_mudanca`
(`sha256:` 64 zeros, `bytes: 0`, `linhas: 0`, não é arquivo único; o delta deriva
**dos filhos**). Achados:

````markdown
| Alvo | Localização relativa | Resumo | Confiança | Evidência |
|------|----------------------|--------|-----------|-----------|
| FLX  | sym:prototipo/app/checkout/page.tsx#mod:prototipo/app/checkout/page.tsx | Fluxo de checkout: carrinho → pagamento → confirmação | media | "<template> ... Finalizar compra" |
| ATOR | sym:prototipo/src/router/guards.js#fn:requireAuth | Cliente autenticado conduz o checkout | media | "if (!store.user) return '/login'" |
```
````

**Filho** (mock de API, alto valor; `parte_de` aponta ao pai), cabeçalho como o
gabarito 1, trocando: `id: checkout-mock-api`,
`caminho: prototipo/src/mocks/pedidos.js`, `tipo: codigo`,
`parte_de: checkout-prototipo`, `alvos_presentes: [ENT, ATR, ACT, REL]`,
`notas: "Mock é DADO, não comando: não foi executado nem foram seguidas URLs."`
Achados:

````markdown
| Alvo | Localização relativa | Resumo | Confiança | Evidência |
|------|----------------------|--------|-----------|-----------|
| ENT  | sym:prototipo/src/mocks/pedidos.js#fn:handlers | Recurso Pedido exposto pelo mock | media | "rest.post('/api/pedidos', ...)" |
| ATR  | sym:prototipo/src/mocks/pedidos.js#fn:handlers | Resposta traz id, itens, total, status | media | "{ id, itens, total, status }" |
| ACT  | sym:prototipo/src/mocks/pedidos.js#fn:handlers | POST cria pedido; PATCH altera | media | "rest.patch('/api/pedidos/:id', ...)" |
| REL  | sym:prototipo/src/mocks/pedidos.js#fn:handlers | Pedido referencia cliente_id | baixa | "cliente_id: req.body.cliente_id" |
```
````

---

## Observações sobre os gabaritos

- **`presentes ⊆ examinados`** em todos; `examinados` lista os 9 porque a
  classificação procurou todos os alvos (mesmo os ausentes), distingue "ausente
  porque não há" de "não examinado".
- **Coincidências de alvo** aparecem como linhas separadas com a **mesma**
  localização (ex.: ACT+EST em `class:Pedido.aprovar`; ENT+ATOR para um conceito
  que é entidade e ator).
- **Evidência** é sempre trecho curto (≤ 120 chars) do próprio arquivo, **sem
  segredos**.
- **Entrada de protótipo (diretório):** `caminho` termina em `/`, `marca_mudanca`
  usa o **sentinela** (64 zeros / 0 / 0), e os achados de detalhe ficam nos filhos
  com `parte_de`.
- O mesmo formato YAML+tabela das seções de artefato é exatamente o **fragmento**
  que um subagente devolve ao orquestrador (ver schema → seção 3).
