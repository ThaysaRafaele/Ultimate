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

Origem: `docs/ultimate_basketball_2020.json` e `scripts/import-games-2020.mjs`.
**Importado em 2026-11-16:** 17 jogos (8 Adulto, 9 Master), 4 campeonatos novos, escalação e
boletim só dos atletas confirmados (incluindo Paulo, Lebron e Totó). Os 4 jogos do Kids e os
nomes abaixo ficaram de fora; as pendências desta seção continuam abertas. Quando o técnico
responder, os atletas entram por um script de atualização (como os rounds de 2019).

### Para informar

- [ ] **Jogos do "30+" de 2020 vão para a categoria Master** e os do "Adulto" para Adulto (P-22).
      Dois jogos da Copa América estavam com a categoria trocada na Scoutt Geral e foram
      corrigidos pelo elenco do boletim: jogo 7 (vs América, 25/10) é 30+; jogo 9 (vs América,
      07/11) é Adulto.
- [ ] **Datas:** só o amistoso de 08/02/2020 vs Neon tem data real; as outras 20 são estimadas
      (P-18). Se o técnico tiver as datas, dá para corrigir depois.
- [ ] **Vinculados por apelido** (cadastro criado depois de 2019): "Paulo" = Paulo Roberto da
      Silva, "Lebron" = Eduardo Cavalcante de Oliveira, "Totó" = Antônio Carlos de Abreu.

### Para confirmar

- [ ] **Quem é quem** (as estatísticas ficam de fora até confirmar):
  - "Gui" (Férias Cup, 3 jogos, MVP do jogo 3 com 28 pts): Guigas ou Guilherme Widal?
  - "Big" (Copa América Adulto, 5 jogos): é o Davi Budib ("Big Davi")?
  - "Jp" (Copa América Adulto, 5 jogos): é o João Grabalos?
  - "Jonatas" (Copa América Adulto, 5 jogos): é o Jhonatan de 2018/2019?
  - "Léo" (Circuito Master, 3 jogos): é o Leonardo Stival?
  - "Fabinho" (amistosos 30+, 2 jogos): é o Fabio Seixas, que hoje está no CG City/Nível 3?
  - "Rafa" (30+, 4 jogos): no amistoso de 08/02 é o Rafa Paludo; na Copa América 30+ a aba
    Scout Atletas indica Rafa Pivante. São pessoas diferentes?
  - "Rafa Doncic" (Copa América 30+, 2 jogos): atleta novo ou o Rafa Pivante?
- [ ] **Cadastrar?** Marcius (8 jogos), Negão (3 jogos; MVP de 2 jogos da Férias Cup; qual o
      nome?), Rodrigo (2 jogos 30+) e Thiago (2 jogos 30+). Sem cadastro, ficam de fora.
- [ ] **Categoria dos atletas que jogaram no 30+**: João, Chico, Paulo, Oruê, Vini e Dalton hoje
      estão só no Adulto. Incluir também no Master? Sem isso, a tela pode recusar corrigir a
      escalação/boletim desses jogos (P-06).
- [ ] **Kids** (4 jogos de 2020: Amistoso avulso vs Carneirão e Copa América vs Cemte Neon,
      North Wolf e NTB): qual categoria do sistema recebe? (P-22). Candidatos já cadastrados
      para os nomes do Kids: Segóvia (58), Bruno A. = Bruno Arias (57), Mateus = Mateus Zeni
      (62), Gustavo = Gustavo Freire (61), Luiz = Luiz Santos (74); Jonas, Dílan e Bruno sem
      cadastro.
- [ ] **Placar com 1 ponto de diferença** entre a Scoutt Geral e o boletim do adversário:
      Férias Cup jogo 2 vs Funlec (62 × 63), Copa América jogo 6 vs North Wolf (41 × 40, Kids)
      e jogo 7 vs América (48 × 49). O script grava o placar da Scoutt Geral, mas a ADR-0011
      diz que vale a soma do boletim. Qual vale?
- [ ] **Circuito Master jogo 3 vs Neon (07/03)**: os quartos da planilha somam 49 × 49, mas o
      placar final é 66 × 58. O técnico tem os quartos certos?
- [ ] **Cadastros duplicados**: Guigas (52 inativo e 53 ativo) e Renan Anacleto (38 inativo e
      44 ativo). Mesclar?
