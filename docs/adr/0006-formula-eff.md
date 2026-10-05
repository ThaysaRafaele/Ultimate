# 0006. Fórmula da EFF igual à planilha do técnico

- Status: aceita
- Data: 2026-10-05
- Fontes: `lib/stats-calc.ts` (`computeEff`), commit "corrige fórmula de EFF (desconta faltas)"

## Contexto
A planilha do técnico calcula eficiência por jogo, e o sistema precisa bater com ela.

## Decisão
EFF = (pontos + rebotes + assistências + roubos + tocos) − (arremessos de 2, de 3 e lances
livres errados + erros + faltas). Pontos = 2 × cestas de 2 + 3 × cestas de 3 + lances
livres convertidos. Valor derivado, nunca armazenado.

## Consequências
Toda tela que mostra EFF usa `computeEff`. A média do perfil hoje não desconta faltas
(divergência registrada como P-20).
