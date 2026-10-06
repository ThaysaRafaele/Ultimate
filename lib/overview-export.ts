// Rows of the Excel export of the "Visão geral" (Issue 6). Pure: no exceljs
// and no `@/lib/db` here, so the layout is testable; lib/overview-xlsx.ts turns
// these sheets into the file. Numbers stay numbers (no pre-formatted text),
// every value comes from the same overview-calc results the screen shows.

import { QUARTERS, gameResult, quarterScore } from "@/lib/overview-calc";
import type {
  ChampionshipGroup,
  GamesSummary,
  PlayerSummary,
  QuarterGame,
  YearSummary,
} from "@/lib/overview-calc";

// int = whole number, dec = one decimal, pct = fraction shown as %, date =
// "YYYY-MM-DD" written as an Excel date.
export type CellFormat = "text" | "int" | "dec" | "pct" | "date";
export type Cell = string | number | null;
export type SheetColumn = { header: string; format: CellFormat; width: number };
// "total" rows are written in bold (totals and averages, like the screen
// footers). `formats` overrides the column format cell by cell.
export type SheetRow = { cells: Cell[]; total?: boolean; formats?: (CellFormat | undefined)[] };
export type Sheet = { name: string; columns: SheetColumn[]; rows: SheetRow[] };

// ?year=todos opens the "Resumo geral" (every visible year); the category
// selector of the overview names the ?team=todos option like this.
export const ALL_YEARS_PARAM = "todos";
export const ALL_TEAMS_LABEL = "Todas as categorias";

const col = (header: string, format: CellFormat, width = 9): SheetColumn => ({ header, format, width });

