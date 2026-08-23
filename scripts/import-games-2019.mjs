// One-off import of docs/ultimate_basketball_2019.json (jogos, boletim e
// escalação de 2019, extraídos da planilha do técnico) para o Neon Postgres.
//
// Uso:
//   node scripts/import-games-2019.mjs            (dry-run, não grava nada)
//   node scripts/import-games-2019.mjs --apply     (grava de verdade)
//
// Idempotente: cada jogo é identificado por (team, championship_id, opponent,
// game_date) e pulado se já existir; lineup/stats usam ON CONFLICT DO NOTHING.
//
// Decisões confirmadas com o técnico (2026-08-23) sobre nomes ambíguos do
// boletim de 2019:
// - "Big Davi" = Davi Angelo Trajado Budib (id 36, já confirmado em 2018).
//   "Big", "Big David" e "Davi" (sozinhos, sem "Davi" no meio de "Big Davi")
//   NÃO foram confirmados para 2019 e ficam de fora.
// - "Guilherme" (Amistosos pós temporada, jogo 1) = Guilherme "Guigas" (id 52),
//   não Guilherme Widal (id 7).
// - "Leo" / "Léo" / "Léozão" (sem "Libório" no nome) NÃO têm cadastro
//   confirmado — ficam de fora. "Léo Libório" / "Leo Liborio" / "Libório"
//   (sozinho) = Leonardo Mondini Libório (id 49) — confirmado por co-ocorrência
//   (aparecem juntos no boletim de "Amistosos pós temporada 2019" jogo 2, ou
//   seja, são pessoas diferentes).
// - Nomes sem nenhum cadastro correspondente (ficam de fora, o técnico
//   cadastra depois): João Luiz / Joao Luiz, João Green, Rafa Silva, Rodrigo,
//   Wesley, Marcius, Machado, Nélio, Paulo.
// - Os 3 jogos em "games_extra" do JSON (placar não bate com o Scoutt Geral,
//   campeonato "não identificado") NÃO são importados por este script —
//   precisam de confirmação separada do técnico.

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

const TEAM_ID = "adulto";
const GAME_TIME = "19:00";

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

const STAT_FIELDS = ["ll_t", "ll_c", "pt2_t", "pt2_c", "pt3_t", "pt3_c", "ast", "toco", "erros", "roubos", "faltas"];

function rebounds(row) {
  if ("reb_o" in row || "reb_d" in row) {
    return { off: row.reb_o ?? 0, def: row.reb_d ?? 0 };
  }
  return { off: 0, def: row.reb ?? 0 };
}

// Soma linhas de box score que mapeiam para o mesmo atleta em uma única linha.
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
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "ultimate_basketball_2019.json"), "utf8"));
  const games = data.games;

  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}`);
  console.log(`Total de jogos no arquivo (games, sem games_extra): ${games.length}\n`);

  const champCache = new Map();
  const unmappedTotal = new Set();
  const unresolvedMvpGames = [];
  let created = 0;
  let skippedExisting = 0;

  for (const g of games) {
    const champ = await getOrCreateChampionship(g.campeonato, champCache);
    const gameDate = g.data;

    const existing = await sql`
      SELECT id FROM games
      WHERE team = ${TEAM_ID} AND championship_id = ${champ.id}
        AND opponent = ${g.adversario} AND game_date = ${gameDate}
    `;
    if (existing.length > 0) {
      console.log(`[${g.campeonato} #${g.jogo_numero}] já existe (id ${existing[0].id}) — pulando`);
      skippedExisting += 1;
      continue;
    }

    const q = g.boletim;
    const opp = sumOpponentTotals(g.atletas_adver);

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
    const mergedNote = mapped
      .filter((m) => m.sources.length > 1)
      .map((m) => `${m.sources.join("+")}→atleta ${m.athleteId}`)
      .join("; ");

    const mvpAthleteId = g.mvp_sugerido ? PLAYER_MAP[g.mvp_sugerido] ?? null : null;
    if (g.mvp_sugerido && !mvpAthleteId) {
      unresolvedMvpGames.push(`${g.campeonato} #${g.jogo_numero} (mvp sugerido: ${g.mvp_sugerido})`);
    }

    console.log(
      `[${g.campeonato} #${g.jogo_numero}] ${gameDate}${g.data_ficticia ? " (data fictícia)" : ""} vs ${g.adversario} ` +
        `(${champ.name}${champ.isNew ? ", campeonato NOVO" : ""}) — placar ${g.placar_final.nos}x${g.placar_final.adver} — ` +
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
        mvp_athlete_id,
        opp_rebounds_off, opp_rebounds_def, opp_assists, opp_steals, opp_blocks,
        opp_turnovers, opp_fouls, opp_fg2_made, opp_fg2_attempted,
        opp_fg3_made, opp_fg3_attempted, opp_ft_made, opp_ft_attempted
      ) VALUES (
        ${TEAM_ID}, ${champ.id}, ${g.adversario}, ${gameDate}, ${GAME_TIME}, 'realizado',
        ${g.placar_final.nos}, ${g.placar_final.adver},
        ${q.q1.nos}, ${q.q1.adver}, ${q.q2.nos}, ${q.q2.adver},
        ${q.q3.nos}, ${q.q3.adver}, ${q.q4.nos}, ${q.q4.adver},
        ${mvpAthleteId},
        ${opp?.rebOff ?? null}, ${opp?.rebDef ?? null}, ${opp?.ast ?? null}, ${opp?.roubos ?? null}, ${opp?.toco ?? null},
        ${opp?.erros ?? null}, ${opp?.faltas ?? null}, ${opp?.pt2_c ?? null}, ${opp?.pt2_t ?? null},
        ${opp?.pt3_c ?? null}, ${opp?.pt3_t ?? null}, ${opp?.ll_c ?? null}, ${opp?.ll_t ?? null}
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
          ${gameId}, ${p.athleteId}, ${p.rebOff}, ${p.rebDef}, ${p.ast}, ${p.roubos}, ${p.toco},
          ${p.erros}, ${p.faltas}, ${p.pt2_c}, ${p.pt2_t}, ${p.pt3_c}, ${p.pt3_t}, ${p.ll_c}, ${p.ll_t}
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }

  console.log("\n--- Resumo ---");
  console.log(`Jogos ${APPLY ? "criados" : "que seriam criados"}: ${created || games.length - skippedExisting}`);
  console.log(`Jogos já existentes (pulados): ${skippedExisting}`);
  console.log(`Jogadores sem cadastro (estatísticas NÃO importadas em nenhum jogo): ${[...unmappedTotal].sort().join(", ")}`);
  if (unresolvedMvpGames.length) {
    console.log(`MVP sugerido sem cadastro correspondente (mvp_athlete_id ficou vazio): \n  - ${unresolvedMvpGames.join("\n  - ")}`);
  }
}

main().then(() => process.exit(0));
