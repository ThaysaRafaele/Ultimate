# Protocolo de despacho de subagentes e costura de fragmentos

> **Escopo.** Este reference é da skill `design-entidades` e descreve **como o
> orquestrador despacha subagentes** (entrada, saída esperada, granularidade,
> limite de retorno) e **como costura os fragmentos no mapa sem reler os
> artefatos**. Ele **não redefine** taxonomia nem schema: o vocabulário dos 9
> alvos é o de `../../mapa-artefatos-base/references/taxonomia-alvos-fixos.md` e a
> estrutura do mapa/fragmento é a de
> `../../mapa-artefatos-base/references/schema-mapa-artefatos.md`, citados, nunca
> copiados. Os nomes das skills despachadas são os de
> `../../mapa-artefatos-base/references/nomes-canonicos.md`.

## Princípio: o orquestrador roteia, não lê

O orquestrador **nunca abre um artefato grande no próprio contexto**. O **roteamento**,
decidir o **tipo** de cada artefato por extensão/estrutura, **sem abrir o corpo**, é o
**inventário barato** que ele mesmo faz (Fase 0). Já tudo que exige **ler o corpo** de um
arquivo (classificar a fundo, analisar, produzir), ele **despacha um subagente** em
contexto isolado e recebe de volta um **retorno pequeno e estruturado**. O orquestrador
retém apenas três coisas: o **escopo**
(lista de caminhos), o **mapa** (`_map/mapa-artefatos.md`) e os **retornos
enxutos** dos subagentes. Conteúdo bruto das fontes **não entra** no contexto do
orquestrador.

## Granularidade de despacho (1 subagente por grupo coeso)

| Situação                                                | Granularidade                                                                 |
|---------------------------------------------------------|--------------------------------------------------------------------------------|
| Vários arquivos pequenos da mesma pasta/feature         | **1 subagente por grupo coeso** (pasta/feature), por padrão.                  |
| Arquivo grande/crítico (model extenso, doc longo)       | **1 subagente por arquivo**.                                                  |
| Protótipo funcional (diretório de app + mock de API)    | **1 única** chamada a `de-classificar-prototipo`, a varredura interna é dela. |
| Reclassificação de um único item (após ajuste humano)   | **1 subagente** só para o item; recostura pontual no mapa.                    |

Regra de ouro: agrupe por **afinidade de contexto** para o subagente entender o
artefato, mas mantenha o **retorno pequeno**. Quando em dúvida entre agrupar e
separar, separe, vários retornos pequenos poluem menos que um grande.

## Fan-out paralelo da classificação (Etapa 1, Fase 1)

As folhas de classificação dos N grupos/arquivos do escopo são **independentes**
(cada subagente lê só o que recebe e devolve seu próprio fragmento). O orquestrador
as despacha **em paralelo**: um **lote de subagentes concorrentes**, em vez de uma
fila sequencial, reduzindo tempo de parede e mantendo **cada subagente com contexto
pequeno e isolado**. Restrições do fan-out (valem aqui e na produção, Fase 4):

- **Barreira antes da costura.** O orquestrador **aguarda todos** os fragmentos do
  lote antes de costurar no mapa (Fase 2) e antes do **GATE 2** (validação humana).
  Nenhum fan-out atravessa um gate HITL, **gates são barreiras absolutas**.
- **Concorrência limitada / em lotes** (sem exageros): não dispare subagentes demais
  de uma vez, isso satura e infla o contexto do orquestrador com muitos retornos
  simultâneos. Prefira lotes; recolha, costure parcial se preciso, siga.
- **GATE de retorno enxuto** vale em cada retorno do lote (ver adiante): retorno
  grande é rejeitado/reinstruído individualmente, sem travar os demais.
- **GATE de orçamento do protótipo:** o protótipo continua sendo **1 única** chamada
  a `de-classificar-prototipo` (que faz sua varredura interna e pede confirmação de
  orçamento se necessário), não é "explodido" em paralelo pelo orquestrador.
- **Modo incremental:** o fan-out cobre **só o subconjunto em delta** (as fontes
  NOVAS/ALTERADAS), não o escopo inteiro.
- **Sem aninhamento mantido:** nenhum subagente do lote aciona outro (sem `Task` aninhado); todo
  fan-out parte do orquestrador e **volta** a ele para o merge.

## Prompt-template de despacho

