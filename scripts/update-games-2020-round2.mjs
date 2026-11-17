// Round 2 de 2020: aplica as respostas do técnico (2026-11-17) sobre os jogos
// de 2020 já importados por scripts/import-games-2020.mjs. Ver ADR-0008 e
// docs/recados-tecnico.md (Importação 2020).
//
// Uso:
//   node scripts/update-games-2020-round2.mjs            (dry-run, não grava nada)
//   node scripts/update-games-2020-round2.mjs --apply     (grava de verdade)
//
// ⚠ Antes do --apply: criar um branch de backup no Neon (a mescla apaga 2
// cadastros de atleta).
//
// O que faz, nesta ordem (cada etapa é idempotente):
// 1. Mescla cadastros duplicados, mantendo o ativo: Guigas 52 → 53 e Renan
//    Anacleto 38 → 44. Move escalação, boletim, MVP e notificações de todos os
//    anos; se os dois ids estiverem no mesmo jogo, soma o boletim. Depois apaga
//    o cadastro inativo. Cada mescla roda numa transação.
// 2. Categorias: inclui `master` em João, Chico, Paulo, Oruê, Vini e Dalton
//    (sem tirar `adulto`) e `blazers` nos atletas dos jogos do Kids.
// 3. Vincula, nos 17 jogos já importados, os nomes confirmados (escalação,
//    boletim e MVP vazio): Jp = João (6), Big = Davi Budib (36), Jonatas =
//    Jhonatan (43), Gui = Guigas (53), Léo = Leonardo Stival (47), Negão =
//    Claudinei (45), Rafa e Rafa Doncic = Rafa Paludo (26; na Copa América #7
//    os dois aparecem e são somados), Thiago = Thiago Segóvia (58).
//    Ficam de fora: Fabinho e Rodrigo (técnico: não precisa) e Marcius
//    (pendente: aguardando cadastro).
// 4. Importa os 4 jogos do Kids na categoria `blazers` (Kids = antigo blazers).
//    Fora: Jonas e Dílan (técnico: não precisa).
// 5. Circuito Master CG 30+ 2020 #3 vs Neon: quartos 14x12, 14x19, 12x7, 9x11 e
//    prorrogação 17x9 (66x58).
// 6. Datas (seguem fictícias): Férias Cup em março, Circuito Master em junho e
//    Copa América a partir de setembro, mantendo a ordem e o intervalo semanal
//    dos jogos. UPDATE pelo id do jogo. docs/ultimate_basketball_2020.json já
//    está com as datas novas; o jogo é localizado pela data antiga ou nova.
//
// Placar: segue o da Scoutt Geral (Funlec 62, North Wolf 41, América 48),
// confirmado pelo técnico; nada muda.

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

const GAME_TIME = "19:00";
const KIDS_TEAM = "blazers";

// 1. Mesclas (manter → apagar).
const MERGES = [
  { label: "Guigas", keep: 53, drop: 52 },
  { label: "Renan Anacleto", keep: 44, drop: 38 },
];

// Mapa de import-games-2020.mjs, já com os ids que sobram após a mescla.
const BASE_MAP = {
  "Apollo": 31, "Big Davi": 36, "Chico": 34, "Ciro": 46, "Cyro": 46, "Claudinei": 45,
  "Dalton": 37, "Guilherme": 53, "Hugo": 27, "Ibra": 35, "Jhone": 51, "Jonatan": 43,
  "João": 6, "Lazaro": 50, "Léo Libório": 49, "Leo Liborio": 49, "Libório": 49,
  "Nathan": 20, "Orue": 8, "Petini": 41, "Renan": 44, "Roger": 42, "Thimoteo": 24,
  "Timoteo": 24, "Titi": 24, "Thithi": 24, "Valverde": 48, "Vini": 33,
  "Paulo": 54, "Lebron": 55, "Totó": 56,
};

