// Complementa 6 jogos de 2019 já importados (scripts/import-games-2019.mjs)
// que na 1ª rodada não tinham boletim individual e agora têm, mais a correção
// do nome do adversário "Hoops" -> "Hoots" (Copa Cuiabá 30+, jogo 1).
//
// Uso:
//   node scripts/update-games-2019-round2.mjs            (dry-run)
//   node scripts/update-games-2019-round2.mjs --apply     (grava de verdade)
//
// Mesmas regras de mapeamento de nome->atleta já confirmadas com o técnico em
// scripts/import-games-2019.mjs (PLAYER_MAP idêntico). Nomes novos que
// aparecem aqui e não têm cadastro (Rodrigo, Messi, Luiz, Hugo, Josemir, Léo,
// Big, Léozão) ficam de fora, mesma política.
//
// Identifica cada jogo pelo id já conhecido no banco (achado via campeonato +
// adversário ORIGINAL + data), não recria nada — só complementa MVP,
// escalação, estatísticas e corrige o nome do adversário quando necessário.

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

const PLAYER_MAP = {
  "Apollo": 31,
  "Big Davi": 36,
  "Chico": 34,
  "Ciro": 46,
  "Claudinei": 45,
  "Dalton": 37,
  "Guilherme": 52,
  "Ibra": 35,
  "Jhone": 51,
  "Jonatan": 43,
  "João": 6,
  "Lazaro": 50,
  "Léo Libório": 49,
  "Leo Liborio": 49,
  "Libório": 49,
  "Nathan": 20,
  "Orue": 8,
  "Petini": 41,
  "Rafa": 26,
  "Renan": 38,
  "Roger": 42,
  "Thimoteo": 24,
  "Timoteo": 24,
  "Titi": 24,
  "Valverde": 48,
  "Vini": 33,
};

// (campeonato, jogo_numero no JSON) -> id do jogo já existente no banco
const TARGETS = [
  { campeonato: "Jogos Abertos 2019", jogoNumero: 1, gameId: 59 },
  { campeonato: "Copa Maringá 25+ 2019", jogoNumero: 1, gameId: 66 },
  { campeonato: "Copa Maringá 25+ 2019", jogoNumero: 3, gameId: 68 },
  { campeonato: "Copa Cuiabá 30+ 2019", jogoNumero: 1, gameId: 69 },
  { campeonato: "Copa Cuiabá 30+ 2019", jogoNumero: 2, gameId: 70 },
  { campeonato: "Copa Cuiabá 30+ 2019", jogoNumero: 3, gameId: 71 },
];

const STAT_FIELDS = ["ll_t", "ll_c", "pt2_t", "pt2_c", "pt3_t", "pt3_c", "ast", "toco", "erros", "roubos", "faltas"];

function rebounds(row) {
  if ("reb_o" in row || "reb_d" in row) {
    return { off: row.reb_o ?? 0, def: row.reb_d ?? 0 };
  }
  return { off: 0, def: row.reb ?? 0 };
}

function aggregateByAthlete(players) {
  const byAthlete = new Map();
  for (const p of players) {
    const reb = rebounds(p);
    if (!byAthlete.has(p.athleteId)) {
      byAthlete.set(p.athleteId, {
        athleteId: p.athleteId,
        sources: [p.atleta],
        rebOff: reb.off,
        rebDef: reb.def,
        ...Object.fromEntries(STAT_FIELDS.map((f) => [f, p[f] ?? 0])),
      });
    } else {
      const agg = byAthlete.get(p.athleteId);
      agg.sources.push(p.atleta);
      agg.rebOff += reb.off;
      agg.rebDef += reb.def;
      for (const f of STAT_FIELDS) agg[f] += p[f] ?? 0;
    }
  }
  return [...byAthlete.values()];
}

