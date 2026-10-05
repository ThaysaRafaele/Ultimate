# Critérios de prontidão, rubrica de modelagem de estado e schema do inventário

> **Reference da skill `de-revisar-entidades-regras` (gate de prontidão do MER).**
> Define três coisas: (1) os **critérios de prontidão** por ENT/ATR/REL/FLX/RN que
> liberam (ou travam) a produção; (2) a **rubrica** da decisão canônica
> **status-como-atributo vs sub-entidade de histórico**; (3) o **template/schema** do
> artefato de saída `<RAIZ_DESIGN>/_revisao/inventario-de-entidades.md`, **fronteira
> versionada** (`schema_version`), consumida por `de-produzir-mer`/`de-produzir-entidade`.
> Taxonomia, gramática de âncoras e regra de `schema_version` vêm de
> `../../mapa-artefatos-base/references/taxonomia-alvos-fixos.md` e
> `../../mapa-artefatos-base/references/schema-mapa-artefatos.md` (não redefinidas aqui).
>
> **Princípio: nada entra como fato sem origem.** Todo item consolidado tem **≥ 1 origem
> rastreável** (`fonte + localização` reusada do mapa); item sem origem é **lacuna**, não
> fato. Definição dada pelo humano ao preencher uma lacuna vira origem `humano` (zero
> presunção, a skill nunca inventa).

---

## 1. Critérios de prontidão

A prontidão é avaliada **por entrada**. Cada critério não atendido vira uma
**lacuna**, classificada como **bloqueante** (impede um MER/descrição coerente,
trava a produção até o humano resolver) ou **não-bloqueante** (anotação que o
design pode carregar). A régua é: *o MER/entidade/relação sairia errado ou vazio se
isto não estivesse resolvido?*, se sim, **bloqueante**.

### 1.1 Entidade (ENT)

| Critério                                                            | Falta → lacuna |
|---------------------------------------------------------------------|----------------|
| **Identidade clara**: nome + papel no domínio (o que é no contexto).| **bloqueante** |
| **≥ 1 atributo com origem** (a entidade tem ao menos um campo rastreável). | **bloqueante** |
| **Estados definidos**, *se* a entidade tem ciclo de estados (conjunto de estados conhecido). | **bloqueante** se há EST sem conjunto fechado; senão n/a |
| **Faceta de ator resolvida** quando o conceito coincide com ATOR (papel registrado). | não-bloqueante |
| **Descrição curta** do papel no domínio.                            | não-bloqueante |

### 1.2 Atributo (ATR)

| Critério                                              | Falta → lacuna |
|-------------------------------------------------------|----------------|
| **Nome + entidade dona** identificados.               | **bloqueante** |
| **Origem rastreável** (`fonte + localização`).        | **bloqueante** |
| **Tipo** evidenciado.                                 | não-bloqueante (anota `tipo: null`) |
| **Obrigatoriedade** evidenciada.                      | não-bloqueante (anota `obrigatorio: null`) |

### 1.3 Relação (REL)

| Critério                                                          | Falta → lacuna |
|-------------------------------------------------------------------|----------------|
| **As duas entidades existem** no inventário.                      | **bloqueante** |
| **Cardinalidade conhecida** (`1:1` / `1:N` / `N:M`).              | **bloqueante** |
| **Semântica mínima** (o significado da ligação no domínio).       | não-bloqueante |
| **Atributos de ligação** identificados (quando N:M / associativa).| não-bloqueante |

> A **direcionalidade do fluxo de informação** **não** é critério de prontidão
> aqui, ela é decidida por `de-produzir-relacionamento`. O inventário fixa
> apenas **entidades + cardinalidade + semântica**.

### 1.4 Fluxo / caso de uso (FLX)

