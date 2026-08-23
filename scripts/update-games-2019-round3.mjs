// Round 3 de correções em jogos de 2019 já importados:
// 1. Vincula Hugo ("HUGÃO", atleta id 27) — nome antes deixado de fora por
//    identidade não confirmada (ver scripts/update-games-2019-round2.mjs),
//    confirmado pelo técnico em 2026-08-23. Aparece em 3 jogos da Copa
//    Cuiabá 30+ (games_ids 69, 70, 71), sempre com "atleta": "Hugo" em
//    atletas_nos (o "Hugo" que aparece em atletas_adver do jogo da Copa
//    América #5 é um jogador do time adversário, NÃO é o mesmo atleta —
//    não mexe nesse).
// 2. Preenche estatística GERAL (agregada por time, sem quebra por jogador)
//    do adversário Hoots (jogo Copa Cuiabá 30+ #1, game id 69), a partir da
//    tabela "VS Hoots" da planilha (aba Scout Jogos Masculino) que o técnico
//    trouxe: 2P 47/16, 3P 21/4, LL 27/11, assistências 8, faltas 12, erros
//    (turnovers) 9. NÃO preenche rebotes (só total 43 disponível na
//    planilha, sem quebra ataque/defesa) nem roubos/tocos (não constam
//    nessa tabela) — ficam null para o técnico completar direto na tela de
//    estatísticas do jogo, que já tem os campos da linha ADVERSÁRIO prontos
//    para isso.
//
// Uso:
//   node scripts/update-games-2019-round3.mjs            (dry-run)
//   node scripts/update-games-2019-round3.mjs --apply     (grava de verdade)

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

const HUGO_ATHLETE_ID = 27;
const HUGO_GAMES = [
  { campeonato: "Copa Cuiabá 30+ 2019", jogoNumero: 1, gameId: 69 },
  { campeonato: "Copa Cuiabá 30+ 2019", jogoNumero: 2, gameId: 70 },
  { campeonato: "Copa Cuiabá 30+ 2019", jogoNumero: 3, gameId: 71 },
];

const HOOTS_OPPONENT_TOTALS = {
  gameId: 69,
  fg2Attempted: 47,
  fg2Made: 16,
  fg3Attempted: 21,
  fg3Made: 4,
  ftAttempted: 27,
  ftMade: 11,
  assists: 8,
  fouls: 12,
  turnovers: 9,
};

function rebounds(row) {
  if ("reb_o" in row || "reb_d" in row) {
    return { off: row.reb_o ?? 0, def: row.reb_d ?? 0 };
  }
  return { off: 0, def: row.reb ?? 0 };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "ultimate_basketball_2019.json"), "utf8"));

  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}\n`);

  console.log("--- 1. Vinculando Hugo (id 27) ---");
  for (const t of HUGO_GAMES) {
    const g = data.games.find((x) => x.campeonato === t.campeonato && x.jogo_numero === t.jogoNumero);
    if (!g) {
      console.log(`[game ${t.gameId}] NÃO encontrado no JSON (${t.campeonato} #${t.jogoNumero}) — pulando`);
      continue;
    }
    const p = (g.atletas_nos ?? []).find((a) => a.atleta === "Hugo");
    if (!p) {
      console.log(`[game ${t.gameId}] Hugo não está em atletas_nos deste jogo — pulando`);
      continue;
    }
    const reb = rebounds(p);
    console.log(
      `[game ${t.gameId}] ${t.campeonato} #${t.jogoNumero} vs ${g.adversario} — Hugo: ` +
        `${p.pt2_c ?? 0}/${p.pt2_t ?? 0} 2P, ${p.pt3_c ?? 0}/${p.pt3_t ?? 0} 3P, ${p.ll_c ?? 0}/${p.ll_t ?? 0} LL, ` +
        `${p.ast ?? 0} ast, ${p.faltas ?? 0} faltas, total ${p.total ?? 0} pts`
    );

    if (!APPLY) continue;

    await sql`
      INSERT INTO game_lineups (game_id, athlete_id) VALUES (${t.gameId}, ${HUGO_ATHLETE_ID})
      ON CONFLICT DO NOTHING
    `;
    await sql`
      INSERT INTO game_stats (
        game_id, athlete_id, rebounds_off, rebounds_def, assists, steals, blocks,
        turnovers, fouls, fg2_made, fg2_attempted, fg3_made, fg3_attempted, ft_made, ft_attempted
      ) VALUES (
        ${t.gameId}, ${HUGO_ATHLETE_ID}, ${reb.off}, ${reb.def}, ${p.ast ?? 0}, ${p.roubos ?? 0}, ${p.toco ?? 0},
        ${p.erros ?? 0}, ${p.faltas ?? 0}, ${p.pt2_c ?? 0}, ${p.pt2_t ?? 0}, ${p.pt3_c ?? 0}, ${p.pt3_t ?? 0}, ${p.ll_c ?? 0}, ${p.ll_t ?? 0}
      )
      ON CONFLICT DO NOTHING
    `;
  }

  console.log("\n--- 2. Estatística geral do adversário (Hoots, game 69) ---");
  const t = HOOTS_OPPONENT_TOTALS;
  console.log(
    `[game ${t.gameId}] 2P ${t.fg2Made}/${t.fg2Attempted}, 3P ${t.fg3Made}/${t.fg3Attempted}, LL ${t.ftMade}/${t.ftAttempted}, ` +
      `${t.assists} ast, ${t.fouls} faltas, ${t.turnovers} erros — rebotes/roubos/tocos ficam em branco (sem quebra na planilha)`
  );

  if (APPLY) {
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
