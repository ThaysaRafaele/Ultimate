# 0002. "Categoria" é o termo canônico; atleta pode estar em várias

- Status: proposta (⚠ confirmar: P-02, P-03)
- Data: 2026-10-05
- Fontes: `lib/schema.ts` (`teams`, `athletes.teams`), `lib/validation.ts`, protótipo

## Contexto
A mesma coisa aparece como `teams` (tabela), "Categoria" (mensagens e cadastro),
"Equipe" (validação de atleta e de jogo) e "Time" (rota `/times`, protótipo "Times
cadastrados no clube"). O protótipo vincula cada atleta a uma única categoria; o código
guarda um array (`athletes.teams`).

## Decisão
"Categoria" na UI e na documentação; `teams` permanece como nome técnico. Atleta pode
pertencer a várias categorias (código vence o protótipo).

## Consequências
Textos com "equipe"/"time" no sentido de categoria migram para "categoria" quando forem
tocados. A relação atleta ↔ categoria segue desnormalizada (array); mudar para tabela
associativa exige ADR própria.