// 3. Respostas do técnico (2026-11-17) para os jogos Adulto/Master.
const NEW_LINKS = {
  "Jp": 6,
  "Big": 36,
  "Jonatas": 43,
  "Gui": 53,
  "Léo": 47,
  "Negão": 45,
  "Rafa": 26,
  "Rafa Doncic": 26,
  "Thiago": 58,
};

// 4. Jogos do Kids.
const KIDS_LINKS = {
  "Segóvia": 58,
  "Bruno": 57,
  "Bruno A.": 57,
  "Mateus": 62,
  "Gustavo": 61,
  "Luiz": 74,
  "Gui": 53,
};

const LEFT_OUT = {
  "Fabinho": "técnico: não precisa (é outro Fabinho)",
  "Rodrigo": "técnico: não precisa",
  "Marcius": "PENDENTE: aguardando os dados para o cadastro",
  "Jonas": "técnico: não precisa",
  "Dílan": "técnico: não precisa",
};

// 2. Categorias a incluir (sem tirar nenhuma).
const ADD_MASTER = [6, 34, 54, 8, 33, 37];

// 5. Circuito Master #3.
const CIRCUITO_3 = {
  campeonato: "Circuito Master CG 30+ 2020",
  jogo: 3,
  q: [[14, 12], [14, 19], [12, 7], [9, 11]],
  ot: [17, 9],
};

// 6. Datas: campeonato → { jogo_numero: [antes, depois] }.
const DATE_CHANGES = {
  "Férias Cup 2020": { 1: ["2020-01-18", "2020-03-07"], 2: ["2020-01-19", "2020-03-08"], 3: ["2020-01-25", "2020-03-14"] },
  "Circuito Master CG 30+ 2020": { 1: ["2020-02-22", "2020-06-06"], 2: ["2020-02-29", "2020-06-13"], 3: ["2020-03-07", "2020-06-20"] },
  "Copa América 2020": {
    1: ["2020-10-10", "2020-09-05"], 2: ["2020-10-10", "2020-09-05"], 3: ["2020-10-11", "2020-09-06"],
    4: ["2020-10-17", "2020-09-12"], 5: ["2020-10-18", "2020-09-13"], 6: ["2020-10-24", "2020-09-19"],
    7: ["2020-10-25", "2020-09-20"], 8: ["2020-10-31", "2020-09-26"], 9: ["2020-11-07", "2020-10-03"],
    10: ["2020-11-14", "2020-10-10"], 11: ["2020-11-21", "2020-10-17"], 12: ["2020-11-22", "2020-10-18"],
  },
};

const STAT_FIELDS = ["ll_t", "ll_c", "pt2_t", "pt2_c", "pt3_t", "pt3_c", "ast", "toco", "erros", "roubos", "faltas"];
const STAT_COLUMNS = [
  "rebounds_off", "rebounds_def", "assists", "steals", "blocks", "turnovers", "fouls",
  "fg2_made", "fg2_attempted", "fg3_made", "fg3_attempted", "ft_made", "ft_attempted",
];

const points = (r) => (r.ll_c ?? 0) + 2 * (r.pt2_c ?? 0) + 3 * (r.pt3_c ?? 0);

// Soma linhas de box score que mapeiam para o mesmo atleta em uma única linha.
function aggregateByAthlete(players) {
  const byAthlete = new Map();
  for (const p of players) {
    if (!byAthlete.has(p.athleteId)) {
      byAthlete.set(p.athleteId, {
        athleteId: p.athleteId,
        sources: [p.atleta],
        rebOff: p.reb_o ?? 0,
        rebDef: p.reb_d ?? 0,
        ...Object.fromEntries(STAT_FIELDS.map((f) => [f, p[f] ?? 0])),
      });
    } else {
      const agg = byAthlete.get(p.athleteId);
      agg.sources.push(p.atleta);
      agg.rebOff += p.reb_o ?? 0;
      agg.rebDef += p.reb_d ?? 0;
      for (const f of STAT_FIELDS) agg[f] += p[f] ?? 0;
    }
  }
  return [...byAthlete.values()];
}