| Critério                                                          | Falta → lacuna |
|-------------------------------------------------------------------|----------------|
| **Objetivo** do caso de uso.                                      | **bloqueante** |
| **≥ 1 ator** e **≥ 1 entidade envolvida**, com origem.            | **bloqueante** |
| **Sequência mínima de ações** (ACT/EST) com origem.               | **bloqueante** |
| **Pré/pós-condições**.                                            | não-bloqueante |

### 1.5 Regra de negócio (RN)

| Critério                                                          | Falta → lacuna |
|-------------------------------------------------------------------|----------------|
| **Vinculada** a ≥ 1 entidade/relação/fluxo existente (`aplica_a`).| **bloqueante** |
| **Enunciado curto** e **origem rastreável**.                      | **bloqueante** |

RN é **cidadã de primeira classe**: toda RN do mapa é consolidada e **ligada** ao
que condiciona. RN sem alvo de vínculo evidente vira a lacuna bloqueante "a que
entidade/relação/fluxo esta regra se aplica?", **nunca** é descartada.

### 1.6 Resultado da avaliação

- **Lacuna bloqueante** → devolvida **agrupada** ao orquestrador (Fase 3 da skill);
  o inventário **não** é persistido enquanto houver bloqueante aberta. Resolvida
  pelo humano (preenchimento) ou **explicitamente aceita** por ele (vira
  `lacuna-aceita`, não trava mais).
- **Lacuna não-bloqueante** → **anotada** na entrada (`prontidao.lacunas[]`); o
  design segue, ciente da anotação.

---

## 2. Rubrica: status-como-atributo vs sub-entidade de histórico

Decisão **canônica e congelada AQUI**; `de-produzir-entidade` **apenas consome**.
Para cada entidade **com estados (EST)**, escolha **um**:

### 2.1 As três opções

| Opção                      | Quando indicar                                                                 | Efeito no design |
|----------------------------|--------------------------------------------------------------------------------|------------------|
| **`atributo-status`**      | Interessa **apenas o estado atual**; **sem** requisito de histórico/auditoria das transições. | Campo `status`/`situacao` na própria entidade. |
| **`sub-entidade-historico`** | Há **requisito explícito de histórico / trilha de auditoria**, **atributos por transição** (data, autor, justificativa) ou **reabertura/ciclos** que exigem rastro. | Entidade intermediária registra cada transição (de→para, quem, quando). |
| **`sem-estado`**           | A entidade **não** tem ciclo de estados relevante.                             | Registra-se explicitamente que **não** há decisão de status a tomar. |

### 2.2 Sinais de decisão (ancorar a justificativa)

- **Aponta para `sub-entidade-historico`:** RN ou requisito que cita "histórico",
  "auditoria", "log de mudanças", "quem aprovou e quando", "rastreabilidade das
  transições"; atributos que pertencem à **transição** e não ao estado atual;
  necessidade de **reabrir** algo finalizado mantendo o rastro.
- **Aponta para `atributo-status`:** apenas um conjunto de estados e o **estado
  corrente** importa; nenhuma exigência de histórico; transições simples sem dados
  próprios.
- **Ambíguo (decisão humana obrigatória):** sinais **conflitantes** (ex.: o
  protótipo mostra só um campo `status`, mas uma RN exige histórico de aprovações)
  → **não** congelar pela skill; **devolver ao orquestrador** (Fase 4 da skill).

### 2.3 Como registrar a decisão (congelamento)

Toda entidade com estados grava o bloco `modelagem_estado` (§3.2) com: `decisao`,
`justificativa` (não-vazia, ancorada nos sinais acima), `origem` (achados EST/RN
que embasam), `decidido_por` (`humano` quando o humano decidiu/ajustou; `agente`
quando uma **proposta clara** foi apenas confirmada na validação) e, **se**
`sub-entidade-historico`, o `sub_entidade` (nome/slug da entidade de histórico que
o MER deverá conter). Sem este bloco, a entidade com estados está **incompleta** →
não persiste (§3.6, regra 3).

---

