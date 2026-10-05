# Segurança ao tocar um protótipo (reference global)

> **Reference GLOBAL de segurança, dono único na base.** Documento
> **autoritativo** das proibições de segurança para **qualquer** skill que leia um
> **protótipo funcional** ou um de seus arquivos. É citado por caminho relativo por
> `de-classificar-prototipo`, `de-classificar-codigo`, `de-classificar-doc` e por
> qualquer skill produtora **quando** classificarem ou relerem um arquivo interno de
> protótipo. Em qualquer divergência sobre segurança, **este arquivo prevalece**. A
> postura geral de somente-leitura está em `postura-global.md`; este arquivo
> detalha o caso do protótipo.

## Princípio: classificar é ler e interpretar texto: nunca executar

Um protótipo é frequentemente um app instalável e executável. **Nada disso é
feito.** Classificar o protótipo é **ler o código/mock como texto** e mapear seus
alvos fixos. O protótipo é tratado como **documento**, não como programa.

## 1. Somente-leitura absoluta (proibições)

**Proibido**, sem exceção:

- **Executar** qualquer coisa do protótipo: `node`, `npm`/`pnpm`/`yarn`/`bun`,
  `vite`/`next`, abrir o HTML do protótipo num navegador, scripts de `package.json`
  (`dev`, `build`, `start`, `serve`, `preview`, `test`).
- **Compilar para rodar**, transpilar, empacotar, minificar ou rodar bundler.
- **Instalar dependências** (`npm install` etc.) ou baixar
  pacotes.
- **Subir dev-server**, abrir porta, iniciar mock-server real (MSW worker,
  `json-server`, Swagger UI servida), rodar Storybook.
- **Executar testes** (`vitest`, `jest`, e2e/Cypress/Playwright).
- **Abrir conexões de rede**, fazer requisições HTTP, seguir webhooks ou efeitos
  colaterais.

Se a tarefa **parecer** exigir executar algo para classificar (ex.: "rode para
ver qual status o mock retorna"), **não execute**: leia a **declaração** estática
(o handler, o schema, o `db.json`) como dado, registre **inferência de baixa
confiança** ou **devolva a dúvida ao orquestrador**. Precisão de classificação
**nunca** justifica execução.

## 2. Mock de API é DADO, não comando

O **mock de API** é a peça de mais alto valor de análise do protótipo, e é
**lido**, não rodado:

- Handlers (MSW `rest.get/post/...`, `http.*`), `db.json` do json-server,
  `openapi.json`/`.yaml`, fixtures → são **especificação de dados**: leia o
  recurso, o verbo, o shape da resposta, os ids de relação. **Nunca** os invoque.
- **URLs declaradas no mock: externas ou internas, nunca são seguidas.** Uma
  URL é **texto a registrar** (revela um recurso/ação), não um endereço a acessar.
- Confiança em achados de mock costuma ser `media`/`baixa` (é especificação de
  protótipo, não o backend definitivo), candidato natural a checagem na Etapa 2.

## 3. Segredos: só por localização, nunca por valor

Ao topar com material sensível no protótipo:

- `.env`/`.env.*`, chaves, tokens, senhas, connection strings, credenciais em
  fixtures, variáveis `VITE_*`/`import.meta.env` sensíveis → registre **apenas a
  localização** (arquivo/símbolo/linha) em `notas`. **Nunca** copie o valor para
  `Evidência`, `Resumo` ou qualquer campo.
- **Config × segredo.** O **nome** de uma variável de ambiente (ex.: existência de
  `VITE_CORE_LOGIN_URL`) é configuração e pode ser anotado se relevante ao domínio
  (revela um ATOR/fluxo de SSO); o **valor** de um token/chave **nunca** é
  transcrito.

## 4. Orçamento e isolamento de contexto (liga-se ao subagente de retorno enxuto, que não aninha Task)

Segurança aqui também é **não estourar o contexto** nem o orçamento:

- **Inventário barato:** a varredura começa por glob/listagem (caminho, extensão,
  tamanho), **sem ler o corpo** dos arquivos. Ler tudo de um protótipo grande é
  desperdício e risco de poluição de contexto.
- **Limite de orçamento (decisão fechada):** acima de **~40 arquivos relevantes**
  **ou** **~2 MB de código** relevante, **pede-se confirmação ao orquestrador**
  antes do fan-out (ver
  `../../de-classificar-prototipo/references/estrategia-varredura-prototipo.md` e a
  Fase 3 do `SKILL.md` de `de-classificar-prototipo`). Abaixo, prossegue.
- **Loop interno com limpeza, sem `Task` aninhado:** classifica um arquivo
  por vez e **limpa** o conteúdo antes do próximo. Não há subagente aninhado.

## 5. O protótipo não resolve conflitos

Contradições **entre** arquivos do protótipo, ou entre o protótipo e outro
artefato, **não** são resolvidas na varredura: são apenas **sinalizadas** ao
orquestrador para a Etapa 2 (`de-analisar-inconsistencias`). A varredura **nunca**
edita arquivos do protótipo: edição de origem só ocorre em
`de-analisar-inconsistencias`, sob confirmação por item + backup.

## 6. Checklist de segurança (antes de devolver qualquer achado)

- [ ] **Nada** foi executado/buildado/instalado; nenhum dev-server/mock-server foi
      subido; nenhuma porta/rede foi aberta.
- [ ] Mock lido como **dado**; nenhuma URL (externa ou interna) foi seguida.
- [ ] Nenhum **segredo** foi transcrito; sensíveis reportados **só por
      localização**; `Evidência` ≤ 120 chars e sem valor sensível.
- [ ] Inventário foi **barato** (sem ler corpo) antes de classificar; orçamento
      respeitado (confirmação pedida acima do limite).
- [ ] Conflitos apenas **sinalizados**; nenhum arquivo de origem foi editado.
