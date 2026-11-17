// One-off import of docs/ultimate_basketball_2020.json (jogos, boletim e
// escalação de 2020, extraídos da planilha do técnico) para o Neon Postgres.
//
// Uso:
//   node scripts/import-games-2020.mjs            (dry-run, não grava nada)
//   node scripts/import-games-2020.mjs --apply     (grava de verdade)
//
// Idempotente: cada jogo é identificado por (team, championship_id, opponent,
// game_date) e pulado se já existir; lineup/stats usam ON CONFLICT DO NOTHING.
// Mesmo padrão de scripts/import-games-2019.mjs (ver ADR-0008).
//
// Diferenças em relação a 2019:
// - Categoria por jogo, vinda de `team_sugerido` (não há TEAM_ID fixo):
//   "Adulto" → `adulto`, "30+" → `master` (P-22). Jogos com
//   `team_sugerido: null` (elenco "Kids", 4 jogos) NÃO são importados: o Kids
//   ainda não tem categoria no sistema (P-22, aguardando técnico).
// - Rebotes vêm separados (`reb_d`, `reb_o`) em todos os jogos; o fallback
//   "tudo defensivo" de `rebounds()` não é usado aqui.
// - Totais do adversário = soma de `atletas_adver` (`sumOpponentTotals`).
// - Placar gravado = `placar_final` (Scoutt Geral), mesmo nos 3 jogos em que a
//   soma do boletim do adversário difere 1 ponto (Férias Cup #2, Copa América
//   #6 e #7). Isso diverge da ADR-0011 ("placar oficial = soma do boletim"):
//   ponto aberto, listado em docs/recados-tecnico.md. Quartos gravados como
//   estão na planilha, mesmo no Circuito Master #3, onde somam 49x49 contra o
//   final 66x58.
//
// Mapeamento de nomes (2026-11-16):
// - Base: PLAYER_MAP de 2019 + Hugo (id 27, vinculado no round 3 de 2019).
// - Grafias novas de 2020 do mesmo atleta: "Cyro" (46), "Thithi" (24),
//   "Lazaro" (50), "Léo Libório" (49).
// - Cadastros criados depois de 2019, com apelido idêntico e único no banco e
//   categoria coerente com o jogo: "Paulo" = PAULO ROBERTO DA SILVA (54),
//   "Lebron" = EDUARDO CAVALCANTE DE OLIVEIRA (55), "Totó" = ANTÔNIO CARLOS DE
//   ABREU (56). ⚠ conferir antes do --apply.
// - "Rafa" (id 26 em 2019) foi RETIRADO para 2020: o JSON indica que o "Rafa"
//   do 30+ na Copa América é o "Rafa Pivante" (id 59), e o dos amistosos é o
//   Rafa Paludo (id 26). Fica de fora até confirmar.
// - Nomes ambíguos ou sem cadastro ficam de fora (ADR-0008) e aparecem no
//   resumo do dry-run com o candidato, quando há: ver CANDIDATOS_PENDENTES.

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
const TEAM_LABEL = { adulto: "Adulto", master: "Master (30+)" };

