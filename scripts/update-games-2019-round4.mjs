// Round 4: preenche estatística GERAL (agregada por time, sem quebra por
// jogador) do adversário para 4 jogos, a partir das tabelas "VS <adversário>"
// da planilha (aba Scout Jogos Masculino) que o técnico trouxe em prints.
//
// Cada jogo tem DUAS tabelas "VS <adversário>" na planilha: a primeira bate
// com o NOSSO placar (já temos esse dado, é só o nosso time reapresentado
// por quarto) e a segunda bate exatamente com o placar DO ADVERSÁRIO — é
// essa segunda que entra aqui. Conferido: pontos feitos (2P*2 + 3P*3 + LL)
// bate exatamente com o placar do adversário em todos os 4 jogos.
//
// Mesma limitação do round 3 (Hoots, game 69): a planilha só tem o total de
// rebotes (sem quebra ataque/defesa) e não tem linha de roubos/tocos do
// adversário nessas tabelas agregadas — esses campos ficam null para o
// técnico completar direto na tela de estatísticas do jogo.
//
// Uso:
//   node scripts/update-games-2019-round4.mjs            (dry-run)
//   node scripts/update-games-2019-round4.mjs --apply     (grava de verdade)

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const envPath = path.join(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const sql = neon(process.env.DATABASE_URL);

const OPPONENT_TOTALS = [
  {
    gameId: 66,
    opponent: "Maringa C",
    fg2Made: 14, fg2Attempted: 38,
    fg3Made: 3, fg3Attempted: 21,
    ftMade: 8, ftAttempted: 22,
    assists: 10, fouls: 15, turnovers: 20,
  },
  {
    gameId: 68,
    opponent: "Londrina",
    fg2Made: 15, fg2Attempted: 36,
    fg3Made: 11, fg3Attempted: 29,
    ftMade: 16, ftAttempted: 23,
    assists: 8, fouls: 13, turnovers: 2,
  },
  {
    gameId: 70,
    opponent: "Highlanders",
    fg2Made: 7, fg2Attempted: 31,
    fg3Made: 5, fg3Attempted: 21,
    ftMade: 6, ftAttempted: 14,
    assists: 5, fouls: 20, turnovers: 9,
  },
  {
    gameId: 71,
    opponent: "Rondonia",
    fg2Made: 10, fg2Attempted: 49,
    fg3Made: 3, fg3Attempted: 22,
    ftMade: 1, ftAttempted: 2,
    assists: 10, fouls: 17, turnovers: 9,
  },
];

async function main() {
  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}\n`);

  for (const t of OPPONENT_TOTALS) {
    const [current] = await sql`SELECT id, opponent, their_score FROM games WHERE id = ${t.gameId}`;
    if (!current) {
      console.log(`[game ${t.gameId}] NÃO encontrado no banco — pulando`);
      continue;
    }
    const pontosFeitos = t.fg2Made * 2 + t.fg3Made * 3 + t.ftMade;
    const ok = pontosFeitos === current.their_score;
    console.log(
      `[game ${t.gameId}] ${current.opponent} — 2P ${t.fg2Made}/${t.fg2Attempted}, 3P ${t.fg3Made}/${t.fg3Attempted}, ` +
        `LL ${t.ftMade}/${t.ftAttempted}, ${t.assists} ast, ${t.fouls} faltas, ${t.turnovers} erros — ` +
        `pontos feitos ${pontosFeitos} vs placar adversário ${current.their_score} ${ok ? "OK" : "*** DIVERGENTE ***"}`
    );
    if (!ok) {
      console.log(`  >>> pulando gravação de ${t.gameId} por divergência de placar`);
      continue;
    }

    if (!APPLY) continue;

    await sql`
      UPDATE games
      SET opp_fg2_made = ${t.fg2Made}, opp_fg2_attempted = ${t.fg2Attempted},
          opp_fg3_made = ${t.fg3Made}, opp_fg3_attempted = ${t.fg3Attempted},
          opp_ft_made = ${t.ftMade}, opp_ft_attempted = ${t.ftAttempted},
          opp_assists = ${t.assists}, opp_fouls = ${t.fouls}, opp_turnovers = ${t.turnovers}
      WHERE id = ${t.gameId}
    `;
  }
}

main().then(() => process.exit(0));