Ao despachar uma **folha** de classificação
(`de-classificar-doc`/`de-classificar-codigo`/`de-classificar-prototipo`, Fase 1), o
orquestrador monta um prompt com **partes fixas, nunca o conteúdo do arquivo**:
identidade da sub-skill (ex.: "aplique `de-classificar-doc` a estes documentos"), lista
de **caminhos** a ler, os **9 alvos fixos** (por `taxonomia-alvos-fixos.md`),
o **esquema de saída** (fragmento de `schema-mapa-artefatos.md` §3) e as restrições
herdadas (somente-leitura; mock = dado; segredos só por localização; retorno enxuto
≤ 120 chars; não perguntar ao usuário). Esqueleto:

```
Tarefa: aplicar <sub_skill canônica> em subagente, somente-leitura.
Entrada (ler você, não eu):
  - <caminho-1>
  - <caminho-2>
Procure os 9 alvos fixos conforme
../../mapa-artefatos-base/references/taxonomia-alvos-fixos.md.
Devolva SÓ (a) o fragmento de ../../mapa-artefatos-base/references/schema-mapa-artefatos.md §3
(YAML `artefato:` + linhas de achados), um por artefato; e (b) a lista separada de
dúvidas/observações (ambiguidade, mock ausente, segredo por localização, nao-analisavel).
Não cole conteúdo. Evidência ≤ 120 chars. Não pergunte ao usuário; não acione outras
skills (sem Task aninhado).
```

Para **produção** (Fase 4) o template é análogo, mas a **entrada** é o
**MAPA/inventário** (não os artefatos brutos) e a **saída** é o artefato de
design gravado sob `RAIZ_DESIGN` + um **manifesto pequeno** (o que gravou, fontes,
pendências). Ver `pipeline-e-gates.md` → "Contrato de chamada por etapa".

## GATE de retorno enxuto (limite de tamanho)

Todo retorno de subagente é **fragmento/veredito + lista de dúvidas**, nada mais.
O orquestrador **rejeita e reinstrui** quando o retorno:

- cola **parágrafos** do documento ou **blocos de código** do artefato;
- traz **evidência > 120 caracteres** ou transcreve um segredo (deve vir só a
  localização);
- excede um tamanho razoável de resposta (ex.: protótipo no limite do orçamento).

Reinstrução padrão: "resuma para o fragmento do schema (YAML + linhas de achados),
evidência ≤ 120 chars; se for grande, **indexe** (uma linha por artefato/arquivo)
e devolva os filhos em lotes". Para o protótipo no limite, aceitar a **entrada-pai
+ índice resumido por filho** e receber os filhos em lotes (liga-se ao GATE de
orçamento de `de-classificar-prototipo`). **Nunca** aceitar conteúdo bruto "para
não perder informação": o que importa do artefato já está no fragmento.

## Costura dos fragmentos no mapa (sem reler artefatos)

Recebidos os fragmentos, o orquestrador monta/atualiza
`RAIZ_DESIGN/_map/mapa-artefatos.md` **só com o que veio nos fragmentos**,
**nunca reabrindo as fontes**. Passos:

1. **Manifesto global** (cria na primeira costura): `schema_version`, `gerado_em`
   (ISO-8601 UTC), `raiz_requisitos[]` (o escopo da Fase 0) e `total_artefatos`.
2. **Uma seção por fragmento:** heading `## <id>: <caminho>`, depois o **bloco
   YAML do artefato** exatamente como veio no fragmento, depois a **tabela
   "Achados por alvo fixo"** (linhas do fragmento). Para o protótipo, a
   entrada-pai (`tipo: prototipo`) e uma entrada-filho por arquivo (`parte_de` =
   id da pai).
3. **Validação antes de gravar:** aplica ao todo o gate da skill escritora
   (`schema-mapa-artefatos.md` §5). Específico do orquestrador: **`id` único em todo o
   mapa**, o `id` proposto pelo subagente é só sugestão; a unicidade global é
   garantida aqui. Falha → **para e reporta/pergunta**; nunca grava parcial nem
   renumera `id` silenciosamente.
4. **Preservação de entradas humanas:** ao recostar (ajuste ou incremental),
   **não sobrescrever** entradas com `marca_mudanca.fonte: humano` ou
   `revisao_humana.status ∈ {aprovado, ajustado}` sem confirmação, colisão →
   apresenta e pergunta (a lógica de delta/preservação é de
   `../../mapa-artefatos-base/references/fingerprint-e-delta.md`, dona em
   `de-revisar-mapa`).
5. **Status inicial:** toda entrada recém-classificada nasce
   `revisao_humana.status: pendente` e `marca_mudanca.fonte: agente`; só o humano
   (ou `de-revisar-mapa`, ao reconciliar) muda isso.

A costura **não** muda a semântica do fragmento, só o posiciona, garante
unicidade de `id` e revalida o todo. Se um fragmento não passa na validação, ele
**não entra** no mapa: o item vira pendência ao humano, não um remendo.
