// Round 5: preenche estatística geral do adversário do jogo "Jogos Abertos
// 2019 #1 vs Anonimos" (game id 59), a partir da linha "Total" da tabela de
// boletim individual do adversário na planilha (linhas 780-792, aba Scout
// Jogos Masculino) — print mais nítido que o da tabela "VS X" usada nos
// rounds 3/4, então aqui dá pra usar inclusive a quebra de rebote
// ataque/defesa e roubos/tocos, que nos outros jogos não estavam
// disponíveis.
//
// Uso:
//   node scripts/update-games-2019-round5.mjs            (dry-run)
//   node scripts/update-games-2019-round5.mjs --apply     (grava de verdade)

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

const ANONIMOS = {
  gameId: 59,
  ftMade: 6, ftAttempted: 12,
  fg2Made: 14, fg2Attempted: 49,
  fg3Made: 4, fg3Attempted: 23,
  reboundsDef: 26, reboundsOff: 8,
  assists: 10, blocks: 0, turnovers: 11, steals: 1, fouls: 8,
};

async function main() {
  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}\n`);

  const t = ANONIMOS;
  const [current] = await sql`SELECT id, opponent, their_score FROM games WHERE id = ${t.gameId}`;
  if (!current) {
    console.log(`[game ${t.gameId}] NÃO encontrado no banco`);
    return;
  }
  const pontosFeitos = t.fg2Made * 2 + t.fg3Made * 3 + t.ftMade;
  const ok = pontosFeitos === current.their_score;
  console.log(
    `[game ${t.gameId}] ${current.opponent} — 2P ${t.fg2Made}/${t.fg2Attempted}, 3P ${t.fg3Made}/${t.fg3Attempted}, ` +
      `LL ${t.ftMade}/${t.ftAttempted}, reb ${t.reboundsOff}+${t.reboundsDef}=${t.reboundsOff + t.reboundsDef}, ` +
      `${t.assists} ast, ${t.steals} roubos, ${t.blocks} tocos, ${t.fouls} faltas, ${t.turnovers} erros — ` +
      `pontos feitos ${pontosFeitos} vs placar adversário ${current.their_score} ${ok ? "OK" : "*** DIVERGENTE ***"}`
  );
  if (!ok) {
    console.log("  >>> pulando gravação por divergência de placar");
    return;
  }

  if (!APPLY) return;

  await sql`
    UPDATE games
    SET opp_fg2_made = ${t.fg2Made}, opp_fg2_attempted = ${t.fg2Attempted},
        opp_fg3_made = ${t.fg3Made}, opp_fg3_attempted = ${t.fg3Attempted},
        opp_ft_made = ${t.ftMade}, opp_ft_attempted = ${t.ftAttempted},
        opp_rebounds_off = ${t.reboundsOff}, opp_rebounds_def = ${t.reboundsDef},
        opp_assists = ${t.assists}, opp_blocks = ${t.blocks}, opp_steals = ${t.steals},
        opp_fouls = ${t.fouls}, opp_turnovers = ${t.turnovers}
    WHERE id = ${t.gameId}
  `;
}

main().then(() => process.exit(0));
