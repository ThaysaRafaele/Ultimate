# Contrato de handoff: `MER.md` → `drizzle-from-mermaid-erd`

> **Reference da skill `de-produzir-mer`.** Define o **contrato a jusante**: o que a skill
> consumidora `drizzle-from-mermaid-erd` **exige** de um MER para atualizar `lib/schema.ts`
> sem retrabalho, e como o handoff acontece. O objetivo é que o `MER.md` produzido **passe
> no GATE 1 do consumidor** (validação sintática) e minimize as perguntas do GATE 2
> (completude), **sem** que `de-produzir-mer` decida o que pertence ao consumidor.
>
> O dialeto Mermaid (incluindo a tabela de tipos do repo) é o de
> `../../drizzle-from-mermaid-erd/references/mermaid-erd-spec.md` (dono único). Os nomes
> de skill são os de `../../mapa-artefatos-base/references/nomes-canonicos.md`.

## 1. Princípio: o handoff é oferecido, nunca encadeado

- O handoff **não é automático**. `de-produzir-mer` **não aciona**
  `drizzle-from-mermaid-erd` (sem `Task` aninhado): só **sinaliza** ao orquestrador que o
  MER está pronto.
- Quem **oferece** o handoff ao humano e o executa **sob aprovação explícita** é o
  **orquestrador** (`design-entidades`, Fase 5). Sem aprovação, o fluxo encerra com o
  `MER.md` pronto sob `RAIZ_DESIGN`.
- O consumidor recebe **o caminho do `MER.md`**, não os artefatos brutos nem o inventário.

## 2. O que o consumidor exige do MER (alinhar antes de gravar)

| Exigência do consumidor | Como `de-produzir-mer` atende | Se faltar evidência |
|---|---|---|
| **Sintaxe `erDiagram` válida** (GATE 1) | Auto-aplica o checklist sintático de `mermaid-erd-spec.md` na Fase 5; só grava se passaria. | Não grava (GATE 5). |
| **PK identificável por entidade** | Marca `PK` no identificador (vindo do inventário). | Devolve dúvida (GATE 3); não inventa. |
| **Cardinalidade interpretável** (1:1/1:N/N:M) | Mapeia a `cardinalidade` do inventário para a notação espelhada. | Devolve dúvida (GATE 3); não presume 1:N. |
| **Tipos das colunas** | Usa **só** os tipos da tabela "Convenções de tipo deste repo" do spec (`serial`, `int`, `text`, `slug`, `text_array`, `bool`, `date`, `timestamp`, `numeric(p,s)`). | Atributo sem tipo → devolve dúvida (definir ou deixar fora do bloco). |
| **Nome de coluna** | Atributo no bloco = nome da coluna no banco, `snake_case`. | Nome ambíguo → devolve dúvida. |
| **Representação de N:M** | N:M binário → `}o--o{` (o consumidor decide associativa vs array). | (nenhuma) |
| **N-ário (aridade > 2)** | Entidade associativa + binárias, **sob confirmação** do orquestrador. | Devolve proposta (GATE 3). |
| **Identificante vs não-identificante** (`--`/`..`) | `--` por padrão; `..` só com existência independente evidenciada. | Ambíguo e muda a PK → dúvida. |

> **Fronteira de responsabilidade.** Normalização (3FN), qual lado detém a coluna em 1:1,
> associativa vs `text_array` em N:M, declarar ou não FK (`.references()`), `onDelete`,
> e o impacto em dados existentes são do **consumidor** (Gates 2 a 4 dele).

## 3. O que o consumidor decide (não é responsabilidade do MER)

- se a relação vira FK declarada ou continua implícita (padrão atual do repo);
- nulabilidade/default além do que o comentário do atributo expressa;
- a tabela associativa concreta de um N:M binário;
- a estratégia de migration (aditiva, em duas etapas, backfill por script).

## 4. Resumo

- Handoff = **oferta sob aprovação**, executada pelo orquestrador; `de-produzir-mer` só sinaliza.
- O MER entregue **passa no GATE 1** do consumidor e traz PK, cardinalidade e tipos do
  dialeto do repo. Lacuna vira **dúvida devolvida**, nunca palpite.
