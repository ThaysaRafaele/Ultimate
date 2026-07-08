const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GAME_STATUSES = ["agendado", "realizado"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

type GamePayload = {
  team?: unknown;
  championship?: unknown;
  opponent?: unknown;
  gameDate?: unknown;
  gameTime?: unknown;
  status?: unknown;
  ourScore?: unknown;
  theirScore?: unknown;
};

function scoreError(status: unknown, ourScore: unknown, theirScore: unknown): string | null {
  if (status !== "realizado") return null;
  const isNonNegativeInt = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0;
  if (!isNonNegativeInt(ourScore) || !isNonNegativeInt(theirScore)) {
    return "Informe o placar (nosso e do adversário) para marcar o jogo como realizado.";
  }
  return null;
}

export function validateGamePayload(body: GamePayload, teamIds: readonly string[]): string | null {
  const { team, championship, opponent, gameDate, gameTime, status, ourScore, theirScore } = body;

  if (typeof team !== "string" || !teamIds.includes(team)) return "Equipe inválida.";
  if (typeof championship !== "string" || championship.trim() === "") {
    return "Informe o nome do campeonato ou torneio.";
  }
  if (typeof opponent !== "string" || opponent.trim() === "") return "Informe o adversário.";
  if (typeof gameDate !== "string" || !DATE_RE.test(gameDate)) return "Data do jogo inválida.";
  if (typeof gameTime !== "string" || !TIME_RE.test(gameTime)) return "Horário inválido (use hh:mm).";
  if (typeof status !== "string" || !GAME_STATUSES.includes(status as GameStatus)) {
    return "Status do jogo inválido.";
  }

  return scoreError(status, ourScore, theirScore);
}
