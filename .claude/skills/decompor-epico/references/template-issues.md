# Template: `docs/issues/<epico>.md`

```markdown
# Issues: Épico <N>, <nome>

Issues verticais (tracer-bullet) do épico. Este arquivo é a fonte (sem tracker).

**Épico (texto-fonte):** <o pedido do usuário/técnico, resumido em 2 a 5 linhas, com data>

## Como executar
- Ordem: Issue 1 → K. Issue 1 é tracer-bullet; 2 a K engrossam.
- Cada issue roda pelo workflow `executar-issue` (args: `issueArquivo`, `issueNumero`).
- Ordem fixa de tasks: (0) Vitest se faltar → (1) modelo de dados → (2) regra pura →
  (3) repo → (4) rota → (5) tela → (6) teste.
- Convenções: `CLAUDE.md`.

## Termos canônicos usados (ver CONTEXT.md)
- <termo> (`<nome no código>`): <valores/enum, se houver>

---

## Issue 1: Tracer-bullet, <título descrevendo a tela/comportamento>

**Contexto/Decisões:** `CONTEXT.md` › <termos> · ADR-NNNN · `docs/dominio/estados-<x>.mmd` (<transição>).
**Protótipo:** `_prototype_extracted.html` › tela "<nome>" (ou "não há").
**Escopo:** <o que entra>. **Fora:** <o que fica para outras issues>.

**Tasks:**
0. **Vitest**: <setup de references/vitest-setup.md | não se aplica (já configurado)>.
1. **Modelo de dados**: <tabela/colunas no MER + `lib/schema.ts` + migration | não se aplica>.
   Dados existentes: <o que acontece com as linhas atuais>.
2. **Regra pura** `lib/<x>-validation.ts`: <funções e regras, com mensagens de erro em PT-BR>.
3. **Repo** `lib/<x>-repo.ts`: <funções>.
4. **Rota** `app/api/<x>/route.ts`: <método + caminho, status de erro>.
5. **Tela** `app/<rota>/page.tsx` + `components/<X>.tsx`: <o que aparece, ações>.
6. **Teste** `lib/<x>-validation.test.ts`: <casos sensíveis: limites, combinações proibidas>.

**Critérios de aceitação:**
- [ ] <comportamento verificável na tela ou na API>

**⚠ Pendências (confirmar):** <default provisório + referência a P-NN do CONTEXT.md>.

**Definição de pronto:** `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
passam; fluxo conferido no `npm run dev`; migration (se houver) gerada e revisada, não aplicada.
```
