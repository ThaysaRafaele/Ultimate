import Link from "next/link";
import type { GamesSummary, YearSummary } from "@/lib/overview-calc";

const decimal = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = (n: number) => n.toLocaleString("pt-BR");
const signed = (n: number) => (n > 0 ? `+${integer(n)}` : integer(n));

const COLUMNS: { label: string; title: string }[] = [
  { label: "J", title: "Jogos com placar" },
  { label: "V", title: "Vitórias" },
  { label: "D", title: "Derrotas" },
  { label: "E", title: "Empates" },
  { label: "Aprov.", title: "Aproveitamento (vitórias / jogos)" },
  { label: "Pró", title: "Pontos pró" },
  { label: "Contra", title: "Pontos contra" },
  { label: "Pró/J", title: "Média de pontos pró por jogo" },
  { label: "Contra/J", title: "Média de pontos contra por jogo" },
  { label: "Saldo", title: "Saldo de pontos" },
];

// "Resumo geral": one line per year (each links to that year's summary) plus
// the overall total. Same horizontal-scroll pattern as the players table.
export function OverviewYears({
  years,
  total,
  yearHref,
}: Readonly<{ years: YearSummary[]; total: GamesSummary; yearHref: (year: number) => string }>) {
  return (
    <section aria-label="Ano a ano">
      <p className="text-sm text-muted-1 mb-3.5">Toque no ano para ver o resumo completo dele.</p>

      <div className="bg-white border border-border-light rounded-xl overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.06em] text-muted-2 border-b border-border-light">
              <th
                scope="col"
                className="sticky left-0 z-20 bg-white text-left font-bold px-4 py-2.5 shadow-[1px_0_0_var(--color-border-light)]"
              >
                Ano
              </th>
              {COLUMNS.map((c) => (
                <th key={c.label} scope="col" title={c.title} className="font-bold text-right px-2.5 py-2.5 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(({ year, summary }) => (
              <tr key={year} className="group border-b border-border-light hover:bg-bg-subtle">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white group-hover:bg-bg-subtle text-left px-4 py-2.5 min-w-28 shadow-[1px_0_0_var(--color-border-light)]"
                >
                  <Link
                    href={yearHref(year)}
                    title={`Ver o resumo de ${year}`}
                    className="inline-flex items-center gap-1.5 font-heading font-bold text-lg text-ink hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded"
                  >
                    {year}
                    <span aria-hidden className="text-brand-red text-sm">→</span>
                  </Link>
                  {summary.withoutScore > 0 && (
                    <span className="block text-[11px] font-normal text-muted-1">
                      + {summary.withoutScore} sem placar
                    </span>
                  )}
                </th>
                <SummaryCells summary={summary} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-bg-subtle border-t-2 border-border-light">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-bg-subtle text-left px-4 py-3 font-bold uppercase text-[11px] tracking-[0.06em] text-muted-1 shadow-[1px_0_0_var(--color-border-light)]"
              >
                Total
                {total.withoutScore > 0 && (
                  <span className="block normal-case tracking-normal font-normal">+ {total.withoutScore} sem placar</span>
                )}
              </th>
              <SummaryCells summary={total} strong />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function SummaryCells({ summary, strong }: Readonly<{ summary: GamesSummary; strong?: boolean }>) {
  const balanceTone =
    summary.balance > 0 ? "text-emerald-600" : summary.balance < 0 ? "text-brand-red" : "text-ink";
  return (
    <>
      <Num strong={strong}>{integer(summary.played)}</Num>
      <Num tone="text-emerald-600" strong={strong}>{integer(summary.wins)}</Num>
      <Num tone="text-brand-red" strong={strong}>{integer(summary.losses)}</Num>
      <Num tone="text-muted-3" strong={strong}>{integer(summary.draws)}</Num>
      <Num strong>{`${Math.round(summary.winRate * 100)}%`}</Num>
      <Num strong={strong}>{integer(summary.pointsFor)}</Num>
      <Num strong={strong}>{integer(summary.pointsAgainst)}</Num>
      <Num strong={strong}>{decimal(summary.avgFor)}</Num>
      <Num strong={strong}>{decimal(summary.avgAgainst)}</Num>
      <Num tone={balanceTone} strong>{signed(summary.balance)}</Num>
    </>
  );
}

function Num({ children, tone, strong }: Readonly<{ children: React.ReactNode; tone?: string; strong?: boolean }>) {
  return (
    <td className={`px-2.5 py-2.5 text-right tabular-nums whitespace-nowrap ${tone ?? "text-ink"} ${strong ? "font-bold" : ""}`}>
      {children}
    </td>
  );
}
