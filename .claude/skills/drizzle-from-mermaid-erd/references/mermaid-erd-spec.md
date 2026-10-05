# Referência: DSL Mermaid `erDiagram`

Use este arquivo na Fase 1 (validação sintática) e Fase 2 (completude). Consulte-o quando precisar decidir se uma construção do diagrama é válida e o que ela significa.

## Estrutura geral

Um diagrama válido começa com a palavra-chave `erDiagram`. Depois vêm linhas de relacionamento e, opcionalmente, blocos de atributos por entidade.

```
erDiagram
    CLIENTE ||--o{ PEDIDO : faz
    PEDIDO ||--|{ ITEM_PEDIDO : contem
    PRODUTO ||--o{ ITEM_PEDIDO : aparece_em

    CLIENTE {
        int id PK
        string nome
        string email UK
    }
```

## Sintaxe de relacionamento

Forma: `ENTIDADE_A <card_esq><linha><card_dir> ENTIDADE_B : "rótulo"`

- O **rótulo** após `:` é obrigatório. Pode vir entre aspas.
- A **linha** é `--` (relacionamento identificante / sólido) ou `..` (não-identificante / tracejado).

### Cardinalidades válidas

Lado esquerdo (lê-se da direita p/ esquerda) e lado direito têm marcadores espelhados:

| Esquerdo | Direito | Significado |
|----------|---------|-------------|
| `|o`     | `o|`    | Zero ou um |
| `||`     | `||`    | Exatamente um |
| `}o`     | `o{`    | Zero ou muitos |
| `}|`     | `|{`    | Um ou muitos |

Qualquer combinação fora desses tokens é **inválida** (ex.: `??`, `1`, `*`, `-->`, `<>`). Sinalize como erro de sintaxe.

Exemplos válidos: `||--o{`, `}o--||`, `|o..o|`, `}|--|{`.

### Como ler cardinalidade para modelagem

- `A ||--o{ B` → um A tem zero-ou-muitos B; B tem exatamente um A → **1:N** (FK em B).
- `A ||--|| B` → **1:1**.
- `A }o--o{ B` → **N:M** (precisa de tabela associativa).
- Linha sólida `--` indica relacionamento **identificante** (a FK faz parte da PK de B → considere PK composta). Linha tracejada `..` é **não-identificante**.

## Blocos de atributos

```
ENTIDADE {
    tipo nome restricao "comentario"
}
```

- `tipo` e `nome` são obrigatórios dentro do bloco. Atributo sem um deles é erro.
- Restrições de chave: `PK`, `FK`, `UK` (pode haver mais de uma, separadas por vírgula: `PK, FK`).
- `tipo` é texto livre no Mermaid (`int`, `string`, `uuid`, `varchar(50)`, etc.). **Não há tipo padrão**: se o atributo precisar virar coluna e o tipo for ausente/ambíguo para mapear ao Drizzle (`pg-core`), pergunte ao usuário.

### Convenções de tipo deste repo (dialeto acordado)

Para que o MER mapeie sem ambiguidade para `lib/schema.ts`, use estes tipos no bloco:

| Tipo no MER | Significado | Drizzle (`drizzle-orm/pg-core`) |
|---|---|---|
| `serial` | inteiro autoincremento (PK numérica) | `serial("x")` |
| `int` | inteiro | `integer("x")` |
| `text` | texto sem limite | `text("x")` |
| `slug` | texto usado como PK legível (ex.: id de categoria/campeonato) | `text("x").primaryKey()` |
| `text_array` | lista de textos (desnormalizado; ver drizzle-patterns §Arrays) | `text("x").array()` |
| `bool` | booleano | `boolean("x")` |
| `date` | data sem hora (`YYYY-MM-DD`) | `date("x")` |
| `timestamp` | data e hora | `timestamp("x")` |
| `numeric(p,s)` | decimal exato (ex.: valores monetários) | `numeric("x", { precision: p, scale: s })` |

Nome do atributo no MER = **nome da coluna no banco** (`snake_case`, ex.: `game_date`); a
propriedade TS correspondente é o `camelCase` (`gameDate`). Comentário entre aspas pode
indicar `"not null"`, `"default: <valor>"` ou `"nullable"`.

## Checklist de validação sintática (Fase 1)

- [ ] Começa com `erDiagram`.
- [ ] Toda linha de relacionamento usa cardinalidade válida da tabela acima.
- [ ] Todo relacionamento tem rótulo após `:`.
- [ ] Todo `{` de bloco tem `}` correspondente.
- [ ] Todo atributo tem tipo e nome.
- [ ] Toda entidade citada em relacionamento foi declarada (ou tem bloco, ou ao menos aparece consistentemente).
- [ ] Sem nomes duplicados de entidade; sem atributos duplicados na mesma entidade.

Qualquer falha → **GATE 1**: encerrar e reportar com linha + motivo.

## Checklist de completude (Fase 2)

- [ ] Cardinalidade de cada relacionamento é interpretável (1:1 / 1:N / N:M).
- [ ] Cada entidade tem PK identificável.
- [ ] Tipos suficientes para mapear cada coluna.
- [ ] N:M têm representação acordada (associativa explícita vs. `Table`).
- [ ] Nulabilidade/unicidade/defaults definidos onde forem relevantes.

Qualquer lacuna → **GATE 2**: perguntar e aguardar.