## 3. Template/schema do inventário (`inventario-de-entidades.md`)

Artefato de **fronteira versionado**: `schema_version` inicial = `1`. Persiste
em `<RAIZ_DESIGN>/_revisao/inventario-de-entidades.md`. Estrutura: **manifesto
global** + (opcional) **seção de regras de negócio** + **uma seção por entidade** +
**uma por relação** + **uma por fluxo**. Os blocos YAML são o **contrato** (é o que
`de-produzir-mer`/`de-produzir-entidade` leem); prosa humana entre seções é
permitida.

### 3.1 Manifesto global (bloco YAML no topo)

```yaml
schema_version: 1                 # obrigatório. inteiro. contrato do inventário
gerado_em: 2026-06-16T14:00:00Z   # obrigatório. ISO-8601 UTC
mapa_fonte: docs/entities/_map/mapa-artefatos.md             # obrigatório. mapa consolidado
relatorio_fonte: docs/entities/_revisao/relatorio-de-inconsistencias.md  # obrigatório. relatório decidido da Etapa 2
total_entidades: 2                # obrigatório. inteiro >= 1. == nº de seções de entidade
total_relacoes: 1                 # obrigatório. inteiro >= 0. == nº de seções de relação
total_fluxos: 1                   # obrigatório. inteiro >= 0. == nº de seções de fluxo
total_regras_negocio: 3           # obrigatório. inteiro >= 0. == nº de RN na seção de regras
pronto_para_mer: true             # obrigatório. bool. false se há lacuna bloqueante aberta (não persiste como final)
lacunas_aceitas: 0                # obrigatório. inteiro >= 0. nº de lacunas que o humano aceitou deixar em aberto
```

### 3.2 Seção de entidade (heading + bloco YAML)

```
## entidade-pedido: Pedido
```

```yaml
entidade:
  id: pedido                      # obrigatório. slug(nome): minúsculo, sem acento, kebab-case, singular
  nome: Pedido                    # obrigatório. nome legível
  papel_dominio: "Pedido de compra de um cliente"  # obrigatório. o que é no contexto
  e_ator: false                   # obrigatório. bool. true quando o conceito também é ATOR (ENT×ATOR)
  papel_ator: null                # obrigatório se e_ator. perfil/papel do ator
  origem:                         # obrigatório. >= 1. rastreio fonte->entidade
    - { fonte: requisitos/pedidos.md, localizacao: sec:entidades }
    - { fonte: prototipo/, localizacao: "sym:lib/schema.ts#class:pedidos" }
  atributos:                      # lista (pode ser vazia? não, >=1 com origem é prontidão §1.1)
    - nome: total
      tipo: decimal               # tipo evidenciado, ou null (lacuna não-bloqueante)
      obrigatorio: true           # true | false | null
      origem: { fonte: "prototipo/", localizacao: "sym:lib/schema.ts#class:pedidos" }
      rn: [rn-desconto-maximo]    # ids de RN que condicionam o campo (da seção §3.5)
  estados:                        # presente SÓ se a entidade tem EST
    valores: [rascunho, enviado, aprovado]
    transicoes:
      - de: rascunho
        para: enviado
        gatilho: enviar           # ACT que dispara (quando evidenciado)
        rn: [rn-aprovacao-gestor]
        origem: { fonte: "historias/checkout.md", localizacao: sec:estados }
  modelagem_estado:               # OBRIGATÓRIO quando há `estados`, decisão CONGELADA
    decisao: atributo-status      # enum: atributo-status | sub-entidade-historico | sem-estado
    justificativa: "Só o estado atual importa; nenhuma RN exige histórico de transições."
    sub_entidade: null            # obrigatório se decisao == sub-entidade-historico (slug da entidade de histórico)
    origem: { fonte: "historias/checkout.md", localizacao: sec:estados }
    decidido_por: humano          # enum: humano | agente
    data: 2026-06-16T13:40:00Z    # ISO-8601
  acoes:                          # ACT da entidade (muda_estado: true => também é EST)
    - nome: aprovar
      ator: gestor
      muda_estado: true
      origem: { fonte: "requisitos/pedidos.md", localizacao: sec:acoes }
  rn: [rn-desconto-maximo, rn-aprovacao-gestor]  # ids de RN aplicáveis à entidade (back-link)
  prontidao:
    status: pronto                # enum: pronto | lacuna-aceita
    lacunas: []                   # lacunas NÃO-bloqueantes anotadas (bloqueantes não chegam ao final)
```

