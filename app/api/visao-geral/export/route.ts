import { NextRequest, NextResponse } from "next/server";
import { ALL_TEAMS_ID, findTeamLabel } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";
import { availableYears, groupByChampionship } from "@/lib/overview-calc";
import { loadOverview } from "@/lib/overview-data";
import {
  ALL_TEAMS_LABEL,
  ALL_YEARS_PARAM,
  byYearSheet,
  exportFileName,
  gamesSheet,
  playersSheet,
  summarySheet,
  validateExportParams,
} from "@/lib/overview-export";
import { getRealizedGameDates } from "@/lib/overview-repo";
import { buildWorkbook } from "@/lib/overview-xlsx";

// GET /api/visao-geral/export?team=adulto&year=2018 (or team=todos, year=todos):
// the "Visão geral" as an .xlsx, same cut and numbers as the screen.
export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team");
  const year = request.nextUrl.searchParams.get("year");

  const allTeams = await getAllTeams();
  const validTeamIds = [ALL_TEAMS_ID, ...allTeams.map((t) => t.id)];
  // Unknown team: validate first so the years query never runs on garbage.
  const teamFilter = team && team !== ALL_TEAMS_ID ? team : null;
  const years = validTeamIds.includes(team ?? "") ? availableYears(await getRealizedGameDates(teamFilter)) : [];

  const error = validateExportParams(team, year, validTeamIds, years);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const selectedYear = year === ALL_YEARS_PARAM ? null : Number(year);
  const teamLabel = teamFilter ? findTeamLabel(allTeams, teamFilter) : ALL_TEAMS_LABEL;
  const overview = await loadOverview(teamFilter, selectedYear);
  if (overview.summary.played === 0) {
    return NextResponse.json({ error: "Os jogos deste período ainda não têm placar final." }, { status: 400 });
  }

  const players = playersSheet(overview.players, overview.othersPoints, overview.summary.played);
  const sheets =
    selectedYear === null
      ? [byYearSheet(overview.byYear.years, overview.byYear.total), players]
      : [
          summarySheet(teamLabel, selectedYear, overview.summary),
          gamesSheet(
            groupByChampionship(overview.games),
            teamFilter ? undefined : Object.fromEntries(allTeams.map((t) => [t.id, t.label]))
          ),
          players,
        ];

  const file = await buildWorkbook(sheets);
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${exportFileName(teamLabel, selectedYear)}"`,
      "Cache-Control": "no-store",
    },
  });
}
