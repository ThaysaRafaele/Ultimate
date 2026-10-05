---
name: mapa-artefatos-base
description: >-
  Skill-base definitorial (não invocável) da família `design-entidades`: fonte
  única da taxonomia dos 9 alvos fixos, do schema do mapa/fragmento, do
  fingerprint/delta, da postura global e da convenção de nomes. As demais skills a
  citam por caminho relativo, em vez de redefinir.
---

# mapa-artefatos-base: fonte única de taxonomia, schema, fingerprint e método

Skill-**base** do fluxo de design de entidades. **Não executa**: ela **define** o
vocabulário e os contratos que as demais skills da família reusam, para eliminar o
*drift* (a mesma definição recopiada em vários lugares e divergindo). Não tem fases,
gates nem `/comando`, e não roda como subagente.

**Regra de ouro: cite, não copie.** Toda regra global, taxonomia, schema,
fingerprint, convenção de nomes e postura vive **aqui, uma vez**, e é referenciada
por **caminho relativo**. Se uma skill precisa de uma definição que não existe aqui,
a lacuna é **desta** base, corrija aqui, não crie uma segunda definição. As únicas
cópias controladas no fluxo são os **templates de saída de design**.

## O que é o mapa de artefatos

`docs/entities/_map/mapa-artefatos.md` registra, por artefato de requisito do escopo,
**o que** contém (os 9 alvos), **onde** (localização relativa) e com **que confiança/
evidência**. É a entrada da análise de inconsistências e de toda a produção; é a
**única fonte de verdade do fingerprint** das fontes (os artefatos de design **não**
duplicam o sha256, guardam só a procedência); é versionado por `schema_version` e
revisável por humano. Formato canônico e contrato de `schema_version` (§6) em
`references/schema-mapa-artefatos.md`.

## Referências desta base

| Reference | Define |
|---|---|
| `references/taxonomia-alvos-fixos.md` | Os 9 alvos fixos, fronteiras e desambiguação (EST⊂ACT, ENT×ATOR). |
| `references/schema-mapa-artefatos.md` | Schema do mapa e do fragmento; gramática de âncoras; validação; `schema_version`. |
| `references/fingerprint-e-delta.md` | sha256 normalizado e classes de delta (NOVO/ALTERADO/REMOVIDO/INALTERADO/ÓRFÃO); preservação humana. |
| `references/exemplos-mapa.md` | Gabaritos válidos do mapa (documento, código, par protótipo). |
| `references/postura-global.md` | Postura herdada: zero presunção, retorno enxuto, somente-leitura, idempotência, duas passagens. |
| `references/convencao-nomes-artefatos.md` | Nomes/saída das produtoras: slug, procedência, idempotência, não-edição do MER. |
| `references/seguranca-prototipo.md` | Segurança ao ler protótipo: não executa, mock=dado, segredos por localização. |
| `references/base-metodologica-spdd.md` | Template SPDD e origem metodológica (spec-como-contrato). |
| `references/nomes-canonicos.md` | Lista canônica dos nomes de skill (handoff/delegação). |