function sumOpponentTotals(atletasAdver) {
  if (!atletasAdver || atletasAdver.length === 0) return null;
  const t = { rebOff: 0, rebDef: 0, pts: 0, ast: 0, toco: 0, erros: 0, roubos: 0, faltas: 0, pt2_t: 0, pt2_c: 0, pt3_t: 0, pt3_c: 0, ll_t: 0, ll_c: 0 };
  for (const p of atletasAdver) {
    t.rebOff += p.reb_o ?? 0;
    t.rebDef += p.reb_d ?? 0;
    t.pts += points(p);
    for (const f of STAT_FIELDS) t[f] += p[f] ?? 0;
  }
  return t;
}

function slugify(label) {
  return label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function getOrCreateChampionship(name) {
  const trimmed = name.trim();
  const existing = await sql`SELECT id, name FROM championships WHERE lower(name) = ${trimmed.toLowerCase()}`;
  if (existing.length > 0) return existing[0];
  const ids = new Set((await sql`SELECT id FROM championships`).map((r) => r.id));
  const base = slugify(trimmed) || "campeonato";
  let id = base;
  for (let n = 2; ids.has(id); n += 1) id = `${base}-${n}`;
  if (APPLY) await sql`INSERT INTO championships (id, name) VALUES (${id}, ${trimmed})`;
  return { id, name: trimmed, isNew: true };
}

const fmt = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

function insertStatsQuery(gameId, p) {
  return sql`
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

// Localiza um jogo de 2020 pela data antiga ou pela nova.
async function findGame(team, champId, opponent, campeonato, jogo, jsonDate) {
  const change = DATE_CHANGES[campeonato]?.[jogo];
  const dates = [...new Set([jsonDate, ...(change ?? [])])];
  const rows = await sql`
    SELECT id, game_date::text AS game_date, mvp_athlete_id FROM games
    WHERE team = ${team} AND championship_id = ${champId} AND opponent = ${opponent}
      AND game_date = ANY(${dates}::date[])
  `;
  if (rows.length > 1) throw new Error(`${campeonato} #${jogo}: mais de um jogo encontrado (${rows.map((r) => r.id).join(", ")})`);
  return rows[0] ?? null;
}

async function main() {
  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}\n`);

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "ultimate_basketball_2020.json"), "utf8"));
  const athletes = await sql`SELECT id, name, nickname, teams, active, entry_date::text AS entry_date, number, birth_date::text AS birth_date, photo_url FROM athletes`;
  const byId = new Map(athletes.map((a) => [a.id, a]));
  const label = (id) => {
    const a = byId.get(id);
    return a ? `${a.nickname ?? a.name} (${id})` : `?? (${id})`;
  };

  const allIds = [...Object.values(BASE_MAP), ...Object.values(NEW_LINKS), ...Object.values(KIDS_LINKS), ...ADD_MASTER];
  for (const id of new Set(allIds)) if (!byId.has(id)) throw new Error(`Atleta ${id} não existe no banco`);

  // ---------------------------------------------------------------- 1. Mesclas
  console.log("=== 1. Mescla de cadastros duplicados ===");
  for (const m of MERGES) {
    const keep = byId.get(m.keep);
    const drop = byId.get(m.drop);
    if (!drop) {
      console.log(`${m.label}: cadastro ${m.drop} já não existe (mescla feita antes)`);
      continue;
    }
    if (!keep?.active || drop.active) throw new Error(`${m.label}: esperado ${m.keep} ativo e ${m.drop} inativo`);

    const [c] = await sql`
      SELECT
        (SELECT count(*)::int FROM game_lineups WHERE athlete_id = ${m.drop}) AS lineups,
        (SELECT count(*)::int FROM game_lineups d JOIN game_lineups k ON k.game_id = d.game_id AND k.athlete_id = ${m.keep} WHERE d.athlete_id = ${m.drop}) AS lineups_conflito,
        (SELECT count(*)::int FROM game_stats WHERE athlete_id = ${m.drop}) AS stats,
        (SELECT count(*)::int FROM game_stats d JOIN game_stats k ON k.game_id = d.game_id AND k.athlete_id = ${m.keep} WHERE d.athlete_id = ${m.drop}) AS stats_conflito,
        (SELECT count(*)::int FROM games WHERE mvp_athlete_id = ${m.drop}) AS mvp,
        (SELECT count(*)::int FROM notifications WHERE athlete_id = ${m.drop}) AS notif
    `;
    const years = await sql`
      SELECT extract(year FROM g.game_date)::int AS ano, count(*)::int AS n
      FROM game_lineups l JOIN games g ON g.id = l.game_id WHERE l.athlete_id = ${m.drop} GROUP BY 1 ORDER BY 1
    `;
    console.log(
      `${m.label}: manter ${m.keep} (ativo), apagar ${m.drop} (inativo). ` +
        `Escalação: ${c.lineups} linha(s) movida(s)${c.lineups_conflito ? `, ${c.lineups_conflito} no mesmo jogo (descartada)` : ""}; ` +
        `boletim: ${c.stats} linha(s)${c.stats_conflito ? `, ${c.stats_conflito} somada(s)` : ""}; ` +
        `MVP: ${c.mvp}; notificações: ${c.notif}. ` +
        `Jogos por ano: ${years.map((y) => `${y.ano}: ${y.n}`).join(", ") || "nenhum"}`
    );
    const diffs = [];
    for (const f of ["teams", "entry_date", "number", "birth_date"]) {
      const a = JSON.stringify(keep[f]);
      const b = JSON.stringify(drop[f]);
      if (a !== b) diffs.push(`${f}: fica ${a} (o ${m.drop} tinha ${b})`);
    }
    if (diffs.length) console.log(`  diferenças (fica o cadastro ${m.keep}): ${diffs.join("; ")}`);

    if (APPLY) {
      const sum = (col) => `${col} = k.${col} + d.${col}`;
      await sql.transaction([
        sql.query(
          `UPDATE game_stats k SET ${STAT_COLUMNS.map(sum).join(", ")}
           FROM game_stats d WHERE k.athlete_id = $1 AND d.athlete_id = $2 AND k.game_id = d.game_id`,
          [m.keep, m.drop]
        ),
        sql`DELETE FROM game_stats d USING game_stats k WHERE d.athlete_id = ${m.drop} AND k.athlete_id = ${m.keep} AND k.game_id = d.game_id`,
        sql`UPDATE game_stats SET athlete_id = ${m.keep} WHERE athlete_id = ${m.drop}`,
        sql`DELETE FROM game_lineups d USING game_lineups k WHERE d.athlete_id = ${m.drop} AND k.athlete_id = ${m.keep} AND k.game_id = d.game_id`,
        sql`UPDATE game_lineups SET athlete_id = ${m.keep} WHERE athlete_id = ${m.drop}`,
        sql`UPDATE games SET mvp_athlete_id = ${m.keep} WHERE mvp_athlete_id = ${m.drop}`,
        sql`DELETE FROM notifications d USING notifications k WHERE d.athlete_id = ${m.drop} AND k.athlete_id = ${m.keep} AND k.game_id = d.game_id AND k.stat_type = d.stat_type`,
        sql`UPDATE notifications SET athlete_id = ${m.keep} WHERE athlete_id = ${m.drop}`,
        sql`DELETE FROM athletes WHERE id = ${m.drop}`,
      ]);
      console.log(`  ✓ mesclado`);
    }
  }

  // ------------------------------------------------------------ 2. Categorias
  console.log("\n=== 2. Categorias (inclusão, nada é removido) ===");
  const kidsGames = data.games.filter((g) => g.team_sugerido === KIDS_TEAM);
  const kidsMap = { ...BASE_MAP, ...KIDS_LINKS };
  const kidsIds = new Set(kidsGames.flatMap((g) => (g.atletas_nos ?? []).map((p) => kidsMap[p.atleta]).filter(Boolean)));
  const additions = [
    ...ADD_MASTER.map((id) => [id, "master"]),
    ...[...kidsIds].map((id) => [id, KIDS_TEAM]),
  ];
  let teamChanges = 0;
  for (const [id, team] of additions) {
    const a = byId.get(id);
    if (a.teams.includes(team)) continue;
    teamChanges += 1;
    console.log(`  + ${team}: ${label(id)} (hoje ${a.teams.join("/")})`);
    if (APPLY) await sql`UPDATE athletes SET teams = array_append(teams, ${team}) WHERE id = ${id} AND NOT (${team} = ANY(teams))`;
  }
  if (!teamChanges) console.log("  nada a mudar");

  // ----------------------------------------- 3. Vínculos nos 17 jogos já importados
  console.log("\n=== 3. Atletas vinculados nos jogos já importados ===");
  const fullMap = { ...BASE_MAP, ...NEW_LINKS };
  const newNames = new Set(Object.keys(NEW_LINKS));
  const champIds = new Map();
  const champId = async (name) => {
    if (!champIds.has(name)) champIds.set(name, await getOrCreateChampionship(name));
    return champIds.get(name);
  };
  let linkRows = 0;
  let mvpSet = 0;
  const outOfTeam = new Map();
  const gameIdByKey = new Map();

  for (const g of data.games.filter((x) => x.team_sugerido === "adulto" || x.team_sugerido === "master")) {
    const tag = `[${g.team_sugerido}] ${g.campeonato} #${g.jogo_numero} vs ${g.adversario}`;
    const champ = await champId(g.campeonato);
    const game = await findGame(g.team_sugerido, champ.id, g.adversario, g.campeonato, g.jogo_numero, g.data);
    if (!game) throw new Error(`${tag}: jogo não encontrado no banco`);
    gameIdByKey.set(`${g.campeonato}#${g.jogo_numero}`, game);

    const existing = new Set((await sql`SELECT athlete_id FROM game_stats WHERE game_id = ${game.id}`).map((r) => r.athlete_id));
    const rows = aggregateByAthlete(
      (g.atletas_nos ?? []).filter((p) => fullMap[p.atleta]).map((p) => ({ ...p, athleteId: fullMap[p.atleta] }))
    ).filter((r) => r.sources.some((s) => newNames.has(s)));

    const parts = [];
    for (const r of rows) {
      if (existing.has(r.athleteId)) {
        const already = r.sources.every((s) => newNames.has(s));
        parts.push(already ? `${r.sources.join("+")} → ${label(r.athleteId)} já vinculado` : `⚠ ${r.sources.join("+")} → ${label(r.athleteId)}: atleta já tem boletim no jogo, PULADO`);
        continue;
      }
      parts.push(`${r.sources.join("+")} → ${label(r.athleteId)} (${points(r)} pts)`);
      linkRows += 1;
      const a = byId.get(r.athleteId);
      if (!a.teams.includes(g.team_sugerido) && !(g.team_sugerido === "master" && ADD_MASTER.includes(r.athleteId))) {
        const k = `${label(r.athleteId)} (hoje ${a.teams.join("/")}) em jogo ${g.team_sugerido}`;
        outOfTeam.set(k, (outOfTeam.get(k) ?? 0) + 1);
      }
      if (APPLY) {
        await sql`INSERT INTO game_lineups (game_id, athlete_id) VALUES (${game.id}, ${r.athleteId}) ON CONFLICT DO NOTHING`;
        await insertStatsQuery(game.id, r);
      }
    }

    let mvpNote = "";
    const mvpId = g.mvp_sugerido ? fullMap[g.mvp_sugerido] : null;
    if (!game.mvp_athlete_id && mvpId) {
      mvpNote = `; MVP ${g.mvp_sugerido} → ${label(mvpId)}`;
      mvpSet += 1;
      if (APPLY) await sql`UPDATE games SET mvp_athlete_id = ${mvpId} WHERE id = ${game.id} AND mvp_athlete_id IS NULL`;
    }
    const left = (g.atletas_nos ?? []).filter((p) => !fullMap[p.atleta]).map((p) => p.atleta);
    if (parts.length || mvpNote) {
      console.log(`${tag} (id ${game.id}): ${parts.join(", ") || "nenhum vínculo"}${mvpNote}${left.length ? `; fora: ${left.join(", ")}` : ""}`);
    }
  }
  console.log(`Total: ${linkRows} atleta(s) vinculado(s) (escalação + boletim), ${mvpSet} MVP(s) preenchido(s)`);
  if (outOfTeam.size) {
    console.log("Vinculados fora da categoria do jogo (gravado mesmo assim, ver P-06):");
    for (const [k, n] of outOfTeam) console.log(`  - ${k}: ${n} jogo(s)`);
  }

  // ------------------------------------------------------- 4. Jogos do Kids
  console.log(`\n=== 4. Jogos do Kids → categoria ${KIDS_TEAM} ===`);
  let kidsCreated = 0;
  for (const g of kidsGames) {
    const champ = await champId(g.campeonato);
    const tag = `[${KIDS_TEAM}] ${g.campeonato} #${g.jogo_numero} ${g.data} vs ${g.adversario}`;
    const existing = await findGame(KIDS_TEAM, champ.id, g.adversario, g.campeonato, g.jogo_numero, g.data);
    if (existing) {
      console.log(`${tag}: já existe (id ${existing.id}), pulando`);
      continue;
    }
    const mapped = aggregateByAthlete(
      (g.atletas_nos ?? []).filter((p) => kidsMap[p.atleta]).map((p) => ({ ...p, athleteId: kidsMap[p.atleta] }))
    );
    const left = (g.atletas_nos ?? []).filter((p) => !kidsMap[p.atleta]).map((p) => `${p.atleta} (${points(p)} pts)`);
    const mvpId = g.mvp_sugerido ? kidsMap[g.mvp_sugerido] ?? null : null;
    const opp = sumOpponentTotals(g.atletas_adver);
    const ourMapped = mapped.reduce((s, p) => s + points(p), 0);
    console.log(
      `${tag} (${champ.name}${champ.isNew ? ", campeonato NOVO" : ""}): placar ${g.placar_final.nos}x${g.placar_final.adver}, ` +
        `${mapped.length} atletas com ${ourMapped} pts: ${mapped.map((p) => `${p.sources.join("+")} → ${label(p.athleteId)}`).join(", ")}` +
        `${left.length ? `; fora: ${left.join(", ")}` : ""}; MVP ${mvpId ? label(mvpId) : `vazio (sugerido ${g.mvp_sugerido})`}`
    );
    kidsCreated += 1;
    if (!APPLY) continue;

    const q = g.boletim;
    const [row] = await sql`
      INSERT INTO games (
        team, championship_id, opponent, game_date, game_time, status,
        our_score, their_score,
        q1_our_score, q1_their_score, q2_our_score, q2_their_score,
        q3_our_score, q3_their_score, q4_our_score, q4_their_score,
        ot_our_score, ot_their_score, mvp_athlete_id,
        opp_rebounds_off, opp_rebounds_def, opp_assists, opp_steals, opp_blocks,
        opp_turnovers, opp_fouls, opp_fg2_made, opp_fg2_attempted,
        opp_fg3_made, opp_fg3_attempted, opp_ft_made, opp_ft_attempted
      ) VALUES (
        ${KIDS_TEAM}, ${champ.id}, ${g.adversario}, ${g.data}, ${GAME_TIME}, 'realizado',
        ${g.placar_final.nos}, ${g.placar_final.adver},
        ${q.q1.nos}, ${q.q1.adver}, ${q.q2.nos}, ${q.q2.adver},
        ${q.q3.nos}, ${q.q3.adver}, ${q.q4.nos}, ${q.q4.adver},
        ${q.prorrogacao?.nos ?? null}, ${q.prorrogacao?.adver ?? null}, ${mvpId},
        ${opp?.rebOff ?? null}, ${opp?.rebDef ?? null}, ${opp?.ast ?? null}, ${opp?.roubos ?? null}, ${opp?.toco ?? null},
        ${opp?.erros ?? null}, ${opp?.faltas ?? null}, ${opp?.pt2_c ?? null}, ${opp?.pt2_t ?? null},
        ${opp?.pt3_c ?? null}, ${opp?.pt3_t ?? null}, ${opp?.ll_c ?? null}, ${opp?.ll_t ?? null}
      )
      RETURNING id
    `;
    for (const p of mapped) {
      await sql`INSERT INTO game_lineups (game_id, athlete_id) VALUES (${row.id}, ${p.athleteId}) ON CONFLICT DO NOTHING`;
      await insertStatsQuery(row.id, p);
    }
    console.log(`  ✓ criado (id ${row.id})`);
  }
  console.log(`Jogos do Kids ${APPLY ? "criados" : "a criar"}: ${kidsCreated}`);

  // ------------------------------------------------- 5. Circuito Master #3
  console.log("\n=== 5. Circuito Master #3: quartos e prorrogação ===");
  {
    const game = gameIdByKey.get(`${CIRCUITO_3.campeonato}#${CIRCUITO_3.jogo}`);
    const [cur] = await sql`SELECT * FROM games WHERE id = ${game.id}`;
    const [q1, q2, q3, q4] = CIRCUITO_3.q;
    const [otN, otA] = CIRCUITO_3.ot;
    const nos = q1[0] + q2[0] + q3[0] + q4[0] + otN;
    const adv = q1[1] + q2[1] + q3[1] + q4[1] + otA;
    if (nos !== cur.our_score || adv !== cur.their_score) throw new Error(`Circuito #3: quartos somam ${nos}x${adv}, placar ${cur.our_score}x${cur.their_score}`);
    const now = `${cur.q1_our_score}x${cur.q1_their_score}, ${cur.q2_our_score}x${cur.q2_their_score}, ${cur.q3_our_score}x${cur.q3_their_score}, ${cur.q4_our_score}x${cur.q4_their_score}, prorrogação ${cur.ot_our_score ?? "-"}x${cur.ot_their_score ?? "-"}`;
    console.log(`Jogo ${game.id}: hoje ${now} → ${CIRCUITO_3.q.map(([a, b]) => `${a}x${b}`).join(", ")}, prorrogação ${otN}x${otA} (soma ${nos}x${adv} = placar)`);
    if (APPLY) {
      await sql`
        UPDATE games SET
          q1_our_score = ${q1[0]}, q1_their_score = ${q1[1]}, q2_our_score = ${q2[0]}, q2_their_score = ${q2[1]},
          q3_our_score = ${q3[0]}, q3_their_score = ${q3[1]}, q4_our_score = ${q4[0]}, q4_their_score = ${q4[1]},
          ot_our_score = ${otN}, ot_their_score = ${otA}
        WHERE id = ${game.id}
      `;
    }
  }

  // ---------------------------------------------------------------- 6. Datas
  console.log("\n=== 6. Datas (fictícias) ===");
  let dateChanges = 0;
  for (const g of data.games.filter((x) => x.team_sugerido === "adulto" || x.team_sugerido === "master")) {
    const change = DATE_CHANGES[g.campeonato]?.[g.jogo_numero];
    if (!change) continue;
    const game = gameIdByKey.get(`${g.campeonato}#${g.jogo_numero}`);
    const [from, to] = change;
    if (g.data !== to) throw new Error(`${g.campeonato} #${g.jogo_numero}: JSON com data ${g.data}, esperado ${to}`);
    if (fmt(game.game_date) === to) continue;
    dateChanges += 1;
    console.log(`[${g.team_sugerido}] ${g.campeonato} #${g.jogo_numero} vs ${g.adversario} (id ${game.id}): ${from} → ${to}`);
    if (APPLY) await sql`UPDATE games SET game_date = ${to} WHERE id = ${game.id}`;
  }
  console.log(`Datas ${APPLY ? "alteradas" : "a alterar"}: ${dateChanges} (os jogos do Kids entram já com a data nova)`);

  console.log("\n=== Fora ===");
  for (const [nome, motivo] of Object.entries(LEFT_OUT)) console.log(`  - ${nome}: ${motivo}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
