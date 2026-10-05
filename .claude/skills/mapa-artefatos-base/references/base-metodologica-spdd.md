# Base metodológica: SPDD (spec-como-contrato)

> **Fonte única.** Origem metodológica da família `design-entidades`; citada em
> `# Decisões e regras` das skills SPDD (revisão/incremental). A **postura de
> comportamento** vive em `postura-global.md`, aqui só o princípio e a anatomia.

**Princípio (prompt como contrato).** No **SPDD** (*Structured Prompt-Driven
Development*) a especificação é o **artefato de verdade**: quando a realidade diverge,
**conserta-se a especificação primeiro**: não se improvisa. Daí o gate de **zero
presunção** (`postura-global.md`).

**Anatomia SPDD** (`SKILL.md` de revisão/incremental, nesta ordem): `# Contexto` →
`# Descrição` → `# Objetivo` → `# Decisões e regras` (invariantes, inclusive as
herdadas desta base e de `postura-global.md`) → `# Planejamento` com `## Fase N`, onde
**cada fase é um GATE inline** (sem seção "Resumo dos gates" separada). Skills
**operacionais** (classificação/produção) **não** usam SPDD, usam a anatomia
operacional (Princípio central → fases-gate).