// ?team= and ?year= of the export, checked against what exists. Returns the
// error message (PT-BR) or null.
export function validateExportParams(
  team: string | null,
  year: string | null,
  validTeamIds: readonly string[],
  years: readonly number[]
): string | null {
  if (!team || !validTeamIds.includes(team)) return "Categoria inválida para exportar.";
  if (!year) return "Informe o ano do relatório.";
  if (year === ALL_YEARS_PARAM) return years.length > 0 ? null : "Não há jogos realizados para exportar.";
  if (!/^\d{4}$/.test(year) || !years.includes(Number(year))) return `Não há jogos realizados em ${year} para exportar.`;
  return null;
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ultimate-adulto-2018.xlsx · ultimate-todas-as-categorias-todos-os-anos.xlsx
export function exportFileName(teamLabel: string, year: number | null): string {
  return `ultimate-${slug(teamLabel)}-${year ?? "todos-os-anos"}.xlsx`;
}

// --- Resumo (annual summary cards) ---------------------------------------

export function summarySheet(teamLabel: string, year: number, summary: GamesSummary): Sheet {
  const rows: [string, Cell, CellFormat][] = [
    ["Categoria", teamLabel, "text"],
    ["Ano", String(year), "text"],
    ["Jogos", summary.played, "int"],
    ["Vitórias", summary.wins, "int"],
    ["Derrotas", summary.losses, "int"],
    ["Empates", summary.draws, "int"],
    ["Aproveitamento", summary.winRate, "pct"],
    ["Pontos pró", summary.pointsFor, "int"],
    ["Pontos contra", summary.pointsAgainst, "int"],
    ["Média de pontos pró", summary.avgFor, "dec"],
    ["Média de pontos contra", summary.avgAgainst, "dec"],
    ["Saldo de pontos", summary.balance, "int"],
  ];
  if (summary.withoutScore > 0) rows.push(["Jogos realizados sem placar", summary.withoutScore, "int"]);
  return {
    name: "Resumo",
    columns: [col("Item", "text", 28), col("Valor", "text", 18)],
    rows: rows.map(([label, value, format]) => ({ cells: [label, value], formats: [undefined, format] })),
  };
}

// --- Jogos (games grouped by championship, with Total / Média rows) --------

const RESULT_LABEL = { vitoria: "Vitória", derrota: "Derrota", empate: "Empate" } as const;
const QUARTER_HEADER = { q1: "Q1", q2: "Q2", q3: "Q3", q4: "Q4", ot: "Prorr." } as const;

export type ExportGame = QuarterGame & { opponent: string; team: string };

export function gamesSheet<G extends ExportGame>(
  groups: readonly ChampionshipGroup<G>[],
  teamLabels?: Record<string, string>
): Sheet {
  const quarters = QUARTERS.filter((q) => q !== "ot" || groups.some((g) => g.hasOvertime));
  const withTeam = teamLabels !== undefined;
  const columns = [
    col("Campeonato", "text", 22),
    col("Data", "date", 12),
    col("Adversário", "text", 22),
    ...(withTeam ? [col("Categoria", "text", 14)] : []),
    col("Ultimate", "int"),
    col("Adversário (pts)", "int", 15),
    col("Resultado", "text", 11),
    ...quarters.flatMap((q) => [col(`${QUARTER_HEADER[q]} Ult.`, "int"), col(`${QUARTER_HEADER[q]} Adv.`, "int")]),
  ];

  const rows: SheetRow[] = [];
  for (const group of groups) {
    for (const g of group.games) {
      const scored = g.ourScore != null && g.theirScore != null;
      rows.push({
        cells: [
          group.name,
          g.gameDate,
          g.opponent,
          ...(withTeam ? [teamLabels[g.team] ?? g.team] : []),
          g.ourScore,
          g.theirScore,
          scored ? RESULT_LABEL[gameResult(g.ourScore!, g.theirScore!)] : "Sem placar",
          ...quarters.flatMap((q) => {
            const s = quarterScore(g, q);
            return s ? [s.our, s.their] : [null, null];
          }),
        ],
      });
    }
    const { summary, quarterTotals } = group;
    if (summary.played === 0) continue;
    const pad = withTeam ? [null] : [];
    rows.push({
      total: true,
      cells: [
        `Total ${group.name}`,
        null,
        `${summary.wins}V ${summary.losses}D${summary.draws ? ` ${summary.draws}E` : ""}`,
        ...pad,
        summary.pointsFor,
        summary.pointsAgainst,
        null,
        ...quarters.flatMap((q) => (quarterTotals[q].games ? [quarterTotals[q].our, quarterTotals[q].their] : [null, null])),
      ],
    });
    rows.push({
      total: true,
      cells: [
        `Média ${group.name}`,
        null,
        null,
        ...pad,
        summary.avgFor,
        summary.avgAgainst,
        null,
        ...quarters.flatMap((q) => {
          const t = quarterTotals[q];
          return t.games ? [t.our / t.games, t.their / t.games] : [null, null];
        }),
      ],
    });
  }
  return { name: "Jogos", columns, rows };
}

// --- Jogadores (same order as the coach's "Scout Atletas", no extra metrics) --

export const PLAYER_HEADERS = [
  "Jogador",
  "Nome",
  "Jogos",
  "2P tent.",
  "2P conv.",
  "2P %",
  "3P tent.",
  "3P conv.",
  "3P %",
  "LL tent.",
  "LL conv.",
  "LL %",
  "Rebotes",
  "Rebotes/J",
  "Assist.",
  "Assist./J",
  "Tocos",
  "Tocos/J",
  "Erros",
  "Erros/J",
  "Roubos",
  "Roubos/J",
  "Faltas",
  "Faltas/J",
  "Pontos",
  "Pontos/J",
  "EFF",
  "EFF/J",
] as const;

const PLAYER_FORMATS: CellFormat[] = [
  "text",
  "text",
  "int",
  ...(["int", "int", "pct"] as const),
  ...(["int", "int", "pct"] as const),
  ...(["int", "int", "pct"] as const),
  ...Array.from({ length: 8 }, () => ["int", "dec"] as const).flat(),
];

// Default order of the screen: points (desc), then name.
function byPoints(a: PlayerSummary, b: PlayerSummary): number {
  return b.totals.points - a.totals.points || (a.nickname ?? a.name).localeCompare(b.nickname ?? b.name, "pt-BR");
}

export function playersSheet(players: readonly PlayerSummary[], othersPoints: number, teamGames: number): Sheet {
  const columns = PLAYER_HEADERS.map((h, i) =>
    col(h, PLAYER_FORMATS[i], i === 0 ? 16 : i === 1 ? 30 : 9)
  );
  const rows: SheetRow[] = [...players].sort(byPoints).map((p) => ({
    cells: [
      p.nickname ?? p.name,
      p.nickname ? p.name : null,
      p.games,
      p.fg2.attempted,
      p.fg2.made,
      p.fg2.pct,
      p.fg3.attempted,
      p.fg3.made,
      p.fg3.pct,
      p.ft.attempted,
      p.ft.made,
      p.ft.pct,
      p.totals.rebounds,
      p.averages.rebounds,
      p.totals.assists,
      p.averages.assists,
      p.totals.blocks,
      p.averages.blocks,
      p.totals.turnovers,
      p.averages.turnovers,
      p.totals.steals,
      p.averages.steals,
      p.totals.fouls,
      p.averages.fouls,
      p.totals.points,
      p.averages.points,
      p.totals.eff,
      p.averages.eff,
    ],
  }));
  if (othersPoints !== 0) {
    const cells: Cell[] = Array(PLAYER_HEADERS.length).fill(null);
    cells[0] = othersPoints > 0 ? "Outros (sem cadastro)" : "Boletim acima do placar";
    cells[1] = "Só pontos: diferença entre o placar oficial e a soma dos atletas";
    cells[PLAYER_HEADERS.indexOf("Pontos")] = othersPoints;
    cells[PLAYER_HEADERS.indexOf("Pontos/J")] = teamGames > 0 ? othersPoints / teamGames : 0;
    rows.push({ cells, total: true });
  }
  return { name: "Jogadores", columns, rows };
}

// --- Por ano ("Resumo geral") --------------------------------------------

function summaryCells(s: GamesSummary): Cell[] {
  return [s.played, s.wins, s.losses, s.draws, s.winRate, s.pointsFor, s.pointsAgainst, s.avgFor, s.avgAgainst, s.balance, s.withoutScore];
}

export function byYearSheet(years: readonly YearSummary[], total: GamesSummary): Sheet {
  return {
    name: "Por ano",
    columns: [
      col("Ano", "text", 8),
      col("Jogos", "int"),
      col("Vitórias", "int"),
      col("Derrotas", "int"),
      col("Empates", "int"),
      col("Aproveitamento", "pct", 15),
      col("Pontos pró", "int", 11),
      col("Pontos contra", "int", 13),
      col("Pró/J", "dec"),
      col("Contra/J", "dec"),
      col("Saldo", "int"),
      col("Sem placar", "int", 11),
    ],
    rows: [
      ...years.map(({ year, summary }) => ({ cells: [String(year), ...summaryCells(summary)] })),
      { cells: ["Total", ...summaryCells(total)], total: true },
    ],
  };
}
