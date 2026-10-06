import { describe, expect, it } from "vitest";
import { groupByChampionship, summarizeByYear, summarizeGames, summarizePlayers } from "@/lib/overview-calc";
import type { PlayerTotalsRow } from "@/lib/overview-calc";
import {
  PLAYER_HEADERS,
  byYearSheet,
  exportFileName,
  gamesSheet,
  playersSheet,
  summarySheet,
  validateExportParams,
} from "@/lib/overview-export";

const game = (id: number, gameDate: string, championshipName: string, ourScore: number | null, theirScore: number | null) => ({
  id,
  team: "adulto",
  opponent: `Adv ${id}`,
  gameDate,
  championshipName,
  ourScore,
  theirScore,
  q1OurScore: 20,
  q1TheirScore: 10,
  q2OurScore: null,
  q2TheirScore: null,
  q3OurScore: null,
  q3TheirScore: null,
  q4OurScore: null,
  q4TheirScore: null,
  otOurScore: null,
  otTheirScore: null,
});

const playerRow = (over: Partial<PlayerTotalsRow>): PlayerTotalsRow => ({
  athleteId: 1,
  name: "IBRAHIM NICOLA",
  nickname: "IBRA",
  active: true,
  games: 2,
  reboundsOff: 0,
  reboundsDef: 10,
  assists: 4,
  steals: 2,
  blocks: 1,
  turnovers: 3,
  fouls: 5,
  fg2Made: 5,
  fg2Attempted: 10,
  fg3Made: 1,
  fg3Attempted: 4,
  ftMade: 2,
  ftAttempted: 2,
  ...over,
});

describe("validateExportParams", () => {
  const teams = ["todos", "adulto"];
  it("aceita categoria e ano existentes, inclusive todos os anos", () => {
    expect(validateExportParams("adulto", "2018", teams, [2019, 2018])).toBeNull();
    expect(validateExportParams("todos", "todos", teams, [2018])).toBeNull();
  });

  it("recusa categoria desconhecida, ano ausente, ano sem jogos e lixo", () => {
    expect(validateExportParams("feminino", "2018", teams, [2018])).toMatch(/Categoria inválida/);
    expect(validateExportParams(null, "2018", teams, [2018])).toMatch(/Categoria inválida/);
    expect(validateExportParams("adulto", null, teams, [2018])).toMatch(/Informe o ano/);
    expect(validateExportParams("adulto", "2026", teams, [2018])).toMatch(/2026/);
    expect(validateExportParams("adulto", "abc", teams, [2018])).toMatch(/Não há jogos/);
    expect(validateExportParams("adulto", "todos", teams, [])).toMatch(/Não há jogos/);
  });
});

describe("exportFileName", () => {
  it("monta o nome sem acento nem espaço", () => {
    expect(exportFileName("Adulto", 2018)).toBe("ultimate-adulto-2018.xlsx");
    expect(exportFileName("Todas as categorias", null)).toBe("ultimate-todas-as-categorias-todos-os-anos.xlsx");
  });
});

describe("summarySheet", () => {
  it("traz os números dos cards, com aproveitamento como fração", () => {
    const summary = summarizeGames([game(1, "2018-05-19", "A", 58, 57), game(2, "2018-06-23", "A", 59, 84)]);
    const sheet = summarySheet("Adulto", 2018, summary);
    const value = (label: string) => sheet.rows.find((r) => r.cells[0] === label)?.cells[1];
    expect(sheet.name).toBe("Resumo");
    expect(value("Jogos")).toBe(2);
    expect(value("Vitórias")).toBe(1);
    expect(value("Aproveitamento")).toBe(0.5);
    expect(value("Pontos pró")).toBe(117);
    expect(value("Saldo de pontos")).toBe(-24);
    expect(sheet.rows.find((r) => r.cells[0] === "Aproveitamento")?.formats?.[1]).toBe("pct");
    expect(value("Jogos realizados sem placar")).toBeUndefined();
  });
});

