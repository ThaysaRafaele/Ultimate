---
name: drizzle-from-mermaid-erd
description: >-
  Gera ou atualiza as tabelas Drizzle ORM (lib/schema.ts, Postgres) e a migration
  correspondente a partir de um Diagrama Entidade-Relacionamento (MER/ERD) em Mermaid
  (`erDiagram`). Acione ao transformar um `erDiagram` em tabelas Drizzle, ao pedir
  "gerar schema/tabelas a partir do MER", "ERD para Drizzle", "criar tabela nova a
  partir do diagrama", ou quando outra skill (de-produzir-mer, workflow executar-issue)
  pedir a persistência de um MER.
---

# Drizzle a partir de MER em Mermaid

Converte um `erDiagram` (no pipeline, `docs/entities/MER.md` de `de-produzir-mer`) em
**tabelas Drizzle normalizadas (3FN)** no arquivo único `lib/schema.ts`, e gera a migration
SQL com `npm run db:generate`. Avança por **fases-gate em ordem**; um gate não resolvido
**encerra ou pergunta**, nunca prossegue com o que sobrou. Referências:
`references/mermaid-erd-spec.md` (dialeto + checklists, **dono único**; `de-produzir-mer`
cita) e `references/drizzle-patterns.md` (convenções do repo, tipos, cardinalidades, migration).

## Postura: zero presunção

Sintaxe, cardinalidade, tipo, normalização ou impacto em dados existentes **ambíguos,
malformados ou faltando → pare e pergunte**. Não complete com "padrão razoável". O banco é
um Neon Postgres **com dados reais** (jogos de 2018 e 2019 importados): uma migration errada
é cara de reverter. Acionada por outra skill num fluxo automatizado, **devolve a pergunta**
em vez de adivinhar.

**Nunca** rode `npm run db:migrate`, `drizzle-kit push` ou SQL direto no banco sem pedido
explícito do usuário. Esta skill termina na migration **gerada e revisada**, não aplicada.

## Fases (cada uma é um GATE)

### Fase 1: validação sintática do MER
Confirme que é um `erDiagram` e valide contra `references/mermaid-erd-spec.md`
("Checklist de validação sintática").

**GATE 1 (fatal):** inconsistência sintática → **encerre** e reporte trecho + linha +
motivo. Ex.: `Linha 7: ATLETA ||--?? JOGO : joga` ("??" não é cardinalidade válida).

### Fase 2: completude
Confira contra o "Checklist de completude" do spec: cardinalidade interpretável, PK por
entidade, tipo de cada coluna (na tabela de tipos do spec), representação de N:M,
nulabilidade/unicidade/defaults relevantes.

**GATE 2:** faltou algo → **pergunte numa lista agrupada e aguarde**. Tipo ausente nunca
vira tipo "padrão".

### Fase 3: diff contra o schema atual + plano
Leia `lib/schema.ts` e compare com o MER. Classifique cada diferença: **tabela nova**,
**coluna nova**, **coluna alterada** (tipo/nulabilidade/default), **coluna/tabela removida**,
**relação nova** (FK, unique composto). Planeje em 3FN (salvo decisão explícita em contrário;
ver `references/drizzle-patterns.md` §Arrays para o caso `athletes.teams`).

**GATE 3:** apresente o plano (tabelas, colunas, tipos, PK/FK, uniques, e o **impacto em
dados existentes**) e aguarde aprovação quando houver: remoção/renomeação, `NOT NULL` em
tabela com linhas sem default, mudança de tipo, FK nova sobre dados que podem estar órfãos,
ou dúvida de normalização. Mudança puramente aditiva e nullable pode seguir.

### Fase 4: convenções do projeto
Siga `references/drizzle-patterns.md`: arquivo único `lib/schema.ts`, imports de
`drizzle-orm/pg-core`, propriedade `camelCase` com coluna `snake_case`, `createdAt` padrão,
estilo de `unique().on(...)`. Não crie arquivo de schema novo nem mude o `drizzle.config.ts`.

**GATE 4:** convenção ambígua para o caso (ex.: primeira FK declarada no repo, primeiro
`relations()`) → pergunte.

### Fase 5: geração
Edite `lib/schema.ts` **estritamente** conforme o plano aprovado. Não adicione campos,
índices ou relações fora do plano. Atualize também os tipos/constantes derivados que
dependem da tabela, se o plano previr (ex.: lista de status em `lib/*-validation.ts`).

### Fase 6: migration e verificação (obrigatória)
1. `npx tsc --noEmit`: o schema e os usos compilam.
2. `npm run db:generate`: gera `drizzle/NNNN_<nome>.sql` + snapshot em `drizzle/meta/`.
   (O `generate` compara com os snapshots locais; não aplica nada no banco.)
3. **Leia o SQL gerado** e confira com o plano: só os `CREATE`/`ALTER` esperados. Qualquer
   `DROP`, `RENAME` ou `ALTER ... TYPE` não previsto → pare, não apague o arquivo à mão sem
   avisar, e reporte.
4. Se o drizzle-kit fizer pergunta interativa (ex.: "coluna renomeada ou nova?"), **não
   responda por conta própria**: interrompa e leve a pergunta ao usuário.

Ao final, liste: tabelas/colunas alteradas em `lib/schema.ts`, arquivo de migration gerado,
e o comando que o usuário roda para aplicar (`npm run db:migrate`) quando decidir.
