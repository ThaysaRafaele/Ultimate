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

// Calendar years with at least one realized game, newest first, minus the
// hidden ones.
export function availableYears(gameDates: readonly string[]): number[] {
  const years = new Set(gameDates.map((d) => Number(d.slice(0, 4))));
  return [...years].filter((y) => !HIDDEN_YEARS.includes(y)).sort((a, b) => b - a);
}
