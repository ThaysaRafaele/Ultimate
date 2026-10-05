# 0011. Visão geral: escopo e regras de contagem do resumo anual

- Status: aceita (mapeamento de elencos e métricas extras ⚠ em aberto: P-21, P-22, P-23)
- Data: 2026-10-05
- Fontes: pedido do técnico (2026-10-05), `docs/analise-planilha.md`, abas "Scoutt Geral" e "Scout Atletas"

## Contexto
O técnico quer na aba Visão geral o resumo anual que hoje faz na planilha (por categoria e
por jogador), um resumo de todos os anos, o histórico de jogos do ano e exportação para Excel.
A planilha tem placares divergentes, jogos sem data e jogos entre elencos do próprio clube.

## Decisão
- **Placar oficial = soma do boletim** (pontos dos atletas de cada lado) quando o jogo tem
  boletim; sem boletim, vale o placar final da "Scoutt Geral". Vale para nós e para o adversário.
- **Adversário: só placar** (final e por quarto). Estatísticas do adversário não entram.
- **Placar por quarto** entra, junto com o placar final.
- **Datas ausentes** recebem data fictícia, como já foi feito nos jogos de 2019 (ADR-0008).
- **Jogo interno** (entre dois elencos do clube, ex.: Blazers × Ultimate Adulto): na contagem
  **por categoria**, vitória para quem venceu e derrota para quem perdeu; no **total do clube**,
  conta **uma vitória** (o clube sempre vence). Empate interno: empate para as duas categorias
  e um empate no total do clube.
- **Empate** é um resultado válido na contagem (existe na planilha em 2019, 2024 e 2025).
- **Fora por enquanto:** feminino (não há atletas cadastradas), 2026 (técnico ainda não lançou
  dados) e as métricas extras da planilha (D.D, T.D, P+20, P+25, R+10, R+15, R+20, A+10,
  Eff+20, colocação). Ver P-21.

## Consequências
- Os 3 jogos de 2018 gravados com o placar final da planilha (Funlec, Neon, Coxim) devem ter
  o placar corrigido para a soma do boletim (script com dry-run; não muda vitória/derrota).
- Jogo interno precisa de modelagem para aparecer nas duas categorias (P-23).
- O resumo anual usa ano civil da data do jogo; jogadores entram pelo que jogaram no ano,
  mesmo inativos hoje.
