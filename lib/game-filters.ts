import type { GameWithChampionship } from "@/lib/games-repo";

export function getGameYears(games: GameWithChampionship[]): number[] {
  const years = new Set(games.map((g) => Number(g.gameDate.slice(0, 4))));
  return [...years].sort((a, b) => b - a);
}

// Busca só entra em ação a partir de 3 caracteres, igual ao filtro de
// atletas — evita filtrar tudo fora a cada tecla enquanto o técnico digita.
export function matchesGameFilters(
  game: GameWithChampionship,
  year: number | "todos",
  term: string
): boolean {
  if (year !== "todos" && Number(game.gameDate.slice(0, 4)) !== year) return false;

  const trimmed = term.trim().toLowerCase();
  if (trimmed.length >= 3) {
    const opponentMatch = game.opponent.toLowerCase().includes(trimmed);
    const championshipMatch = game.championshipName?.toLowerCase().includes(trimmed) ?? false;
    if (!opponentMatch && !championshipMatch) return false;
  }

  return true;
}
