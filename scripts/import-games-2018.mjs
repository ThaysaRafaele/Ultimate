// One-off import of docs/games_2018.json (jogos, boletim e escalação de 2018,
// extraídos manualmente da planilha do técnico) para o Neon Postgres.
//
// Uso:
//   node scripts/import-games-2018.mjs            (dry-run, não grava nada)
//   node scripts/import-games-2018.mjs --apply     (grava de verdade)
//
// Depois de aplicado, o script pode ser rodado de novo sem duplicar dados:
// cada jogo é identificado por (team, championshipId, opponent, gameDate) e
// pulado se já existir; lineup/stats usam ON CONFLICT DO NOTHING (mesma
// unique constraint que a UI usa).

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

// Carrega .env.local manualmente (sem depender de dotenv/config para não
// exigir mais devDependencies do que o projeto já tem).
const envPath = path.join(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const sql = neon(process.env.DATABASE_URL);

const TEAM_ID = "adulto";
const GAME_TIME = "19:00";
const DEFAULT_DATE = "2018-01-01";

// Confirmado com o técnico/usuário (2026-07-17): esses nomes da planilha
// batem com atletas já cadastrados no sistema. "Rafa" e "Rafa Pivo" são a
// mesma pessoa (RAFAEL PALUDO DE MARCO) — nos jogos 2 e 3, onde os dois
// nomes aparecem como linhas separadas do boletim, as estatísticas são
// somadas em uma única linha por atleta (ver aggregateByAthlete). Os demais
// (Lucas, Rodrigo/Rodrigo L/Rodrigo l, Brendo, Douglas, Italo) ficam de fora
// desta importação — sem cadastro ou identidade ambígua (ex: dois "Lucas"
// cadastrados) — o técnico cadastra e lança essas estatísticas manualmente
// depois.
const PLAYER_MAP = {
  "Big Davi": 36, // DAVI ANGELO TRAJADO BUDIB
  "Ibra": 35, // IBRAHIM NICOLA TRAJADO BUDID
  "Dalton": 37,
  "Guto": 39,
  "Juliano": 40,
  "Renan": 38,
  "Roger": 42,
  "Vini": 33,
  "Rafa": 26, // RAFAEL PALUDO DE MARCO
  "Rafa Pivo": 26, // mesma pessoa que "Rafa" — ver comentário acima
};

const STAT_FIELDS = [
  "ll_t",
  "ll_c",
  "p2_t",
  "p2_c",
  "p3_t",
  "p3_c",
  "reb",
  "assist",
  "toco",
  "erros",
  "roubos",
  "faltas",
];

// Soma as linhas de box score que mapeiam para o mesmo atleta (caso "Rafa" +
// "Rafa Pivo" no mesmo jogo) em uma única linha, na ordem em que apareceram.
function aggregateByAthlete(players) {
  const byAthlete = new Map();
  for (const p of players) {
    if (!byAthlete.has(p.athleteId)) {
      byAthlete.set(p.athleteId, { athleteId: p.athleteId, sources: [p.jogador], ...Object.fromEntries(STAT_FIELDS.map((f) => [f, p[f]])) });
    } else {
      const agg = byAthlete.get(p.athleteId);
      agg.sources.push(p.jogador);
      for (const f of STAT_FIELDS) agg[f] += p[f];
    }
  }
  return [...byAthlete.values()];
}

function slugify(label) {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getOrCreateChampionship(name, cache) {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  const existing = await sql`SELECT id, name FROM championships WHERE lower(name) = ${key}`;
  if (existing.length > 0) {
    cache.set(key, existing[0]);
    return existing[0];
  }

  const existingIds = new Set((await sql`SELECT id FROM championships`).map((r) => r.id));
  let base = slugify(trimmed) || "campeonato";
  let id = base;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  const row = { id, name: trimmed, isNew: true };
  if (APPLY) {
    await sql`INSERT INTO championships (id, name) VALUES (${id}, ${trimmed})`;
  }
  cache.set(key, row);
  return row;
}

async function main() {
  const games = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "docs", "games_2018.json"), "utf8")
  );

  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}`);
  console.log(`Total de jogos no arquivo: ${games.length}\n`);

  const champCache = new Map();
  const unmappedTotal = new Set();
  let created = 0;
  let skippedExisting = 0;

  for (const g of games) {
    const champ = await getOrCreateChampionship(g.campeonato, champCache);
    const gameDate = g.data ?? DEFAULT_DATE;

    const existing = await sql`
      SELECT id FROM games
      WHERE team = ${TEAM_ID} AND championship_id = ${champ.id}
        AND opponent = ${g.adversario} AND game_date = ${gameDate}
    `;
    if (existing.length > 0) {
      console.log(`[jogo ${g.game_number}] já existe (id ${existing[0].id}) — pulando`);
      skippedExisting += 1;
      continue;
    }

    const q = g.placar_por_quarto;
    const opp = g.totais_adversario;

    const rawMapped = [];
    const unmapped = [];
    for (const p of g.jogadores_ultimate) {
      const athleteId = PLAYER_MAP[p.jogador];
      if (athleteId) rawMapped.push({ ...p, athleteId });
      else {
        unmapped.push(p.jogador);
        unmappedTotal.add(p.jogador);
      }
    }
    const mapped = aggregateByAthlete(rawMapped);
    const mergedNote = mapped
      .filter((m) => m.sources.length > 1)
      .map((m) => `${m.sources.join("+")}→atleta ${m.athleteId}`)
      .join("; ");

    console.log(
      `[jogo ${g.game_number}] ${gameDate}${g.data ? "" : " (data fictícia)"} vs ${g.adversario} ` +
        `(${champ.name}${champ.isNew ? ", campeonato NOVO" : ""}) — placar ${g.placar_ultimate}x${g.placar_adversario} — ` +
        `${mapped.length} atleta(s) mapeado(s), ${unmapped.length} sem cadastro${
          unmapped.length ? ": " + unmapped.join(", ") : ""
        }${mergedNote ? ` [somado: ${mergedNote}]` : ""}`
    );

    if (!APPLY) continue;

    const [row] = await sql`
      INSERT INTO games (
        team, championship_id, opponent, game_date, game_time, status,
        our_score, their_score,
        q1_our_score, q1_their_score, q2_our_score, q2_their_score,
        q3_our_score, q3_their_score, q4_our_score, q4_their_score,
        opp_rebounds_off, opp_rebounds_def, opp_assists, opp_steals, opp_blocks,
        opp_turnovers, opp_fouls, opp_fg2_made, opp_fg2_attempted,
        opp_fg3_made, opp_fg3_attempted, opp_ft_made, opp_ft_attempted
      ) VALUES (
        ${TEAM_ID}, ${champ.id}, ${g.adversario}, ${gameDate}, ${GAME_TIME}, 'realizado',
        ${g.placar_ultimate}, ${g.placar_adversario},
        ${q.q1.ultimate}, ${q.q1.adversario}, ${q.q2.ultimate}, ${q.q2.adversario},
        ${q.q3.ultimate}, ${q.q3.adversario}, ${q.q4.ultimate}, ${q.q4.adversario},
        0, ${opp.reb}, ${opp.assist}, ${opp.roubos}, ${opp.toco},
        ${opp.erros}, ${opp.faltas}, ${opp.p2_c}, ${opp.p2_t},
        ${opp.p3_c}, ${opp.p3_t}, ${opp.ll_c}, ${opp.ll_t}
      )
      RETURNING id
    `;
    const gameId = row.id;
    created += 1;

    for (const p of mapped) {
      await sql`
        INSERT INTO game_lineups (game_id, athlete_id) VALUES (${gameId}, ${p.athleteId})
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO game_stats (
          game_id, athlete_id, rebounds_off, rebounds_def, assists, steals, blocks,
          turnovers, fouls, fg2_made, fg2_attempted, fg3_made, fg3_attempted, ft_made, ft_attempted
        ) VALUES (
          ${gameId}, ${p.athleteId}, 0, ${p.reb}, ${p.assist}, ${p.roubos}, ${p.toco},
          ${p.erros}, ${p.faltas}, ${p.p2_c}, ${p.p2_t}, ${p.p3_c}, ${p.p3_t}, ${p.ll_c}, ${p.ll_t}
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }

  console.log("\n--- Resumo ---");
  console.log(`Jogos ${APPLY ? "criados" : "que seriam criados"}: ${created || games.length - skippedExisting}`);
  console.log(`Jogos já existentes (pulados): ${skippedExisting}`);
  console.log(`Jogadores sem cadastro (não importados em nenhum jogo): ${[...unmappedTotal].sort().join(", ")}`);
}

main().then(() => process.exit(0));
