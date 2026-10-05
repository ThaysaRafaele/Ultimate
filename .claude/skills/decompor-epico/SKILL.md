---
name: decompor-epico
description: Use para quebrar um épico (uma funcionalidade grande, ex.: "mensalidades", "treinos e presença", "login do técnico") em issues verticais pequenas, com contexto/decisões, tasks na ordem da stack e definição de pronto. Acione quando o usuário pedir para decompor/dividir/fatiar um épico, criar issues, planejar a próxima onda, ou antes de rodar o workflow executar-issue sobre algo que ainda não tem issue.
---

# Decompor Épico em Issues (Fase 2 do método)

## Visão geral

Transforma **um** épico em issues verticais executáveis pelo workflow `executar-issue`
(`.claude/workflows/executar-issue.js`). A issue é o contrato de execução: o que estiver
mal escrito aqui vira decisão silenciosa do agente depois.

**Pré-requisito:** saídas da skill `grilling-dominio` cobrindo o épico (`CONTEXT.md`,
`docs/adr/`, `docs/dominio/estados-*.mmd`). Sem elas, ou se o épico traz termo/estado que
o `CONTEXT.md` não conhece, rode o grilling primeiro.

## Regras de decomposição

1. **Um épico por vez.** Épicos futuros têm "A definir" abertos; decompor cedo gera retrabalho.
2. **Fatias verticais tracer-bullet.** A Issue 1 atravessa a stack inteira no mínimo
   (tabela → validação → repo → rota → tela) e entrega algo navegável. As seguintes
   **engrossam** por história/comportamento. Nunca fatiar por camada ("criar todos os repos").
3. **Uma issue por unidade de valor navegável.** História gorda → mais de uma issue.
4. **Ordem fixa de tasks** (pule as que a issue não toca, dizendo "não se aplica"):
   0. **Vitest** (só se `vitest` ainda não está no `package.json`): setup de
      `references/vitest-setup.md`. Fica na primeira issue que precisar de teste.
   1. **Modelo de dados**: atualizar `docs/entities/MER.md` e aplicar
      `drizzle-from-mermaid-erd` (edita `lib/schema.ts`, roda `npm run db:generate`,
      revisa o SQL). Migration **gerada, não aplicada**.
   2. **Regra pura**: `lib/<x>-validation.ts` / `lib/<x>-calc.ts` (sem import de `@/lib/db`).
   3. **Repo**: `lib/<x>-repo.ts` (Drizzle; consultas e escritas).
   4. **Rota**: `app/api/<x>/route.ts` (valida com 2, chama 3, erro `{ error }` + status).
   5. **Tela**: `app/<rota>/page.tsx` (Server Component lendo via repo) +
      `components/<X>.tsx` (`"use client"`, `fetch` → `router.refresh()`) +
      `lib/nav-items.ts` se for área nova. A issue descreve a experiência: estados
      carregando/vazio/erro, feedback após salvar, confirmação em ação destrutiva,
      comportamento no celular.
   6. **Teste** (test-after, Vitest): funções puras da task 2.
5. **Pendências não bloqueiam:** default provisório na issue + "⚠ confirmar". Não criar
   issue só de decisão.
6. **Toda issue cita suas fontes**: termos do `CONTEXT.md`, ADRs, estados de
   `docs/dominio/`, e a tela do protótipo (`_prototype_extracted.html`, nome da tela) se
   houver. O protótipo está desatualizado: serve de inspiração visual, não de requisito.
7. **Rota que muda estado** precisa mapear para uma transição de `docs/dominio/estados-*.mmd`.
   Transição nova → atualizar o `.mmd` na própria issue.
8. **Dados existentes**: issue que altera tabela com dados (jogos 2018/2019, atletas) diz
   como ficam as linhas antigas (default, backfill por `scripts/*.mjs`, ou nada).

## Modos

- **Modo A, usuário presente:** apresente a quebra como lista numerada (título, comportamento
  coberto, dependências, o que fica fora) e pergunte: granularidade ok? dependências
  corretas? fundir/dividir algo? **Só escreva o arquivo após aprovação.**
- **Modo B, sessão autônoma:** escreva direto, com uma seção `## Decisões de decomposição`
  no topo: por que N issues, o que ficou fora, ao menos 1 alternativa de corte descartada
  com motivo. Sem essa seção a decomposição não está concluída.

## Saída: `docs/issues/<epico>.md`

Estrutura obrigatória em `references/template-issues.md`. Cada issue tem: Contexto/Decisões
(fontes), Protótipo, Escopo/Fora, Tasks na ordem fixa, Critérios de aceitação verificáveis,
⚠ Pendências, Definição de pronto.

**Definição de pronto (padrão):**
- `npm run lint` sem erros;
- `npx tsc --noEmit` sem erros;
- `npm test` passa (Vitest);
- `npm run build` conclui;
- fluxo conferido no `npm run dev` (a tela da issue funciona ponta a ponta, no desktop e no celular);
- UI revisada: estados carregando/vazio/erro, feedback de sucesso, visual coerente com o resto do app;
- nenhuma dependência ou serviço pago (se inevitável, ⚠ pendência com o custo);
- se houve task 1: migration em `drizzle/` gerada e revisada, **não aplicada**.

## Red flags (pare e corrija)

- Decompondo mais de um épico de uma vez.
- Issue de camada em vez de fatia vertical.
- Issue sem fontes (CONTEXT/ADR), sem seção **Fora** ou sem critério verificável.
- Critério de aceitação inventado que não sai do épico, do `CONTEXT.md` ou de ADR (se
  precisar, vira ⚠ pendência).
- Rota que muda estado sem transição no `.mmd`.
- Modo B sem `## Decisões de decomposição`.

## Checklist de saída

- [ ] Pré-requisitos do grilling verificados
- [ ] Issue 1 é tracer-bullet ponta a ponta; seguintes engrossam
- [ ] Toda issue: Contexto/Decisões + Protótipo + Escopo/Fora + tasks na ordem fixa + CAs +
      Definição de pronto
- [ ] Pendências com default + ⚠ (nenhuma removida do escopo)
- [ ] Modo A: quebra aprovada · Modo B: "Decisões de decomposição" presente
- [ ] Arquivo salvo em `docs/issues/<epico>.md`