describe("gamesSheet", () => {
  const groups = groupByChampionship([
    game(1, "2018-05-19", "Jogos Abertos", 58, 57),
    game(2, "2018-06-23", "Jogos Abertos", 59, 84),
    game(3, "2018-07-01", "NBMS", null, null),
  ]);

  it("lista jogos por campeonato com linhas de Total e Média iguais ao rodapé da tela", () => {
    const sheet = gamesSheet(groups);
    expect(sheet.columns.slice(0, 6).map((c) => c.header)).toEqual([
      "Campeonato",
      "Data",
      "Adversário",
      "Ultimate",
      "Adversário (pts)",
      "Resultado",
    ]);
    const labels = sheet.rows.map((r) => r.cells[0]);
    expect(labels).toEqual(["Jogos Abertos", "Jogos Abertos", "Total Jogos Abertos", "Média Jogos Abertos", "NBMS"]);
    const total = sheet.rows[2];
    expect(total.total).toBe(true);
    expect(total.cells.slice(2, 5)).toEqual(["1V 1D", 117, 141]);
    expect(sheet.rows[3].cells[3]).toBeCloseTo(58.5);
    expect(sheet.rows[4].cells[5]).toBe("Sem placar");
  });

  it("acrescenta a coluna Categoria só com todas as categorias", () => {
    const sheet = gamesSheet(groups, { adulto: "Adulto" });
    expect(sheet.columns[3].header).toBe("Categoria");
    expect(sheet.rows[0].cells[3]).toBe("Adulto");
    expect(sheet.rows.every((r) => r.cells.length === sheet.columns.length)).toBe(true);
  });
});

describe("playersSheet", () => {
  const players = summarizePlayers([
    playerRow({}),
    playerRow({ athleteId: 2, name: "JULIANO", nickname: null, fg2Made: 9, fg2Attempted: 12 }),
  ]);

  it("segue a ordem da Scout Atletas e ordena por pontos", () => {
    const sheet = playersSheet(players, 0, 2);
    expect(sheet.columns.map((c) => c.header)).toEqual([...PLAYER_HEADERS]);
    expect(sheet.rows.map((r) => r.cells[0])).toEqual(["JULIANO", "IBRA"]);
    const ibra = sheet.rows[1].cells;
    const at = (h: (typeof PLAYER_HEADERS)[number]) => ibra[PLAYER_HEADERS.indexOf(h)];
    expect(at("2P tent.")).toBe(10);
    expect(at("2P %")).toBe(0.5);
    expect(at("Pontos")).toBe(15);
    expect(at("Pontos/J")).toBe(7.5);
    expect(at("EFF")).toBe(players[0].totals.eff);
    expect(sheet.rows.every((r) => r.cells.length === PLAYER_HEADERS.length)).toBe(true);
  });

  it("acrescenta a linha de Outros só quando há diferença com o placar", () => {
    expect(playersSheet(players, 0, 2).rows).toHaveLength(2);
    const others = playersSheet(players, 12, 2).rows.at(-1)!;
    expect(others.cells[0]).toBe("Outros (sem cadastro)");
    expect(others.cells[PLAYER_HEADERS.indexOf("Pontos")]).toBe(12);
    expect(others.cells[PLAYER_HEADERS.indexOf("Pontos/J")]).toBe(6);
  });
});

describe("byYearSheet", () => {
  it("tem uma linha por ano e o total igual à soma", () => {
    const { years, total } = summarizeByYear([
      game(1, "2018-05-19", "A", 58, 57),
      game(2, "2019-03-10", "B", 70, 60),
      game(3, "2019-04-10", "B", 50, 65),
    ]);
    const sheet = byYearSheet(years, total);
    expect(sheet.name).toBe("Por ano");
    expect(sheet.rows.map((r) => r.cells[0])).toEqual(["2018", "2019", "Total"]);
    expect(sheet.rows[2].total).toBe(true);
    expect(sheet.rows[2].cells.slice(1, 3)).toEqual([3, 2]);
    expect(sheet.rows[2].cells[6]).toBe(178);
  });
});
