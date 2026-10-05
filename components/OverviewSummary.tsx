import type { GamesSummary } from "@/lib/overview-calc";

const decimal = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = (n: number) => n.toLocaleString("pt-BR");
const signed = (n: number, format: (v: number) => string) => (n > 0 ? `+${format(n)}` : format(n));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function OverviewSummary({ summary }: Readonly<{ summary: GamesSummary }>) {
  const { played, wins, losses, draws, withoutScore } = summary;
  const balanceTone =
    summary.balance > 0 ? "text-emerald-600" : summary.balance < 0 ? "text-brand-red" : "text-ink";

  return (
    <div className="grid grid-cols-3 max-md:grid-cols-2 gap-3.5 max-md:gap-2.5">
      <Card label="Jogos">
        <Value>{integer(played)}</Value>
        <Hint>
          {withoutScore > 0 ? `+ ${plural(withoutScore, "realizado", "realizados")} sem placar` : "realizados no ano"}
        </Hint>
      </Card>

      <Card label="Campanha">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 max-md:gap-x-2">
          <Record value={wins} label="V" tone="text-emerald-600" />
          <Record value={losses} label="D" tone="text-brand-red" />
          <Record value={draws} label="E" tone="text-muted-3" />
        </div>
        <ResultBar wins={wins} losses={losses} draws={draws} />
      </Card>

      <Card label="Aproveitamento">
        <Value highlight>{`${Math.round(summary.winRate * 100)}%`}</Value>
        <div className="h-1.5 rounded-full bg-bg-subtle-2 mt-3 overflow-hidden" aria-hidden>
          <div className="h-full bg-brand-red rounded-full" style={{ width: `${summary.winRate * 100}%` }} />
        </div>
      </Card>

      <Card label="Pontos pró / jogo">
        <Value>{decimal(summary.avgFor)}</Value>
        <Hint>{`${integer(summary.pointsFor)} no total`}</Hint>
      </Card>

      <Card label="Pontos contra / jogo">
        <Value>{decimal(summary.avgAgainst)}</Value>
        <Hint>{`${integer(summary.pointsAgainst)} no total`}</Hint>
      </Card>

      <Card label="Saldo de pontos">
        <Value className={balanceTone}>{signed(summary.balance, integer)}</Value>
        <Hint>
          {played > 0 ? `${signed(summary.balance / played, decimal)} por jogo` : "sem jogos com placar"}
        </Hint>
      </Card>
    </div>
  );
}

function Card({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="bg-white border border-border-light rounded-xl px-5 py-4.5 max-md:px-4 max-md:py-3.5">
      <div className="text-xs max-md:text-[11px] uppercase tracking-[0.06em] text-muted-2 font-bold mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Value({
  children,
  highlight,
  className,
}: Readonly<{ children: React.ReactNode; highlight?: boolean; className?: string }>) {
  return (
    <div
      className={`font-heading font-bold text-4xl max-md:text-3xl leading-none ${
        className ?? (highlight ? "text-brand-red" : "text-ink")
      }`}
    >
      {children}
    </div>
  );
}

function Hint({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="text-xs text-muted-1 mt-2">{children}</div>;
}

function Record({ value, label, tone }: Readonly<{ value: number; label: string; tone: string }>) {
  return (
    <span className="flex items-baseline gap-0.5">
      <span className={`font-heading font-bold text-4xl max-md:text-2xl leading-none ${tone}`}>{value}</span>
      <span className="text-xs font-bold text-muted-1">{label}</span>
    </span>
  );
}

function ResultBar({ wins, losses, draws }: Readonly<{ wins: number; losses: number; draws: number }>) {
  const total = wins + losses + draws;
  if (total === 0) return <div className="h-1.5 rounded-full bg-bg-subtle-2 mt-3" aria-hidden />;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div
      className="h-1.5 rounded-full bg-bg-subtle-2 mt-3 overflow-hidden flex"
      role="img"
      aria-label={`${plural(wins, "vitória", "vitórias")}, ${plural(losses, "derrota", "derrotas")} e ${plural(draws, "empate", "empates")}`}
    >
      <div className="bg-emerald-500" style={{ width: pct(wins) }} />
      <div className="bg-brand-red" style={{ width: pct(losses) }} />
      <div className="bg-muted-4" style={{ width: pct(draws) }} />
    </div>
  );
}