// PLAYER_MAP de 2019 (scripts/import-games-2019.mjs) + Hugo.
const PLAYER_MAP_2019 = {
  "Apollo": 31,
  "Big Davi": 36,
  "Chico": 34,
  "Ciro": 46,
  "Claudinei": 45,
  "Dalton": 37,
  "Guilherme": 52,
  "Hugo": 27,
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

// Nomes de 2019 que NÃO valem para 2020 sem confirmação.
const RETIRADOS_2020 = ["Rafa"];

const PLAYER_MAP = {
  ...Object.fromEntries(Object.entries(PLAYER_MAP_2019).filter(([k]) => !RETIRADOS_2020.includes(k))),
  // Grafias de 2020 de atletas já mapeados em 2019.
  "Cyro": 46,
  "Thithi": 24,
  "Lazaro": 50,
  "Léo Libório": 49,
  // Cadastros novos com apelido idêntico e único (⚠ conferir).
  "Paulo": 54,
  "Lebron": 55,
  "Totó": 56,
};

// Só informativo: candidatos encontrados no banco para nomes que ficam de fora
// até a confirmação. NÃO são usados no import.
const CANDIDATOS_PENDENTES = {
  "Rafa": "Rafa Paludo (26) nos amistosos ou Rafa Pivante (59) na Copa América 30+?",
  "Rafa Doncic": "atleta novo ou Rafa Pivante (59)?",
  "Gui": "Guigas (52 inativo / 53 ativo, cadastro duplicado) ou Widal (7)?",
  "Big": "Davi Budib (36, \"Big Davi\" em 2019)? Em 2019 \"Big\" sozinho não foi confirmado",
  "Jp": "João Grabalos (6)? O JSON junta Jp e João; em 2020 os dois nunca jogam juntos",
  "Jonatas": "Jhonatan (43)?",
  "Léo": "Leonardo Stival (47, adulto+master)? Em 2019 \"Léo\" não foi confirmado",
  "Fabinho": "Fabio Seixas \"FABINHO\" (75)? Cadastro é cg-city/nível 3, nascido em 2001; jogou no 30+",
  "Thiago": "sem candidato claro (o único Thiago é Segóvia, 58, que joga no Kids)",
  "Marcius": "sem cadastro",
  "Rodrigo": "sem cadastro",
  "Negão": "sem cadastro (apelido)",
};

const STAT_FIELDS = ["ll_t", "ll_c", "pt2_t", "pt2_c", "pt3_t", "pt3_c", "ast", "toco", "erros", "roubos", "faltas"];

function rebounds(row) {
  return { off: row.reb_o ?? 0, def: row.reb_d ?? 0 };
}

function points(row) {
  return (row.ll_c ?? 0) + 2 * (row.pt2_c ?? 0) + 3 * (row.pt3_c ?? 0);
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
  const totals = { rebOff: 0, rebDef: 0, ast: 0, toco: 0, erros: 0, roubos: 0, faltas: 0, pt2_t: 0, pt2_c: 0, pt3_t: 0, pt3_c: 0, ll_t: 0, ll_c: 0, pts: 0 };
  for (const p of atletasAdver) {
    const reb = rebounds(p);
    totals.rebOff += reb.off;
    totals.rebDef += reb.def;
    totals.pts += points(p);
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
  for (const c of cache.values()) existingIds.add(c.id);
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

const sumQuarters = (q, side) => q.q1[side] + q.q2[side] + q.q3[side] + q.q4[side];

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "ultimate_basketball_2020.json"), "utf8"));
  const importable = data.games.filter((g) => g.team_sugerido);
  const leftOut = data.games.filter((g) => !g.team_sugerido);

  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}`);
  console.log(`Jogos no arquivo: ${data.games.length} (${importable.length} com categoria, ${leftOut.length} sem categoria ficam de fora)\n`);

  // Cadastro atual dos atletas mapeados (para validar id e avisar categoria).
  const athleteRows = await sql`SELECT id, name, nickname, teams, active FROM athletes`;
  const athletesById = new Map(athleteRows.map((a) => [a.id, a]));
  for (const [nome, id] of Object.entries(PLAYER_MAP)) {
    if (!athletesById.has(id)) throw new Error(`PLAYER_MAP["${nome}"] = ${id}, mas esse atleta não existe no banco`);
  }

  const champCache = new Map();
  const unmappedTotal = new Map(); // nome -> nº de jogos
  const unresolvedMvpGames = [];
  const scoreNotes = [];
  const outOfTeam = new Map(); // "nome (id) → team" -> nº de jogos
  const perTeam = new Map();
  let created = 0;
  let wouldCreate = 0;
  let skippedExisting = 0;

  for (const g of importable) {
    const team = g.team_sugerido;
    const champ = await getOrCreateChampionship(g.campeonato, champCache);
    const gameDate = g.data;
    const tag = `[${team}] ${g.campeonato} #${g.jogo_numero}`;

    const existing = await sql`
      SELECT id FROM games
      WHERE team = ${team} AND championship_id = ${champ.id}
        AND opponent = ${g.adversario} AND game_date = ${gameDate}
    `;
    if (existing.length > 0) {
      console.log(`${tag} já existe (id ${existing[0].id}), pulando`);
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
        unmapped.push(`${p.atleta} (${points(p)} pts)`);
        unmappedTotal.set(p.atleta, (unmappedTotal.get(p.atleta) ?? 0) + 1);
      }
    }
    const mapped = aggregateByAthlete(rawMapped);
    const mergedNote = mapped
      .filter((m) => m.sources.length > 1)
      .map((m) => `${m.sources.join("+")}→atleta ${m.athleteId}`)
      .join("; ");

    for (const m of mapped) {
      const a = athletesById.get(m.athleteId);
      if (!a.teams.includes(team)) {
        const key = `${m.sources[0]} = ${a.nickname ?? a.name} (${a.id}, hoje em ${a.teams.join("/")}) num jogo ${team}`;
        outOfTeam.set(key, (outOfTeam.get(key) ?? 0) + 1);
      }
    }

    const mvpAthleteId = g.mvp_sugerido ? PLAYER_MAP[g.mvp_sugerido] ?? null : null;
    if (g.mvp_sugerido && !mvpAthleteId) {
      unresolvedMvpGames.push(`${tag} (MVP sugerido: ${g.mvp_sugerido})`);
    }

    const ourBoletim = (g.atletas_nos ?? []).reduce((s, p) => s + points(p), 0);
    const ourMapped = mapped.reduce((s, p) => s + points(p), 0);
    const notes = [];
    if (ourBoletim !== g.placar_final.nos) notes.push(`boletim nosso soma ${ourBoletim}`);
    if (opp && opp.pts !== g.placar_final.adver) notes.push(`boletim adversário soma ${opp.pts}`);
    const qNos = sumQuarters(q, "nos");
    const qAdv = sumQuarters(q, "adver");
    if (qNos !== g.placar_final.nos || qAdv !== g.placar_final.adver) notes.push(`quartos somam ${qNos}x${qAdv}`);
    if (notes.length) scoreNotes.push(`${tag}: placar gravado ${g.placar_final.nos}x${g.placar_final.adver}; ${notes.join("; ")}`);

    perTeam.set(team, (perTeam.get(team) ?? 0) + 1);
    wouldCreate += 1;

    console.log(
      `${tag} ${gameDate}${g.data_ficticia ? " (data fictícia)" : ""} vs ${g.adversario} ` +
        `(${champ.name}${champ.isNew ? ", campeonato NOVO" : ""}): placar ${g.placar_final.nos}x${g.placar_final.adver}, ` +
        `${mapped.length} atleta(s) mapeado(s) com ${ourMapped} de ${ourBoletim} pts, ` +
        `${unmapped.length} sem cadastro${unmapped.length ? ": " + unmapped.join(", ") : ""}` +
        `${mergedNote ? ` [somado: ${mergedNote}]` : ""}` +
        `, MVP ${mvpAthleteId ? `${g.mvp_sugerido} (${mvpAthleteId})` : `vazio (sugerido ${g.mvp_sugerido})`}`
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
        ${team}, ${champ.id}, ${g.adversario}, ${gameDate}, ${GAME_TIME}, 'realizado',
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
  console.log(`Jogos ${APPLY ? "criados" : "que seriam criados"}: ${APPLY ? created : wouldCreate}`);
  for (const [team, n] of perTeam) console.log(`  - ${TEAM_LABEL[team] ?? team}: ${n}`);
  console.log(`Jogos já existentes (pulados): ${skippedExisting}`);

  const newChamps = [...champCache.values()].filter((c) => c.isNew);
  console.log(`Campeonatos novos: ${newChamps.length ? newChamps.map((c) => `${c.name} (id ${c.id})`).join(", ") : "nenhum"}`);
  const reused = [...champCache.values()].filter((c) => !c.isNew);
  if (reused.length) console.log(`Campeonatos já existentes (reaproveitados): ${reused.map((c) => c.name).join(", ")}`);

  console.log(`\nJogos sem categoria, NÃO importados (${leftOut.length}):`);
  for (const g of leftOut) {
    console.log(`  - ${g.campeonato} #${g.jogo_numero} (${g.categoria_planilha}) ${g.data} vs ${g.adversario}, ${g.placar_final.nos}x${g.placar_final.adver}`);
  }

  console.log("\nNomes sem cadastro ou não confirmados (estatísticas NÃO importadas):");
  for (const [nome, n] of [...unmappedTotal].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  - ${nome}: ${n} jogo(s)${CANDIDATOS_PENDENTES[nome] ? `, ${CANDIDATOS_PENDENTES[nome]}` : ""}`);
  }

  if (unresolvedMvpGames.length) {
    console.log(`\nMVP sugerido sem atleta mapeado (mvp_athlete_id fica vazio):\n  - ${unresolvedMvpGames.join("\n  - ")}`);
  }
  if (scoreNotes.length) {
    console.log(`\nPlacares com divergência na planilha:\n  - ${scoreNotes.join("\n  - ")}`);
  }
  if (outOfTeam.size) {
    console.log("\nAtletas mapeados que hoje não estão na categoria do jogo (o import grava mesmo assim; a tela pode recusar editar, ver P-06):");
    for (const [k, n] of outOfTeam) console.log(`  - ${k}: ${n} jogo(s)`);
  }
}

main().then(() => process.exit(0));
