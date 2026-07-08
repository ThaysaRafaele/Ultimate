"use client";

import { useState } from "react";
import type { Team } from "@/lib/teams";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { ChampionshipRow } from "@/lib/championships-repo";

function validateForm(values: {
  championship: string;
  opponent: string;
  gameDate: string;
  gameTime: string;
  done: boolean;
  ourScore: string;
  theirScore: string;
}): string | null {
  const { championship, opponent, gameDate, gameTime, done, ourScore, theirScore } = values;

  if (!championship.trim()) return "Informe o nome do campeonato ou torneio.";
  if (!opponent.trim()) return "Informe o adversário.";
  if (!gameDate) return "Informe a data do jogo.";
  if (!gameTime) return "Informe o horário do jogo.";
  if (done && (ourScore === "" || theirScore === "")) {
    return "Informe o placar (nosso e do adversário) para marcar o jogo como realizado.";
  }

  return null;
}

export function GameFormModal({
  mode,
  game,
  teamId,
  teams,
  championships,
  onClose,
  onSaved,
}: Readonly<{
  mode: "create" | "edit";
  game?: GameWithChampionship;
  teamId: string;
  teams: Team[];
  championships: ChampionshipRow[];
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [team, setTeam] = useState(game?.team ?? teamId);
  const [championship, setChampionship] = useState(game?.championshipName ?? "");
  const [opponent, setOpponent] = useState(game?.opponent ?? "");
  const [gameDate, setGameDate] = useState(game?.gameDate ?? "");
  const [gameTime, setGameTime] = useState(game?.gameTime ?? "20:00");
  const [done, setDone] = useState(game?.status === "realizado");
  const [ourScore, setOurScore] = useState(game?.ourScore == null ? "" : String(game.ourScore));
  const [theirScore, setTheirScore] = useState(game?.theirScore == null ? "" : String(game.theirScore));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let submitLabel = mode === "create" ? "Salvar jogo" : "Salvar alterações";
  if (saving) submitLabel = "Salvando…";

  async function onDelete() {
    if (!game) return;
    if (!window.confirm("Excluir este jogo? Essa ação não pode ser desfeita.")) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível excluir o jogo.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setDeleting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateForm({ championship, opponent, gameDate, gameTime, done, ourScore, theirScore });
    if (validationError) return setError(validationError);

    setSaving(true);
    try {
      const url = mode === "create" ? "/api/games" : `/api/games/${game!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          championship: championship.trim(),
          opponent: opponent.trim(),
          gameDate,
          gameTime,
          status: done ? "realizado" : "agendado",
          ourScore: done ? Number(ourScore) : null,
          theirScore: done ? Number(theirScore) : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível salvar o jogo.");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink-deep/60 backdrop-blur-[2px] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-125 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ink-deep px-[26px] py-5 flex items-center justify-between">
          <div className="font-heading font-bold text-2xl uppercase text-white">
            {mode === "create" ? "Novo jogo" : "Editar jogo"}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="bg-transparent border-none text-muted-4 text-2xl cursor-pointer leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-[26px]">
          <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
            Campeonato ou torneio
          </label>
          <input
            value={championship}
            onChange={(e) => setChampionship(e.target.value)}
            placeholder="Ex.: Campeonato Estadual 2026"
            list="championship-options"
            className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
          />
          <datalist id="championship-options">
            {championships.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <p className="text-xs text-muted-2 mb-4 mt-1">
            Use o mesmo nome pra times diferentes que disputam o mesmo campeonato (ele já sugere os
            existentes).
          </p>

          <div className="flex gap-3.5 mb-4">
            <div className="flex-1">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Adversário
              </label>
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Nome do adversário"
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
              />
            </div>
            <div className="w-45">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Equipe
              </label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3.5 mb-4">
            <div className="flex-1">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Data
              </label>
              <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
              />
            </div>
            <div className="w-32.5">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Horário
              </label>
              <input
                type="time"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-800 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
              className="accent-brand-red w-4 h-4"
            />
            Jogo já realizado (informar placar)
          </label>

          {done && (
            <div className="flex gap-3.5 mb-4 items-end">
              <div className="flex-1">
                <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                  Nosso placar
                </label>
                <input
                  value={ourScore}
                  onChange={(e) => setOurScore(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
                />
              </div>
              <div className="font-heading font-bold text-xl text-muted-2 pb-3">×</div>
              <div className="flex-1">
                <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                  Placar do adversário
                </label>
                <input
                  value={theirScore}
                  onChange={(e) => setTheirScore(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
                />
              </div>
            </div>
          )}

          {error && <p className="text-brand-red text-sm mb-4">{error}</p>}

          <div className="flex justify-between items-center gap-3">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="text-brand-red font-bold text-sm uppercase cursor-pointer bg-transparent border-none hover:underline disabled:opacity-60"
              >
                {deleting ? "Excluindo…" : "Excluir jogo"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11.5 px-5 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase cursor-pointer text-ink"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11.5 px-6 bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase cursor-pointer disabled:opacity-60"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
