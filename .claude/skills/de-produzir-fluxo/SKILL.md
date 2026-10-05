---
name: de-produzir-fluxo
description: >-
  Gera UM arquivo de caso de uso/fluxo (`flows/<slug>.md`) a partir do inventário
  travado e do MER: objetivo, atores, entidades/relações envolvidas, efeitos
  (ACT/EST), passos, pré/pós-condições e RN vinculadas. Acione via `design-entidades`
  após o MER, ou com `/de-produzir-fluxo`, ao documentar um caso de uso.
---

# de-produzir-fluxo: descrição de caso de uso / fluxo a partir do inventário + MER

Skill-folha de produção. **Entrada:** inventário de domínio travado, `MER.md` (índice
entidade→slug) e **slug do fluxo-alvo**. **Processo:** extrai do inventário o caso de uso
(objetivo, atores, entidades/relações envolvidas, passos com efeitos ACT/EST, RN). **Saída:**
um único arquivo `<RAIZ_DESIGN>/flows/<slug>.md` (o alvo **FLX** do mapa vira artefato de
design).

Postura herdada: `../mapa-artefatos-base/references/postura-global.md`. Saída comum (slug,
procedência, idempotência por-alvo, não-edição cruzada do MER/inventário/mapa/fontes, órfão,
manifesto): `../mapa-artefatos-base/references/convencao-nomes-artefatos.md`.

**Específico do fluxo:**

- **Fiel ao inventário e ao MER:** atores e entidades já foram resolvidos no inventário; toda
  entidade/ator/relação citada **existe** no MER/inventário. Cita inexistente → não inventa,
  devolve.
- **Efeito de estado só com evidência:** passo com `muda_estado: true` é **EST**; os demais,
  **ACT**. Não presume efeito de estado.
- **Bloco de RN obrigatório** na descrição (mesmo "nenhuma RN vinculada").

Cada fase é um **GATE**: falhou → encerre ou devolva a dúvida ao orquestrador, **sem** gravar
fluxo parcial/presumido.

---

### Fase 1: Entrada e validação

Receba inventário, MER e o **slug do fluxo-alvo**; não escaneie o repo. Valide o inventário
contra `../de-revisar-entidades-regras/references/criterios-validacao-entidade.md` (§3.4 fluxo;
§3.5 RN; §3.6: `schema_version` compatível, `pronto_para_mer: true`, regra 7 integridade
referencial) e confirme que o MER existe (índice entidade→slug, para checar que as entidades
do fluxo existem).

**GATE 1:** inventário/MER ausente·ilegível ou `schema_version` incompatível → encerre com
motivo (direcione a `/de-revisar-entidades-regras` + `/de-produzir-mer`); `pronto_para_mer:
false`/inválido → não produz; slug do fluxo ausente do inventário → devolve (fluxo não
consolidado, não inventa).

### Fase 2: Extração do fluxo

Na seção de fluxo (`fluxo:`) do slug-alvo, extraia cada item com sua `origem` (semântica
FLX/ACT/EST/ATOR/RN em `../mapa-artefatos-base/references/taxonomia-alvos-fixos.md`): **FLX**
(`objetivo`), **ATOR** (`atores[]`, cada um resolvido), **ENT** (`entidades_envolvidas[]`,
slugs do MER), **Passos** (`passos[]` ordenados: `ordem`/`acao`/`entidade`/`muda_estado`/`origem`;
`muda_estado: true` = **EST**) e **RN** (ids de `fluxo.rn[]` resolvidos em `## regras-de-negocio`).
Registre as **relações afetadas**: dois passos consecutivos que tocam entidades ligadas por uma
relação do inventário/MER → anote o par de slugs alfabético.

**GATE 2:** sem `objetivo`, sem `≥ 1 ator`, sem `≥ 1 entidade envolvida` ou sem `≥ 1 passo`
(§1.4), ou ator/entidade/RN que não resolve (referência pendurada, §3.6 regra 7) → não inventa,
devolve (divergência do inventário).

### Fase 3: Montagem e gravação idempotente

Monte **estritamente** conforme `references/template-fluxo.md` (pré/pós-condições não-bloqueantes:
"não evidenciado" quando ausentes, nunca palpite). Grave **um único** `flows/<slug>.md`,
idempotente, com o slug reusado do inventário (`fluxo.id`). **Antes de persistir**, revalide:
procedência; toda seção obrigatória; bloco RN; toda entidade/ator/relação citada existe no
MER/inventário; passos com fonte; sem segredo.

**GATE 3:** seção ausente / referência pendurada / procedência incompleta → não persiste,
devolve o que falta. Não toca MER/inventário/mapa/fontes.

### Fase 4: Manifesto e cruzados

Devolva o **manifesto pequeno** (convenção §8): caminho; contagens (atores/entidades/passos/RN);
**dúvidas** (lacunas devolvidas); **cruzados**, divergência fluxo×MER/inventário (→
`de-produzir-mer`/`de-revisar-entidades-regras`), órfão (fluxo sumido das fontes → decisão
humana). Sem colar a descrição.

**GATE 4:** nunca edita MER/inventário para resolver cruzado nem apaga órfão, apenas
**reporta**; o orquestrador encaminha.
