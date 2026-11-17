# Recados para o técnico

Lista do que precisa ser **informado** ou **confirmado** com o técnico. Ao resolver, marque
o item e registre a resposta no `CONTEXT.md` (pendência correspondente) ou numa ADR.

## Para informar

- [ ] **Jogos do Sub 25 entram na categoria Adulto** (decisão de 2026-10-05). O Sub 25 não
      vira categoria no sistema. (P-22)
- [ ] **EFF do sistema desconta as faltas** (ADR-0006). Na planilha de 2018, a coluna EFF não
      desconta as faltas em 74 de 130 linhas, então a EFF anual no sistema fica menor que a da
      planilha (ex.: Ibra 101 no sistema × 116 na planilha; a diferença é o total de faltas).
- [ ] **"Rafa" e "Rafa Pivo" somados** como o mesmo atleta em 2018 (confirmado antes): no
      sistema Rafa tem 68 pontos; o TOTAL ANO da planilha mostra 66 porque não soma o "Rafa Pivo".

## Para confirmar

- [ ] **Métricas extras no resumo anual:** duplo-duplo, triplo-duplo, jogos com 20+/25+
      pontos, 10+/15+/20+ rebotes, 10+ assistências, EFF 20+ e colocação no campeonato.
      Ficaram fora por enquanto. (P-21)
- [ ] **Categoria dos elencos que faltam:** Ultimasters (sugestão: Master), Kids e Ufms
      (sem categoria equivalente hoje). (P-22)

## Importação 2020

Origem: `docs/ultimate_basketball_2020.json`, `scripts/import-games-2020.mjs` (importado em
2026-11-16: 17 jogos, 8 Adulto e 9 Master) e `scripts/update-games-2020-round2.mjs` (respostas
do técnico de 2026-11-17; ⚠ dry-run feito, `--apply` aguardando o backup do banco).

### Para informar

- [ ] Jogos do "30+" de 2020 estão na categoria Master e os do "Adulto" no Adulto (P-22). Na
      Copa América, os jogos 7 (30+) e 9 (Adulto) estavam com a categoria trocada na Scoutt Geral
      e foram corrigidos pelo elenco do boletim.
- [ ] Vinculados por apelido (cadastro único): "Paulo" = Paulo Roberto da Silva, "Lebron" =
      Eduardo Cavalcante de Oliveira, "Totó" = Antônio Carlos de Abreu.

### Resolvido (técnico, 2026-11-17)

- [x] **Quem é quem:** Jp = João Grabalos; Big = Davi Budib; Jonatas = Jhonatan; Gui (Férias
      Cup) = Guigas; Léo (Circuito Master) = Leonardo Stival; Rafa e Rafa Doncic = Rafa Paludo
      (na Copa América jogo 7 os dois aparecem e o boletim é somado); Negão = Claudinei.
- [x] **Não precisa vincular:** Fabinho (é outro Fabinho, não o Fabio Seixas), Rodrigo, e no
      Kids Jonas e Dílan.
- [x] **Thiago (30+)** = Thiago Segóvia (58). ⚠ O cadastro do 58 é de 26/01/1998 (22 anos em
      2020) e ele jogou no 30+: confirmar antes do `--apply`.
- [x] **Categorias:** João, Chico, Paulo, Oruê, Vini e Dalton passam a ter também Master.
- [x] **Kids = antigo blazers:** os 4 jogos do Kids entram em `blazers`. Nomes confirmados:
      Segóvia, Bruno Arias ("Bruno" e "Bruno A." são o mesmo), Mateus Zeni, Gustavo Freire e
      Luiz Santos. Jhone, Mateus, Gustavo e Luiz passam a ter também Blazers.
- [x] **Placar:** vale a Scoutt Geral (Funlec 62, North Wolf 41, América 48). Para os dados
      históricos, a diferença de 1 ponto no boletim do adversário fica como está.
- [x] **Circuito Master jogo 3 vs Neon:** teve prorrogação. Quartos 14 × 12, 14 × 19, 12 × 7,
      9 × 11 e prorrogação 17 × 9 (66 × 58).
- [x] **Datas:** seguem fictícias, reposicionadas: Férias Cup em março, Circuito Master em
      junho, Copa América a partir de setembro (os 4 últimos jogos caem no início de outubro
      para manter o intervalo semanal). Só o amistoso de 08/02 tem data real.
- [x] **Cadastros duplicados:** mesclar Guigas (52 → 53) e Renan Anacleto (38 → 44), mantendo o
      ativo.

### Pendente

- [ ] **Marcius** (8 jogos no Adulto): aguardando nome completo e data de nascimento para o
      cadastro. Depois, vincular por um round 3.
- [ ] **Rafa Paludo (26) e Thiago Segóvia (58)** jogaram no 30+, mas não estão no Master.
      Incluir? Sem isso, a tela pode recusar corrigir esses jogos (P-06).
- [ ] **Mescla:** o cadastro que fica perde dados do inativo. Guigas fica sem CG City, com
      entrada 05/05/2019 (o 52 tinha 05/03/2019) e camisa 31 (o 52 tinha 34). Renan fica com
      entrada 01/01/2019, mas tem jogos de 2018 (o 38 tinha 01/01/2018). Ajustar algo?
