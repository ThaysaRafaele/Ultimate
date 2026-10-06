import { othersPoints, summarizeByYear, summarizeGames, summarizePlayers } from "@/lib/overview-calc";
import { getPlayerStatsForYear, getRealizedGames } from "@/lib/overview-repo";

// Everything the "Visão geral" shows for one category (null = all) and one
// year (null = "Resumo geral"). Shared by the page and the Excel export so the
// file always has the same numbers as the screen.
export async function loadOverview(teamFilter: string | null, year: number | null) {
  const [games, playerRows] = await Promise.all([
    getRealizedGames(teamFilter, year),
    getPlayerStatsForYear(teamFilter, year),
  ]);
  const byYear = summarizeByYear(games);
  const summary = year === null ? byYear.total : summarizeGames(games);
  const players = summarizePlayers(playerRows);
  return {
    games,
    byYear,
    summary,
    players,
    // With realized games missing the final score, the official total is
    // incomplete and the difference would be misleading: hide the row.
    othersPoints: summary.withoutScore > 0 ? 0 : othersPoints(summary.pointsFor, players),
  };
}
