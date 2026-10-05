---
name: grilling-dominio
description: Use antes de construir ou decompor qualquer funcionalidade, para afiar o domínio. Interroga requisitos, protótipo, código e dados de referência atrás de contradições, ambiguidades e comportamento não documentado, e cristaliza glossário (CONTEXT.md), decisões (docs/adr/), modelo de estados (docs/dominio/) e lista de perguntas em aberto. Acione quando o usuário pedir para "fazer o grilling", "entender/afiar o domínio", "levantar dúvidas de regra de negócio", antes de `decompor-epico`, ou quando surgir regra nova (ex.: treinos, mensalidades, login).
---

# Grilling de Domínio (Fase 1 do método)

## Visão geral

Transforma **qualquer** conjunto de requisitos + material de referência em artefatos de
domínio **antes de qualquer código**. A complexidade real de um sistema é comportamental
(ciclos de vida, atores, permissões, prazos, invariantes). Se ela não vira artefato escrito
agora, vira retrabalho e decisão silenciosa depois.

O objetivo central é **caçar contradições de domínio**. Uma contradição é qualquer ponto onde
duas fontes (ou duas partes da mesma fonte) **não podem ser ambas verdadeiras**, ou onde o
vocabulário/comportamento não fecha.

> **Regra de ouro:** nada de descer para implementação/decomposição enquanto as saídas
> obrigatórias (glossário, decisões, modelo de comportamento, pendências) não existirem como arquivo.

## Entradas (use o que existir; localize pelo papel, não pelo nome)

1. **Requisitos**: épico, descrição de funcionalidade, pedido do técnico/usuário. Este repo
   **não tem** documento de requisitos formal; o pedido do usuário na conversa é a fonte primária.
2. **Material de referência**:
   - protótipo: `_prototype_extracted.html` (template legível; os bundles
     `Ultimate Gestao*.html`/`index.html` são o mesmo protótipo empacotado). **Está
     desatualizado** em relação a decisões tomadas com o técnico: use como referência
     visual; divergência protótipo × código vira no máximo pendência de baixa prioridade;
   - dados reais: `docs/*.json` (planilhas do técnico) e cabeçalhos de `scripts/*.mjs`
     (decisões já confirmadas com o técnico);
   - código: `lib/schema.ts`, `lib/*-validation.ts`, `lib/*-calc.ts`, `app/api/**/route.ts`.
3. **Modelo existente**: `CONTEXT.md`, `docs/adr/`, `docs/dominio/`. Se existirem, são para
   **validar/refinar**, não recriar.

## Tipos de contradição a procurar (checklist de atrito)

1. **Colisão de termo**: mesma palavra, dois significados; ou dois termos para a mesma coisa
   (ex.: "time" × "categoria" × "equipe").
2. **Ator/permissão implícito**: uma ação acontece mas nada diz **quem** pode fazê-la.
3. **Transição de estado faltando ou impossível**: estado citado sem entrada/saída, ou
   caminho que viola outra regra.
4. **Regra temporal sem dono**: prazo/idade/vigência sem dizer quem conta, quando começa,
   o que acontece ao estourar.
5. **Cardinalidade/relação ambígua**: 1:1 × 1:N × N:N não declarado; o que acontece com
   dependentes ao remover/inativar o pai.
6. **Invariante violável**: regra que duas outras, juntas, conseguem quebrar.
7. **Divergência fonte × fonte**: protótipo mostra X, código faz Y, planilha diz Z. Defina
   a **fonte vencedora** (default: decisão confirmada com o usuário > código em produção >
   protótipo) e registre.
8. **"A definir" / lacuna explícita**: a própria fonte admite buraco (ex.: item de menu sem
   tela, `TODO`, "não confirmado" em script).

## Processo

### 1. Exploração silenciosa
Leia todas as entradas. Monte a **lista de atritos** classificando cada item por tipo.
Não pergunte nada ainda: primeiro mapeie o conflito inteiro.

### 2. Entrevista (uma pergunta por vez)
Para cada atrito, pergunte **uma pergunta por vez**, sempre com **sua resposta recomendada
e o porquê**. Se a resposta é derivável das fontes, **não pergunte**: derive e registre.
Caminhe o ciclo de vida da entidade central ponta a ponta (quem cria, quem altera, quem
encerra) e o que acontece em cada exceção (cancelamento, inativação, correção de dado).

**Sessão autônoma (sem usuário):** não trave. Derive o derivável, adote **default
provisório + ⚠** para o resto e grave **todas** as perguntas não respondidas na lista de
pendências. Pergunta aberta sem registro = pendência engolida.

### 3. Saídas obrigatórias (a sessão não termina sem elas)

| Artefato | Onde | Conteúdo |
| --- | --- | --- |
| **Glossário** | `CONTEXT.md` (raiz) | Termos canônicos, 1 definição cada, com o nome usado no código entre parênteses (ex.: Categoria (`teams`)); toda colisão de termo resolvida |
| **Decisões (ADR)** | `docs/adr/NNNN-<slug>.md` | 1 por decisão estrutural: contexto, decisão, consequências, fonte vencedora; numeração sequencial de 4 dígitos |
| **Modelo de comportamento** | `docs/dominio/estados-<entidade>.mmd` (`stateDiagram-v2`) | Todo estado citado aparece; cada transição nomeia **ator** e condição; sem estados órfãos |
| **Pendências** | seção `## A definir` no fim do `CONTEXT.md` | Cada uma com **default provisório + ⚠ confirmar**; nunca removida do escopo |

Formato do ADR e do `CONTEXT.md` em `references/formatos.md`.

### 4. Mineração do material de referência
- Decisão embutida (comentário de script, regra de validação, fórmula da planilha) → ADR.
- Dúvida embutida ("não confirmado", item sem tela) → pendência ⚠.
- Campo/estado visível na referência e ausente do código → termo no glossário + nota
  "só no protótipo" (a tabela nasce depois, via `drizzle-from-mermaid-erd`).
- Divergência referência × código → registre qual venceu e por quê.

## Red flags (pare e corrija)
- Vou avançar para implementação/decomposição sem `CONTEXT.md` existir.
- Resolvi uma ambiguidade "na cabeça" sem gravar em ADR/glossário.
- Reescrevi um modelo de estados existente do zero, ignorando a versão anterior.
- "Resolvi" uma contradição sem registrar qual fonte venceu e por quê.
- Pergunta ficou sem resposta e não virou pendência ⚠.

## Checklist de saída
- [ ] Fontes lidas; protótipo, dados e scripts minerados
- [ ] Lista de atritos classificada por tipo
- [ ] `CONTEXT.md` com termos canônicos, colisões resolvidas e `## A definir` (defaults + ⚠)
- [ ] ADRs numeradas para cada decisão estrutural (com fonte vencedora)
- [ ] `docs/dominio/estados-*.mmd` cobrindo todo estado citado, com atores nas transições
- [ ] Nenhuma pergunta aberta fora da lista de pendências
