# Vitest no projeto

**Status: configurado** (Issue 1 da Visão geral, 2026-10-05). A task 0 das próximas issues é
"não se aplica".

Como ficou:
- `vitest@^4` (o Vitest 5 exige `@types/node` ≥ 22; o projeto usa `^20`). Ao subir o
  `@types/node`, dá para atualizar o Vitest.
- Scripts: `"test": "vitest run"` e `"test:watch": "vitest"`.
- `vitest.config.mts` na raiz (extensão `.mts` porque o `package.json` não é `"type": "module"`;
  alias `@` via `fileURLToPath(new URL(".", import.meta.url))`).

Regras para testes:
1. Ficam ao lado do código: `lib/<x>.test.ts`.
2. **Escopo:** só lógica pura (`lib/*-validation.ts`, `lib/*-calc.ts`, `lib/format.ts`,
   `lib/game-filters.ts`...). Nada que importe `@/lib/db` (o driver Neon tenta conectar).
3. Datas: funções que usam "hoje" (`todayISO`, `ageLimitError`) são testadas com
   `vi.useFakeTimers()` + `vi.setSystemTime(...)`.
