import { describe, expect, it } from "vitest";
import {
  NO_CHAMPIONSHIP,
  availableYears,
  gameResult,
  groupByChampionship,
  othersPoints,
  summarizeGames,
  summarizeByYear,
  summarizePlayers,
} from "@/lib/overview-calc";
import type { PlayerTotalsRow, QuarterGame } from "@/lib/overview-calc";

const game = (ourScore: number | null, theirScore: number | null, gameDate = "2018-05-19") => ({
  gameDate,
  ourScore,
  theirScore,
});

describe("gameResult", () => {
  it("classifica vitória, derrota e empate", () => {
    expect(gameResult(58, 57)).toBe("vitoria");
    expect(gameResult(59, 84)).toBe("derrota");
    expect(gameResult(60, 60)).toBe("empate");
  });
});

describe("summarizeGames", () => {
  it("conta resultados, pontos, médias e saldo", () => {
    const s = summarizeGames([game(58, 57), game(59, 84), game(60, 60)]);
    expect(s).toMatchObject({ played: 3, wins: 1, losses: 1, draws: 1, withoutScore: 0 });
    expect(s.pointsFor).toBe(177);
    expect(s.pointsAgainst).toBe(201);
    expect(s.avgFor).toBeCloseTo(59);
    expect(s.avgAgainst).toBeCloseTo(67);
    expect(s.balance).toBe(-24);
    expect(s.winRate).toBeCloseTo(1 / 3);
  });

  it("devolve zeros sem dividir por zero quando não há jogos", () => {
    const s = summarizeGames([]);
    expect(s).toMatchObject({ played: 0, winRate: 0, avgFor: 0, avgAgainst: 0, balance: 0 });
  });

  it("deixa jogo sem placar fora dos resultados e dos pontos, contando à parte", () => {
    const s = summarizeGames([game(70, 50), game(null, null), game(80, null)]);
    expect(s).toMatchObject({ played: 1, wins: 1, withoutScore: 2, pointsFor: 70, avgFor: 70 });
  });
});

describe("availableYears", () => {
  it("lista anos distintos do mais recente ao mais antigo, sem 2026", () => {
    expect(
      availableYears(["2018-05-19", "2019-02-09", "2018-08-21", "2026-05-07", "2019-10-12"])
    ).toEqual([2019, 2018]);
  });

  it("devolve lista vazia quando só há anos ocultos", () => {
    expect(availableYears(["2026-07-14"])).toEqual([]);
  });
});

const NO_QUARTERS = {
  q1OurScore: null,
  q1TheirScore: null,
  q2OurScore: null,
  q2TheirScore: null,
  q3OurScore: null,
  q3TheirScore: null,
  q4OurScore: null,
  q4TheirScore: null,
  otOurScore: null,
  otTheirScore: null,
};

const qGame = (
  championshipName: string | null,
  gameDate: string,
  ourScore: number,
  theirScore: number,
  quarters: Partial<QuarterGame> = {}
): QuarterGame => ({ championshipName, gameDate, ourScore, theirScore, ...NO_QUARTERS, ...quarters });

