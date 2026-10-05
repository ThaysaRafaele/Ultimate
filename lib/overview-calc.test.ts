import { describe, expect, it } from "vitest";
import {
  NO_CHAMPIONSHIP,
  availableYears,
  gameResult,
  groupByChampionship,
  summarizeGames,
} from "@/lib/overview-calc";
import type { QuarterGame } from "@/lib/overview-calc";

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