### 3.3 Seção de relação (heading + bloco YAML)

```
## relacao-cliente_pedido: Cliente ↔ Pedido
```

```yaml
relacao:
  id: cliente_pedido              # obrigatório. slugs existentes em ORDEM ALFABÉTICA unidos por `_`
  entidades: [cliente, pedido]    # obrigatório. slugs existentes, alfabéticos: exatamente 2 quando binária; >= 3 quando n_aria: true
  cardinalidade: 1:N              # obrigatório p/ binária. enum: 1:1 | 1:N | N:M | null (null quando n_aria: true, cardinalidade binária não se aplica)
  semantica: "um pedido pertence a um cliente"  # recomendado
  atributos_ligacao: []           # campos da relação (relevante p/ N:M associativa)
  n_aria: false                   # true (aridade > 2) => entidades com >= 3 slugs + cardinalidade null + nota "resolver como associativa + binárias na produção"
  rn: []                          # ids de RN aplicáveis à relação
  origem:                         # obrigatório. >= 1
    - { fonte: "prototipo/", localizacao: "sym:lib/schema.ts#class:pedidos" }
  prontidao:
    status: pronto                # pronto | lacuna-aceita
    lacunas: []
```

> **Sem direcionalidade aqui.** O inventário **não** grava direcionalidade do
> fluxo de informação, `de-produzir-relacionamento` a decide. Relação **N-ária**
> (aridade > 2) é registrada com `n_aria: true` e a nota de tradução; a produção a
> converte em **entidade associativa + relações binárias** (`relations/` permanece
> sempre binário, par alfabético).

### 3.4 Seção de fluxo (heading + bloco YAML)

```
## fluxo-checkout: Checkout
```

```yaml
fluxo:
  id: checkout                    # obrigatório. slug(nome_do_caso_de_uso)
  nome: Checkout                  # obrigatório
  objetivo: "Cliente finaliza um pedido"  # obrigatório
  atores: [cliente, gestor]       # obrigatório. >= 1 (atores resolvidos: entidade com e_ator:true ou papel de ator declarado)
  entidades_envolvidas: [pedido, cliente]  # obrigatório. >= 1 (slugs de entidade existentes)
  passos:                         # obrigatório. >= 1
    - ordem: 1
      acao: criar pedido
      entidade: pedido
      muda_estado: true           # EST
      origem: { fonte: "historias/checkout.md", localizacao: sec:fluxo }
  rn: [rn-aprovacao-gestor]       # ids de RN aplicáveis ao fluxo
  origem:                         # obrigatório. >= 1
    - { fonte: "historias/checkout.md", localizacao: sec:fluxo }
  prontidao:
    status: pronto
    lacunas: []
```

### 3.5 Seção de regras de negócio (consolidação + back-link)

RN são **consolidadas uma única vez** aqui (definição) e **referenciadas por id**
nas entradas (vínculo). Heading fixo, seguido de um bloco YAML com a lista:

```
## regras-de-negocio
```

