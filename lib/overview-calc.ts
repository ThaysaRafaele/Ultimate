// Pure math for the "Visão geral" (annual summary) screen. No `@/lib/db`
// import here on purpose, same as stats-calc.ts. Counting rules: ADR-0011.

export type GameResult = "vitoria" | "derrota" | "empate";

export type ScoredGame = {
  gameDate: string;
  ourScore: number | null;
  theirScore: number | null;
};

export type GamesSummary = {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  // Realized games saved without a final score: shown apart, never counted
  // as a result or as zero points.
  withoutScore: number;
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  avgFor: number;
  avgAgainst: number;
  balance: number;
};

// Years the coach hasn't filled in yet stay out of the overview. Remove 2026
// from here once the coach starts entering that season (ADR-0011).
export const HIDDEN_YEARS: readonly number[] = [2026];

export function gameResult(our: number, their: number): GameResult {
  if (our > their) return "vitoria";
  if (our < their) return "derrota";
  return "empate";
}

function hasScore(g: ScoredGame): g is ScoredGame & { ourScore: number; theirScore: number } {
  return g.ourScore != null && g.theirScore != null;
}

export function summarizeGames(games: readonly ScoredGame[]): GamesSummary {
  const scored = games.filter(hasScore);
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const g of scored) {
    const result = gameResult(g.ourScore, g.theirScore);
    if (result === "vitoria") wins += 1;
    else if (result === "derrota") losses += 1;
    else draws += 1;
    pointsFor += g.ourScore;
    pointsAgainst += g.theirScore;
  }

  const played = scored.length;
  return {
    played,
    wins,
    losses,
    draws,
    withoutScore: games.length - played,
    winRate: played > 0 ? wins / played : 0,
    pointsFor,
    pointsAgainst,
    avgFor: played > 0 ? pointsFor / played : 0,
    avgAgainst: played > 0 ? pointsAgainst / played : 0,
    balance: pointsFor - pointsAgainst,
  };
}

export const QUARTERS = ["q1", "q2", "q3", "q4", "ot"] as const;
export type Quarter = (typeof QUARTERS)[number];

export type QuarterGame = ScoredGame & {
  championshipName: string | null;
  q1OurScore: number | null;
  q1TheirScore: number | null;
  q2OurScore: number | null;
  q2TheirScore: number | null;
  q3OurScore: number | null;
  q3TheirScore: number | null;
  q4OurScore: number | null;
  q4TheirScore: number | null;
  otOurScore: number | null;
  otTheirScore: number | null;
};

export type QuarterLine = { our: number; their: number; games: number };

export type ChampionshipGroup<G extends QuarterGame> = {
  name: string;
  games: G[];
  summary: GamesSummary;
  // Totals per quarter only over games where that quarter was filled in, so a
  // game without the quarter breakdown doesn't drag the averages down.
  quarterTotals: Record<Quarter, QuarterLine>;
  hasOvertime: boolean;
};

export const NO_CHAMPIONSHIP = "Sem campeonato";

export function quarterScore(g: QuarterGame, q: Quarter): { our: number; their: number } | null {
  const our = g[`${q}OurScore`];
  const their = g[`${q}TheirScore`];
  return our != null && their != null ? { our, their } : null;
}

// Same grouping as the coach's "Scoutt Geral": one block per championship,
// blocks ordered by their first game, games by date inside each block.
export function groupByChampionship<G extends QuarterGame>(games: readonly G[]): ChampionshipGroup<G>[] {
  const byName = new Map<string, G[]>();
  for (const g of [...games].sort((a, b) => a.gameDate.localeCompare(b.gameDate))) {
    const name = g.championshipName?.trim() || NO_CHAMPIONSHIP;
    const list = byName.get(name);
    if (list) list.push(g);
    else byName.set(name, [g]);
  }

  return [...byName.entries()].map(([name, list]) => {
    const quarterTotals = Object.fromEntries(
      QUARTERS.map((q) => [q, { our: 0, their: 0, games: 0 }])
    ) as Record<Quarter, QuarterLine>;
    for (const g of list) {
      for (const q of QUARTERS) {
        const score = quarterScore(g, q);
        if (!score) continue;
        quarterTotals[q].our += score.our;
        quarterTotals[q].their += score.their;
        quarterTotals[q].games += 1;
      }
    }
    return {
      name,
      games: list,
      summary: summarizeGames(list),
      quarterTotals,
      hasOvertime: quarterTotals.ot.games > 0,
    };
  });
}

// Calendar years with at least one realized game, newest first, minus the
// hidden ones.
export function availableYears(gameDates: readonly string[]): number[] {
  const years = new Set(gameDates.map((d) => Number(d.slice(0, 4))));
  return [...years].filter((y) => !HIDDEN_YEARS.includes(y)).sort((a, b) => b - a);
}