function sumOpponentTotals(atletasAdver) {
  if (!atletasAdver || atletasAdver.length === 0) return null;
  const totals = { rebOff: 0, rebDef: 0, ast: 0, toco: 0, erros: 0, roubos: 0, faltas: 0, pt2_t: 0, pt2_c: 0, pt3_t: 0, pt3_c: 0, ll_t: 0, ll_c: 0 };
  for (const p of atletasAdver) {
    const reb = rebounds(p);
    totals.rebOff += reb.off;
    totals.rebDef += reb.def;
    for (const f of ["ast", "toco", "erros", "roubos", "faltas", "pt2_t", "pt2_c", "pt3_t", "pt3_c", "ll_t", "ll_c"]) {
      totals[f] += p[f] ?? 0;
    }
  }
  return totals;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "ultimate_basketball_2019.json"), "utf8"));

  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}`);

  const unmappedTotal = new Set();

  for (const t of TARGETS) {
    const g = data.games.find((x) => x.campeonato === t.campeonato && x.jogo_numero === t.jogoNumero);
    if (!g) {
      console.log(`[game ${t.gameId}] NÃO encontrado no JSON (${t.campeonato} #${t.jogoNumero}) — pulando`);
      continue;
    }

    const [current] = await sql`SELECT id, opponent, mvp_athlete_id FROM games WHERE id = ${t.gameId}`;
    if (!current) {
      console.log(`[game ${t.gameId}] NÃO encontrado no banco — pulando`);
      continue;
    }

    const rawMapped = [];
    const unmapped = [];
    for (const p of g.atletas_nos ?? []) {
      const athleteId = PLAYER_MAP[p.atleta];
      if (athleteId) rawMapped.push({ ...p, athleteId });
      else {
        unmapped.push(p.atleta);
        unmappedTotal.add(p.atleta);
      }
    }
    const mapped = aggregateByAthlete(rawMapped);
    const mvpAthleteId = g.mvp_sugerido ? PLAYER_MAP[g.mvp_sugerido] ?? null : null;
    const opp = sumOpponentTotals(g.atletas_adver);
    const opponentChanged = current.opponent !== g.adversario;

    console.log(
      `[game ${t.gameId}] ${t.campeonato} #${t.jogoNumero} vs ${g.adversario}` +
        `${opponentChanged ? ` (nome corrigido de "${current.opponent}")` : ""} — ` +
        `mvp: ${g.mvp_sugerido ?? "-"}${g.mvp_sugerido && !mvpAthleteId ? " (sem cadastro)" : ""} — ` +
        `${mapped.length} atleta(s) mapeado(s), ${unmapped.length} sem cadastro${
          unmapped.length ? ": " + unmapped.join(", ") : ""
        }`
    );

    if (!APPLY) continue;

    await sql`
      UPDATE games
      SET opponent = ${g.adversario}, mvp_athlete_id = ${mvpAthleteId},
          opp_rebounds_off = ${opp?.rebOff ?? null}, opp_rebounds_def = ${opp?.rebDef ?? null},
          opp_assists = ${opp?.ast ?? null}, opp_steals = ${opp?.roubos ?? null}, opp_blocks = ${opp?.toco ?? null},
          opp_turnovers = ${opp?.erros ?? null}, opp_fouls = ${opp?.faltas ?? null},
          opp_fg2_made = ${opp?.pt2_c ?? null}, opp_fg2_attempted = ${opp?.pt2_t ?? null},
          opp_fg3_made = ${opp?.pt3_c ?? null}, opp_fg3_attempted = ${opp?.pt3_t ?? null},
          opp_ft_made = ${opp?.ll_c ?? null}, opp_ft_attempted = ${opp?.ll_t ?? null}
      WHERE id = ${t.gameId}
    `;

    for (const p of mapped) {
      await sql`
        INSERT INTO game_lineups (game_id, athlete_id) VALUES (${t.gameId}, ${p.athleteId})
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO game_stats (
          game_id, athlete_id, rebounds_off, rebounds_def, assists, steals, blocks,
          turnovers, fouls, fg2_made, fg2_attempted, fg3_made, fg3_attempted, ft_made, ft_attempted
        ) VALUES (
          ${t.gameId}, ${p.athleteId}, ${p.rebOff}, ${p.rebDef}, ${p.ast}, ${p.roubos}, ${p.toco},
          ${p.erros}, ${p.faltas}, ${p.pt2_c}, ${p.pt2_t}, ${p.pt3_c}, ${p.pt3_t}, ${p.ll_c}, ${p.ll_t}
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }

  console.log("\n--- Resumo ---");
  console.log(`Jogadores sem cadastro (estatísticas NÃO adicionadas): ${[...unmappedTotal].sort().join(", ")}`);
}

main().then(() => process.exit(0));
