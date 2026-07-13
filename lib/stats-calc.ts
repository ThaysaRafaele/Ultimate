// Pure box-score math shared between server (repos, API routes) and the
// client-side stat-entry modal. No `@/lib/db` import here on purpose —
// this file gets bundled into client code, and db pulls in the Neon driver.

export type GameStatRow = {
  athleteId: number;
  reboundsOff: number;
  reboundsDef: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fg2Made: number;
  fg2Attempted: number;
  fg3Made: number;
  fg3Attempted: number;
  ftMade: number;
  ftAttempted: number;
};

// Pontos = 2 * cestas de 2 + 3 * cestas de 3 + lances livres convertidos.
export function computePoints(s: Pick<GameStatRow, "fg2Made" | "fg3Made" | "ftMade">): number {
  return s.fg2Made * 2 + s.fg3Made * 3 + s.ftMade;
}

export function computeReboundsTotal(s: Pick<GameStatRow, "reboundsOff" | "reboundsDef">): number {
  return s.reboundsOff + s.reboundsDef;
}

// EFF (estilo NBA) = (pts + reb + ast + roubos + tocos) - (arremessos errados + erros).
export function computeEff(s: GameStatRow): number {
  const points = computePoints(s);
  const rebounds = computeReboundsTotal(s);
  const good = points + rebounds + s.assists + s.steals + s.blocks;
  const bad =
    s.fg2Attempted -
    s.fg2Made +
    (s.fg3Attempted - s.fg3Made) +
    (s.ftAttempted - s.ftMade) +
    s.turnovers;
  return good - bad;
}

export function pct(made: number, attempted: number): number {
  return attempted > 0 ? (made / attempted) * 100 : 0;
}