```yaml
regras_negocio:
  - id: rn-desconto-maximo        # obrigatório. slug estável, único [a-z0-9-]+
    enunciado: "Desconto máximo de 10% para pedidos acima de R$ 500."  # obrigatório. texto curto
    aplica_a: [pedido]            # obrigatório. >= 1. ids de entidade/relação/fluxo existentes
    origem: { fonte: "requisitos/pedidos.md", localizacao: sec:regras }  # obrigatório
  - id: rn-aprovacao-gestor
    enunciado: "Aprovação de pedido só pelo gestor."
    aplica_a: [pedido, checkout]
    origem: { fonte: "requisitos/pedidos.md", localizacao: sec:regras }
```

`aplica_a` é o vínculo **RN→alvo** (consolidação→destino); o campo `rn: [...]` de
cada entidade/relação/fluxo é o vínculo **alvo→RN** (back-link). Os dois lados
**devem ser coerentes** (§3.6, regra 6).

### 3.6 Regras de validação do inventário (gate da skill escritora)

Toda gravação revalida; falha em qualquer item → **para e reporta** (zero
presunção), nunca grava parcial nem "conserta" silenciosamente:

1. **Versão.** `schema_version` presente e compatível; incompatível → encerra.
2. **Rastreio (origem em todo item).** Toda entidade, atributo, ação, estado,
   relação, fluxo e RN tem **≥ 1 origem** (`fonte + localização`). A origem pode ser
   `humano` quando o item foi definido pelo humano ao preencher uma lacuna. Item sem
   origem → rejeita.
3. **Decisão de estado congelada.** Toda entidade com bloco `estados` tem
   `modelagem_estado` com `decisao ∈ {atributo-status, sub-entidade-historico,
   sem-estado}`, `justificativa` não-vazia e `decidido_por ∈ {humano, agente}`;
   `sub-entidade-historico` exige `sub_entidade` preenchido. Faltando → rejeita.
4. **Cardinalidade e participantes da relação.** Relação **binária** (`n_aria:
   false`) tem `cardinalidade ∈ {1:1, 1:N, N:M}` e `entidades` = **exatamente 2**
   slugs; ausência de cardinalidade só é tolerada como **lacuna aceita**
   (`prontidao.status: lacuna-aceita` com a lacuna anotada). Relação **N-ária**
   (`n_aria: true`, aridade > 2) tem `entidades` com **≥ 3** slugs e
   `cardinalidade: null` (a cardinalidade binária não se aplica, a tradução em
   entidade associativa + binárias é da produção). Em **ambos** os casos,
   todos os slugs de `entidades` são **existentes**, em **ordem alfabética**, e
   `id` == `entidades` unidos por `_`.
5. **Slug e nomes.** `id` de entidade/fluxo == `slug(nome)`; `id` de relação
   == slugs (alfabéticos) unidos por `_`. Slug duplicado entre entidades → rejeita.
6. **Coerência RN↔alvo.** Todo id em `rn: [...]` de uma entrada existe na seção
   `regras_negocio`; todo `aplica_a` de uma RN referencia entrada existente; os dois
   vínculos são **mútuos** (se a RN aplica-se a `pedido`, `pedido.rn` cita a RN).
7. **Integridade referencial de fluxo.** Todo slug em `fluxo.entidades_envolvidas`
   e `fluxo.passos[].entidade` corresponde a uma **seção de entidade existente**;
   todo ator em `fluxo.atores` e `acoes[].ator` **resolve** (uma entidade com
   `e_ator: true` ou um papel de ator declarado/rastreável). Referência pendurada →
   rejeita (zero presunção), como nas regras 4 e 6.
8. **Contadores.** `total_entidades`/`total_relacoes`/`total_fluxos`/
   `total_regras_negocio` iguais aos nºs de seções/itens correspondentes.
9. **Sem lacuna bloqueante.** Nenhuma entrada com lacuna **bloqueante** em aberto;
   `prontidao.status ∈ {pronto, lacuna-aceita}` em todas; `pronto_para_mer: true`.
10. **Evidência/origem segura.** Trechos citáveis ≤ 120 chars e **sem segredo**
   (`.env`, token, chave), segredo só por **localização**.
