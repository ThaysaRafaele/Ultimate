# Setup do Vitest (task 0, uma vez no projeto)

Feito pela primeira issue que precisar de teste. Depois disso, a task 0 vira "não se aplica".

1. `npm install -D vitest`
2. `package.json` → scripts: `"test": "vitest run"` e `"test:watch": "vitest"`.
3. `vitest.config.ts` na raiz:

   ```ts
   import { defineConfig } from "vitest/config";
   import path from "path";

   export default defineConfig({
     resolve: { alias: { "@": path.resolve(__dirname, ".") } },
     test: { environment: "node", include: ["lib/**/*.test.ts"] },
   });
   ```

4. Testes ficam ao lado do código: `lib/<x>.test.ts`.
5. **Escopo:** só lógica pura (`lib/*-validation.ts`, `lib/*-calc.ts`, `lib/format.ts`,
   `lib/game-filters.ts`...). Nada que importe `@/lib/db` (o driver Neon tenta conectar).
   Datas: funções que usam "hoje" (`todayISO`, `ageLimitError`) devem ser testadas com
   `vi.useFakeTimers()` + `vi.setSystemTime(...)`.
6. Atualizar `CLAUDE.md` (comando `npm test` deixa de ser "a configurar").