describe("groupByChampionship", () => {
  it("agrupa por campeonato, na ordem do primeiro jogo, com jogos por data", () => {
    const groups = groupByChampionship([
      qGame("NBMS", "2018-07-11", 87, 60),
      qGame("Jogos Abertos CG", "2018-06-15", 67, 45),
      qGame("NBMS", "2018-06-16", 45, 51),
      qGame("Jogos Abertos CG", "2018-05-19", 58, 57),
    ]);
    expect(groups.map((g) => g.name)).toEqual(["Jogos Abertos CG", "NBMS"]);
    expect(groups[1].games.map((g) => g.gameDate)).toEqual(["2018-06-16", "2018-07-11"]);
    expect(groups[0].summary).toMatchObject({ played: 2, wins: 2, pointsFor: 125, pointsAgainst: 102 });
    expect(groups[1].summary).toMatchObject({ wins: 1, losses: 1 });
  });

  it("soma quartos só dos jogos que têm o quarto preenchido", () => {
    const [group] = groupByChampionship([
      qGame("Copa Ucdb", "2018-07-13", 72, 46, { q1OurScore: 13, q1TheirScore: 6, otOurScore: 5, otTheirScore: 2 }),
      qGame("Copa Ucdb", "2018-07-14", 67, 46, { q1OurScore: 21, q1TheirScore: 17 }),
      qGame("Copa Ucdb", "2018-07-15", 66, 60),
    ]);
    expect(group.quarterTotals.q1).toEqual({ our: 34, their: 23, games: 2 });
    expect(group.quarterTotals.q2).toEqual({ our: 0, their: 0, games: 0 });
    expect(group.quarterTotals.ot).toEqual({ our: 5, their: 2, games: 1 });
    expect(group.hasOvertime).toBe(true);
  });

  it("junta jogos sem campeonato num grupo próprio", () => {
    const groups = groupByChampionship([qGame(null, "2018-08-21", 57, 61), qGame("  ", "2018-08-22", 60, 50)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe(NO_CHAMPIONSHIP);
  });
});

const player = (over: Partial<PlayerTotalsRow> = {}): PlayerTotalsRow => ({
  athleteId: 1,
  name: "IBRA",
  nickname: null,
  active: true,
  games: 2,
  reboundsOff: 0,
  reboundsDef: 8,
  assists: 6,
  steals: 1,
  blocks: 1,
  turnovers: 13,
  fouls: 2,
  fg2Made: 8,
  fg2Attempted: 16,
  fg3Made: 1,
  fg3Attempted: 4,
  ftMade: 0,
  ftAttempted: 0,
  ...over,
});

describe("summarizePlayers", () => {
  it("calcula totais, médias por jogo disputado e percentuais", () => {
    const [p] = summarizePlayers([player()]);
    expect(p.totals.points).toBe(19); // 8*2 + 1*3
    expect(p.totals.rebounds).toBe(8);
    expect(p.averages.points).toBeCloseTo(9.5);
    expect(p.averages.rebounds).toBeCloseTo(4);
    expect(p.fg2).toEqual({ made: 8, attempted: 16, pct: 0.5 });
    expect(p.fg3.pct).toBeCloseTo(0.25);
  });

  it("deixa o percentual nulo quando não houve tentativa", () => {
    const [p] = summarizePlayers([player()]);
    expect(p.ft).toEqual({ made: 0, attempted: 0, pct: null });
  });

  it("calcula a EFF descontando as faltas (ADR-0006)", () => {
    // bom: 19 pts + 8 reb + 6 ast + 1 rou + 1 toc = 35
    // ruim: (16-8) + (4-1) + 0 + 13 erros + 2 faltas = 26
    const [p] = summarizePlayers([player()]);
    expect(p.totals.eff).toBe(9);
    expect(p.averages.eff).toBeCloseTo(4.5);
  });
});

describe("othersPoints", () => {
  it("devolve os pontos do placar não atribuídos a atletas cadastrados", () => {
    const players = summarizePlayers([player(), player({ athleteId: 2, fg2Made: 10 })]);
    expect(othersPoints(70, players)).toBe(70 - 19 - 23);
  });

  it("fica negativo quando o boletim soma mais que o placar", () => {
    expect(othersPoints(10, summarizePlayers([player()]))).toBe(-9);
  });
});

describe("summarizeByYear", () => {
  it("separa por ano, do mais antigo ao mais recente, com total igual à soma", () => {
    const { years, total } = summarizeByYear([
      game(70, 60, "2019-03-10"),
      game(58, 57, "2018-05-19"),
      game(50, 65, "2019-08-02"),
      game(59, 84, "2018-06-23"),
    ]);
    expect(years.map((y) => y.year)).toEqual([2018, 2019]);
    expect(years[0].summary).toMatchObject({ played: 2, wins: 1, losses: 1, pointsFor: 117 });
    expect(years[1].summary).toMatchObject({ played: 2, wins: 1, losses: 1, pointsFor: 120 });
    expect(total).toMatchObject({ played: 4, wins: 2, losses: 2, pointsFor: 237, pointsAgainst: 266 });
  });

  it("deixa 2026 fora das linhas e do total", () => {
    const { years, total } = summarizeByYear([game(58, 57, "2018-05-19"), game(90, 10, "2026-02-01")]);
    expect(years.map((y) => y.year)).toEqual([2018]);
    expect(total).toMatchObject({ played: 1, pointsFor: 58 });
  });

  it("conta jogos sem placar à parte, por ano e no total", () => {
    const { years, total } = summarizeByYear([game(58, 57, "2018-05-19"), game(null, null, "2018-06-01")]);
    expect(years[0].summary).toMatchObject({ played: 1, withoutScore: 1 });
    expect(total.withoutScore).toBe(1);
  });

  it("devolve listas vazias e total zerado sem jogos", () => {
    const { years, total } = summarizeByYear([]);
    expect(years).toEqual([]);
    expect(total.played).toBe(0);
  });
});
