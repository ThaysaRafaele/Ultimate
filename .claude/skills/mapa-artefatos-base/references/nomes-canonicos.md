# Nomes canônicos da família de skills `design-entidades`

> **Autoridade única.** Esta é a lista **canônica** dos nomes, comandos e pastas
> da família de skills `design-entidades`, a fonte para qualquer skill que precise
> referenciar outra. Use **exatamente** um dos nomes abaixo, nunca um sinônimo,
> abreviação ou tradução. Este arquivo fixa também a regra de validação de nomes.
> Não crie uma segunda descrição de papéis aqui, isso reintroduziria drift de
> nomenclatura.

## Como usar esta referência

Qualquer skill que precise **referenciar outra skill** (handoff do orquestrador,
delegação de harmonização) deve usar **exatamente** um dos nomes abaixo, nunca
um sinônimo, abreviação ou tradução. Os papéis e responsabilidades de cada skill
vivem na própria `SKILL.md` (campo `description` + corpo).

## Lista canônica (nome da skill / comando)

| Skill (`name` / pasta)        | Comando                        |
|-------------------------------|--------------------------------|
| `design-entidades`            | `/design-entidades`            |
| `mapa-artefatos-base`         | (não invocável, skill-base)   |
| `de-classificar-doc`          | `/de-classificar-doc`          |
| `de-classificar-codigo`       | `/de-classificar-codigo`       |
| `de-classificar-prototipo`    | `/de-classificar-prototipo`    |
| `de-revisar-mapa`             | `/de-revisar-mapa`             |
| `de-analisar-inconsistencias` | `/de-analisar-inconsistencias` |
| `de-revisar-entidades-regras` | `/de-revisar-entidades-regras` |
| `de-produzir-mer`             | `/de-produzir-mer`             |
| `de-produzir-entidade`        | `/de-produzir-entidade`        |
| `de-produzir-relacionamento`  | `/de-produzir-relacionamento`  |
| `de-produzir-fluxo`           | `/de-produzir-fluxo`           |
| `de-reexecutar-incremental`   | `/de-reexecutar-incremental`   |
| `drizzle-from-mermaid-erd`    | `/drizzle-from-mermaid-erd`    |

São **14** entradas: 1 orquestradora (`design-entidades`), 1 skill-base
definitorial (`mapa-artefatos-base`), 1 skill a jusante
(`drizzle-from-mermaid-erd`) e 11 auxiliares com prefixo `de-`. O antigo roteador de
classificação foi **fundido no orquestrador** (inventário barato da Fase 0); a
classificação profunda permanece nas folhas `de-classificar-doc`/`-codigo`/`-prototipo`.

## Regra de validação de nomes

1. **Prefixo obrigatório `de-`** em toda skill auxiliar; a única exceção é a
   orquestradora `design-entidades` e a skill-base `mapa-artefatos-base`.
2. **Idioma:** todos os nomes são em **pt-BR**. Nomes em inglês para skills desta
   família são **inválidos**, a subárea originalmente proposta em inglês foi
   traduzida e congelada nesta lista.
3. **Mapa de artefatos:** existe **um único** arquivo de mapa, no caminho fixo
   `docs/entities/_map/mapa-artefatos.md` (ver `convencao-nomes-artefatos.md`).
   Qualquer outro nome de arquivo para o mapa é **inválido**, não há nome
   alternativo.
4. **Nome fora da lista = inválido.** Se uma skill precisar referenciar algo que
   não está na tabela acima, isso é um erro de planejamento: pare e reporte ao
   orquestrador (zero presunção), não invente um nome novo.
