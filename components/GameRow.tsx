import { formatDateBR, gameDay, gameMonth } from "@/lib/format";
import type { GameWithChampionship } from "@/lib/games-repo";

export function GameRow({
  game,
  onClick,
}: Readonly<{ game: GameWithChampionship; onClick: () => void }>) {
  const isDone = game.status === "realizado";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-border-light rounded-xl px-5.5 py-4.5 flex items-center gap-5.5 cursor-pointer hover:shadow-[0_8px_20px_rgba(0,0,0,.08)] transition-shadow duration-150"
      style={{ borderLeft: `4px solid ${isDone ? "#101012" : "#E11B22"}` }}
    >
      <div className="text-center min-w-18.5">
        <div className="font-heading font-bold text-3xl leading-none text-ink">{gameDay(game.gameDate)}</div>
        <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-bold">
          {gameMonth(game.gameDate)}
        </div>
      </div>
      <div className="w-px self-stretch bg-border-light" />
      <div className="flex-1">
        <div className="text-xs uppercase tracking-[0.06em] text-brand-red font-bold">
          {game.championshipName}
        </div>
        <div className="font-heading font-bold text-2xl uppercase text-ink leading-tight">
          Ultimate <span className="text-muted-2">vs</span> {game.opponent}
        </div>
        <div className="text-[13px] text-muted-1 mt-0.5">
          {formatDateBR(game.gameDate)} · {game.gameTime}
        </div>
      </div>
      <div className="text-right">
        <span
          className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.03em] ${
            isDone ? "bg-green-50 text-green-700" : "bg-red-50 text-brand-red"
          }`}
        >
          {isDone ? "Realizado" : "Agendado"}
        </span>
        {isDone && (
          <div className="font-heading font-bold text-xl text-ink mt-2">
            {game.ourScore} × {game.theirScore}
          </div>
        )}
      </div>
    </button>
  );
}
