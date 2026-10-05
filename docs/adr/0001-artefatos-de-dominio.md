# 0001. Registrar o domínio em CONTEXT.md, docs/adr e docs/dominio

- Status: aceita
- Data: 2026-10-05
- Fontes: skill `grilling-dominio`

## Contexto
O projeto não tinha documento de requisitos. Regras viviam no código, em comentários de
scripts de importação e no protótipo HTML, sem um lugar único para vocabulário e decisões.

## Decisão
- Glossário e pendências em `CONTEXT.md` (raiz).
- Decisões estruturais em `docs/adr/NNNN-<slug>.md`.
- Máquinas de estado em `docs/dominio/estados-<entidade>.mmd` (`stateDiagram-v2`).
- Precedência entre fontes: decisão confirmada com o usuário > código em produção > protótipo.
- O protótipo HTML está desatualizado (decisões posteriores foram tomadas em reuniões com o
  técnico): vale só como referência visual, nunca como requisito.

## Consequências
Issues (`docs/issues/`) e o design de entidades (`docs/entities/`) citam esses arquivos.
Pendência resolvida sai de "A definir" e vira ADR ou texto do glossário.
