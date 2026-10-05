import { describe, expect, it } from "vitest";
import { availableYears, gameResult, summarizeGames } from "@/lib/overview-calc";

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
