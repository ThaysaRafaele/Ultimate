# Ultimate Basketball: gestão do time

App de gestão do time de basquete Ultimate: atletas, categorias, campeonatos, jogos,
escalação, boletim de estatísticas e recordes pessoais. Vocabulário do domínio em
`CONTEXT.md`.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5 (strict). App única: telas e API no mesmo projeto.
- Drizzle ORM + Neon Postgres (driver `neon-http`). Fotos no Vercel Blob.
- Tailwind CSS 4. ESLint 9 (`eslint-config-next`). Testes: Vitest 4.

## Como rodar

Local, sem Docker. Precisa de `.env.local` com `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN`
(modelo em `.env.example`). O `DATABASE_URL` aponta para o banco **com dados reais**.

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | checagem de tipos |
| `npm test` | Vitest (testes de lógica pura em `lib/*.test.ts`; regras em `.claude/skills/decompor-epico/references/vitest-setup.md`) |
| `npm run build` | build de produção |
| `npm run db:generate` | gera migration em `drizzle/` a partir de `lib/schema.ts` |
| `npm run db:migrate` | aplica migrations no banco. **Só com pedido explícito.** |

## Organização

- `app/<rota>/page.tsx`: telas (Server Components que leem via repos).
- `app/api/<recurso>/route.ts`: API. Valida, chama repo, responde `{ error }` + status em erro.
- `components/*.tsx`: componentes client (modais, listas, filtros).
- `lib/schema.ts`: todas as tabelas Drizzle. `lib/db.ts`: conexão.
- `lib/<x>-repo.ts`: acesso a dados. `lib/*validation*.ts`, `lib/*-calc.ts`: regras puras
  (sem import de `@/lib/db`, podem ir para o cliente).
- `drizzle/`: migrations geradas. `scripts/*.mjs`: importações únicas (dry-run por padrão, `--apply` grava).
- `docs/`: dados de referência (`*.json`), ADRs (`docs/adr/`), estados (`docs/dominio/`),
  design de entidades (`docs/entities/`), issues (`docs/issues/`).
- Protótipo: `_prototype_extracted.html` (legível) e `Ultimate Gestao*.html` (bundles).

## Convenções

- Textos de UI e mensagens de erro em PT-BR. Identificadores e nomes de tabela em inglês
  (`games`, `gameStats`), colunas `snake_case` no banco e `camelCase` no TS.
- Validação sempre no servidor (função pura compartilhada); a do formulário é só conveniência.
- Nome e apelido de atleta gravados em MAIÚSCULAS.
- Datas como `YYYY-MM-DD` em data local (ver `lib/validation.ts`, nunca `toISOString()` para "hoje").
- Status como `text` + lista fechada em TS (ex.: `GAME_STATUSES`), não `pgEnum`.
- O schema não declara FKs; relações são colunas `<x>Id` resolvidas por join nos repos.
- Responsivo com breakpoints `max-md:`.
- Não aplicar migration nem rodar script com `--apply` sem pedido explícito.

## Preferências de trabalho

- **Nunca fazer commit nem push.** Ao terminar, listar os grupos de arquivos que podem ser
  commitados juntos, cada um com uma sugestão de mensagem (`feat:`/`fix:`/`docs:`/`chore:`
  em português). A revisão e o commit são manuais.
- **UI/UX em primeiro plano.** Toda tela nova ou alterada deve ser intuitiva, bonita e amigável:
  hierarquia visual clara, estados de carregando/vazio/erro, feedback após salvar,
  confirmação em ações destrutivas, microcopy em PT-BR, uso confortável no celular.
  Seguir os tokens visuais existentes (`app/globals.css`: `brand-red`, `ink`, `muted-*`).
- **Sempre a opção gratuita.** Banco, back-end, infraestrutura e bibliotecas: preferir free
  tier/open source (hoje Neon, Vercel e Vercel Blob). Avisar antes de sugerir algo com custo
  ou que possa estourar o limite gratuito.
- O protótipo HTML está desatualizado: é referência visual, não requisito (ver `CONTEXT.md`).

## Skills do projeto

Em `.claude/skills/` e `.claude/workflows/`:

| Skill | Quando usar |
|---|---|
| `grilling-dominio` | Antes de construir algo novo ou quando surgir regra nova: caça contradições e grava `CONTEXT.md`, `docs/adr/`, `docs/dominio/estados-*.mmd` e pendências. |
| `decompor-epico` | Quebrar um épico em issues verticais em `docs/issues/<epico>.md` (tasks na ordem modelo → regra → repo → rota → tela → teste). |
| `drizzle-from-mermaid-erd` | Transformar um `erDiagram` Mermaid em tabelas no `lib/schema.ts` + migration gerada (nunca aplicada). |
| `design-entidades` | Pipeline completo de design de entidades (`/design-entidades`): mapa de artefatos → inconsistências → MER → descrições de entidades, relacionamentos e fluxos em `docs/entities/`. Orquestra as skills `de-*` e usa `mapa-artefatos-base` como referência. |
| `de-*` | Etapas internas do `design-entidades` (classificar doc/código/protótipo, revisar mapa, analisar inconsistências, revisar entidades, produzir MER/entidade/relacionamento/fluxo, reexecução incremental). Normalmente acionadas pelo orquestrador. |
| workflow `executar-issue` | Executar uma issue de `docs/issues/` com subagentes: modelo de dados → implementação → revisão (+ correção). Args: `{ issueArquivo, issueNumero }`. |

Fluxo típico: `grilling-dominio` → (`design-entidades`, se o domínio crescer) → `decompor-epico` → `executar-issue`.
