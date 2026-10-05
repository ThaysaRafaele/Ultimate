# Protocolo de edição segura de artefatos de origem

> **Reference da skill `de-analisar-inconsistencias` (Fase 5).** Define a **operação
> mais perigosa do fluxo**: **editar um artefato de origem** para harmonizar requisitos
> divergentes. `de-analisar-inconsistencias` é a **única** skill autorizada (toda outra
> é somente-leitura; `de-reexecutar-incremental` **delega** a harmonização a ela). Por
> isso o protocolo é rígido, **confirmação por item + backup `.bak` + log + alteração
> in-loco + proibição de edição em lote**: e **prevalece** em qualquer divergência
> sobre como editar fonte. A postura somente-leitura geral
> (`../../mapa-artefatos-base/references/seguranca-prototipo.md`) **continua valendo**;
> este protocolo é a **única** abertura para escrita em fonte, só sob as condições abaixo.

## Princípio: editar fonte é exceção confirmada, item a item: nunca o caminho fácil

Harmonizar editando a origem **conserta o requisito divergente** para que todos os
artefatos fiquem coerentes. Mas é irreversível na prática (a fonte é o insumo do
projeto), então **só** acontece quando o **humano define a verdade canônica** e
**autoriza explicitamente** alterar **aquele item**. A alternativa padrão e segura é
**não editar**: registrar a definição humana como verdade para a Etapa 3
(**"seguir-com-definição"**) e deixar a fonte intacta.

## 1. Pré-condições (todas obrigatórias antes de qualquer escrita)

Para **cada conflito**, só edite a fonte se **todas** forem verdadeiras:

1. **Definição humana existe.** O humano (via orquestrador) deu a **definição final**
   do item, qual lado prevalece / qual é o valor/estado/cardinalidade canônico.
2. **Autorização explícita de harmonizar, por item.** O humano autorizou **editar a
   fonte** daquele conflito específico. Autorização genérica ("pode arrumar tudo")
   **não** vale: **uma confirmação = um item** (§4).
3. **Alvo de edição inequívoco.** O conflito aponta **qual arquivo** e **qual trecho**
   (localização relativa do mapa) editar, e **qual** é o conteúdo final. Se algo
   disso for ambíguo → **não edita**; devolve a dúvida ao orquestrador.

Faltando qualquer pré-condição → `acao: seguir-com-definicao` (fonte intacta) **ou**
dúvida ao orquestrador. **Nunca** editar "preenchendo a lacuna por conta própria".

## 2. Passos da edição (na ordem, por item)

Quando as pré-condições (§1) estão satisfeitas:

1. **Backup `.bak` ANTES de tudo.** Crie `<arquivo>.bak` com o **conteúdo atual
   íntegro** da fonte, **antes** de qualquer escrita. Se já existir um `.bak` de uma
   harmonização anterior, **não o sobrescreva** sem versionar (ex.: `<arquivo>.bak.2`),
  o `.bak` original é o ponto de restauração. Backup não criado → **aborta a
   edição** deste item.
2. **Edição in-loco, só do trecho divergente.** Altere **apenas** o trecho apontado
   pela **localização relativa** (a seção, a função/classe/rota), aplicando a
   **definição final** do humano. **Proibido** reescrever o arquivo inteiro,
   reformatar, reordenar seções ou "melhorar" outros trechos: a edição é **cirúrgica**
   e mínima.
3. **Preserve o resto.** Tudo fora do trecho divergente fica **byte-a-byte** como
   estava. Não toque em formatação, comentários ou conteúdo não relacionado.
4. **Sem efeitos colaterais.** Editar é alterar **texto**; **nunca** executar a fonte,
   rodar formatador/linter, subir server ou seguir URLs do mock.
5. **Log imediato** (§3) após gravar o trecho.

## 3. Log de harmonização (`harmonizacao.log.md`)

Toda edição de fonte é registrada em
`<RAIZ_DESIGN>/_revisao/harmonizacao.log.md` (artefato de **processo**, sob
`RAIZ_DESIGN`). Uma entrada por edição, **append-only** (nunca reescreve entradas
anteriores). Campos por entrada:

```markdown
## <timestamp ISO-8601>: <id-do-conflito>

- **conflito:** conflito-01 (divergencia-cardinalidade, severidade alta)
- **arquivo:** prototipo/models/cliente.js
- **localizacao:** sym:models/cliente.js#class:Cliente
- **backup:** prototipo/models/cliente.js.bak
- **autorizado_por:** <identificador do humano, repassado pelo orquestrador>
- **definicao_humana:** "cardinalidade canônica = 1:N (cliente tem vários endereços)"
- **antes:**
  ```
  endereco: Endereco   // 1:1
  ```
- **depois:**
  ```
  enderecos: Endereco[]   // 1:N (harmonizado)
  ```
- **justificativa:** harmoniza com requisitos/pedidos.md sec:enderecos, conforme definição humana
```

- O **diff** (`antes`/`depois`) é **curto**: só o trecho alterado, **sem segredo**
  (se o trecho contiver material sensível, registre só a localização, não o valor).
- O log é o **rastro de auditoria**: permite reverter (via `.bak`) e explicar cada
  alteração de origem.

## 4. Proibição de edição em lote

**Uma confirmação humana = um item editado** (§1.2): não agrupe edições de vários
conflitos sob uma única confirmação, nem "para ganhar tempo", nem porque "são
parecidos". Decorrências:

- **Um `.bak` e uma entrada de log por arquivo editado.** Se um mesmo arquivo é
  tocado por dois conflitos distintos (autorizados separadamente), cada edição tem
  sua entrada de log; o **primeiro** `.bak` preserva o estado original (os seguintes
  são versionados, §2.1).
- **Sem varredura-e-conserta automática.** A skill **não** sai "corrigindo tudo que
  parece divergente"; só toca o que o humano autorizou, item a item.

## 5. "Seguir-com-definição" (o caminho padrão, sem edição)

Quando o humano **define** a verdade canônica mas **não autoriza** (ou não é
necessário) editar a fonte:

- Registre no item do relatório `acao: seguir-com-definicao` e a `decisao` (a
  definição final).
- A **fonte fica intacta** (sem `.bak`, sem log de edição).
- A **definição humana** vira a verdade que a **Etapa 3** consome (o MER/entidades
  seguem a definição, não o lado divergente da fonte). É responsabilidade do relatório
  carregar essa decisão para frente.

Este é o **default seguro**: harmonizar editando é a exceção; seguir-com-definição é
a regra quando há dúvida sobre mexer na origem.

## 6. Pós-edição: o mapa fica desatualizado

Editar uma fonte **muda seu fingerprint** (sha256 do conteúdo), logo, a entrada do
mapa daquela fonte fica **desatualizada**. A skill:

- **Reporta** ao orquestrador a lista de **fontes editadas** (com seus `.bak`),
  recomendando rodar **`/de-revisar-mapa`** no escopo afetado para reconciliar o mapa.
- **Não** recomputa fingerprint nem corrige o mapa por conta própria: o **delta de
  fontes** é dono exclusivo de `de-revisar-mapa`, e o fan-out volta ao
  orquestrador.
