# Referência: padrões Drizzle deste repo

Use na Fase 4 (convenções) e Fase 5 (geração). **Siga o estilo já existente em
`lib/schema.ts`**; em dúvida, pergunte (Gate 4).

## Layout

- Todas as tabelas em **`lib/schema.ts`** (arquivo único), exportadas como `const`.
- Conexão em `lib/db.ts`: `drizzle(neon(DATABASE_URL), { schema })`, driver `neon-http`
  (sem transações interativas; o repo usa delete-then-insert em sequência).
- `drizzle.config.ts`: `schema: ./lib/schema.ts`, `out: ./drizzle`, `dialect: postgresql`.
- Migrations geradas em `drizzle/NNNN_<nome-aleatório>.sql` + `drizzle/meta/`. Nunca edite
  snapshots à mão.

## Estilo de tabela

```ts
import { pgTable, serial, text, integer, date, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  team: text("team").notNull(),
  gameDate: date("game_date").notNull(),
  status: text("status").notNull().default("agendado"),
  ourScore: integer("our_score"),               // nullable: sem .notNull()
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- Nome da tabela no banco: **plural em inglês, snake_case** (`game_stats`). Constante TS:
  camelCase (`gameStats`).
- Propriedade camelCase, coluna snake_case (`gameDate: date("game_date")`).
- Toda tabela tem `createdAt: timestamp("created_at").notNull().defaultNow()`.
- PK numérica: `serial("id").primaryKey()`. PK legível (categoria, campeonato):
  `text("id").primaryKey()` com slug gerado por `lib/slug.ts`.
- Nullable = ausência de `.notNull()`. Default sempre explícito com `.default(...)`.
- Estados são `text` com default + lista fechada em TS (`GAME_STATUSES` em
  `lib/games-validation.ts`), **não** `pgEnum`. Manter esse padrão salvo decisão em ADR.

## Relacionamentos por cardinalidade

**Situação atual:** o repo **não declara FKs** (`.references()`), nem `relations()`. As
relações são colunas `<x>Id` resolvidas por `innerJoin`/`leftJoin` nos repos. Declarar a
primeira FK é decisão de projeto (Gate 4): exige checar dados órfãos antes (a migration
falha se houver) e deve virar ADR.

- **1:N** (`A ||--o{ B`): coluna em B `aId: integer("a_id").notNull()` (ou `text` se a PK
  de A é slug). Com FK: `.references(() => a.id)`; definir `onDelete` explicitamente
  (o repo hoje apaga dependentes à mão nos repos).
- **1:1** (`A ||--|| B`): coluna em um lado + `unique()`. Qual lado detém a coluna é
  decisão de modelagem (Gate 3).
- **N:M** (`A }o--o{ B`): tabela associativa com `serial` id + as duas colunas + unique
  composto, como `game_lineups`:
  ```ts
  export const gameLineups = pgTable(
    "game_lineups",
    {
      id: serial("id").primaryKey(),
      gameId: integer("game_id").notNull(),
      athleteId: integer("athlete_id").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [unique().on(table.gameId, table.athleteId)]
  );
  ```
  Entidade associativa com atributos próprios (ex.: `game_stats`) segue o mesmo formato
  com as colunas extras.

## Arrays

`athletes.teams: text("teams").array().notNull()` é uma N:M **desnormalizada**
(atleta ↔ categoria) consultada com `arrayContains`. O MER deve representar a relação
como `}o--o{`; ao gerar, **pergunte** (Gate 3) se mantém o array ou cria tabela associativa.
Não converta por conta própria: há queries e importações que dependem do array.

## Mapeamento de tipos

O mapeamento canônico Mermaid → pg-core está em `mermaid-erd-spec.md` ("Convenções de
tipo deste repo"). Tipo fora daquela tabela → pergunte (Gate 2).

## Migration

1. `npm run db:generate` (drizzle-kit generate). Revise o SQL.
2. Aplicar (`npm run db:migrate`) **só com pedido explícito**: o `DATABASE_URL` de
   `.env.local` aponta para o Neon com dados reais.
3. Coluna `NOT NULL` nova em tabela existente precisa de `.default(...)` ou de migration
   em duas etapas (nullable → backfill → not null). Pergunte qual.
4. Backfill de dados históricos segue o padrão de `scripts/*.mjs` (dry-run por padrão,
   `--apply` para gravar, idempotente).
