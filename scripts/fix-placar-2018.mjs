// Ajuste único do placar oficial dos jogos de 2018 (ADR-0011): o placar
// gravado passa a ser a soma do boletim completo da planilha do técnico
// (`placar_boletim_ultimate` / `placar_boletim_adversario` em
// docs/games_2018.json). Só `our_score`/`their_score` são alterados.
//
// Uso:
//   node scripts/fix-placar-2018.mjs            (dry-run, não grava nada)
//   node scripts/fix-placar-2018.mjs --apply     (grava de verdade)
//
// Idempotente: cada jogo é localizado pela chave da ADR-0008
// (team, championshipId, opponent, gameDate) e só é atualizado se o placar
// gravado ainda diferir do boletim.

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

// Carrega .env.local manualmente (mesmo padrão de import-games-2018.mjs).
const envPath = path.join(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const sql = neon(process.env.DATABASE_URL);

const TEAM_ID = "adulto";
// Mesma data fictícia usada na importação para jogos sem data na planilha.
const DEFAULT_DATE = "2018-01-01";

// Campeonatos renomeados no sistema depois da importação: nome na planilha →
// nome atual no banco.
const CHAMPIONSHIP_ALIASES = {
  "jogos abertos cg": "jogos abertos",
};

function result(our, their) {
  if (our > their) return "vitória";
  if (our < their) return "derrota";
  return "empate";
}

async function main() {
  const games = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "docs", "games_2018.json"), "utf8")
  );

  console.log(`Modo: ${APPLY ? "APPLY (gravando no banco)" : "DRY-RUN (nada será gravado)"}`);
  console.log(`Total de jogos no arquivo: ${games.length}\n`);

  let toFix = 0;
  let unchanged = 0;
  const notFound = [];

  for (const g of games) {
    const gameDate = g.data ?? DEFAULT_DATE;
    const label = `[jogo ${g.game_number}] ${gameDate} ${g.campeonato} vs ${g.adversario}`;
    const champKey = g.campeonato.trim().toLowerCase();
    const champName = CHAMPIONSHIP_ALIASES[champKey] ?? champKey;

    const rows = await sql`
      SELECT g.id, g.our_score, g.their_score
      FROM games g
      JOIN championships c ON c.id = g.championship_id
      WHERE g.team = ${TEAM_ID} AND lower(c.name) = ${champName}
        AND g.opponent = ${g.adversario} AND g.game_date = ${gameDate}
    `;
    if (rows.length !== 1) {
      notFound.push(`${label} (${rows.length === 0 ? "não encontrado" : `${rows.length} jogos com a mesma chave`})`);
      continue;
    }

    const row = rows[0];
    const newOur = g.placar_boletim_ultimate;
    const newTheir = g.placar_boletim_adversario;
    if (row.our_score === newOur && row.their_score === newTheir) {
      unchanged += 1;
      continue;
    }

    toFix += 1;
    const before = result(row.our_score, row.their_score);
    const after = result(newOur, newTheir);
    console.log(
      `${label} (id ${row.id}): ${row.our_score}x${row.their_score} → ${newOur}x${newTheir}` +
        (before !== after ? `  ⚠ resultado muda: ${before} → ${after}` : "")
    );

    if (APPLY) {
      await sql`
        UPDATE games SET our_score = ${newOur}, their_score = ${newTheir}
        WHERE id = ${row.id}
      `;
    }
  }

  console.log("\n--- Resumo ---");
  if (toFix === 0) console.log("Nada a alterar: todos os placares já conferem com o boletim.");
  else console.log(`Jogos ${APPLY ? "atualizados" : "que seriam atualizados"}: ${toFix}`);
  console.log(`Jogos já corretos: ${unchanged}`);
  if (notFound.length) {
    console.log(`⚠ Jogos não localizados (${notFound.length}):`);
    for (const n of notFound) console.log(`  ${n}`);
  }

  const [{ total }] = await sql`
    SELECT coalesce(sum(our_score), 0)::int AS total FROM games
    WHERE team = ${TEAM_ID} AND status = 'realizado'
      AND game_date >= '2018-01-01' AND game_date <= '2018-12-31'
  `;
  console.log(`Soma atual dos placares do Ultimate em 2018 (banco): ${total}` + (APPLY ? "" : " (antes do --apply)"));
}

main().then(() => process.exit(0));
