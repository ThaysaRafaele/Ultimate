"use client";

import { useEffect, useState } from "react";
import { formatDateBR } from "@/lib/format";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function LineupModal({
  game,
  teamAthletes,
  onClose,
}: Readonly<{
  game: GameWithChampionship;
  teamAthletes: Athlete[];
  onClose: () => void;
}>) {
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Busca só entra em ação a partir de 3 caracteres, pra não filtrar tudo
  // fora a cada tecla enquanto o técnico ainda está começando a digitar.
  const term = search.trim().toLowerCase();
  const visibleAthletes =
    term.length >= 3
      ? teamAthletes.filter(
          (a) => a.name.toLowerCase().includes(term) || a.nickname?.toLowerCase().includes(term)
        )
      : teamAthletes;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games/${game.id}/lineup`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSelected(data.athleteIds ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [game.id]);

  function toggle(athleteId: number) {
    setSelected((prev) =>
      prev.includes(athleteId) ? prev.filter((id) => id !== athleteId) : [...prev, athleteId]
    );
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.id}/lineup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteIds: selected }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível salvar a escalação.");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink-deep/60 backdrop-blur-[2px] flex items-center justify-center max-md:items-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-125 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col max-md:w-full max-md:rounded-none max-md:rounded-t-2xl max-md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ink-deep px-[26px] py-5 flex items-center justify-between shrink-0">
          <div>
            <div className="font-heading font-bold text-2xl uppercase text-white">Escalação</div>
            <div className="text-xs text-muted-1">
              Ultimate vs {game.opponent} · {formatDateBR(game.gameDate)} · {game.gameTime}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="bg-transparent border-none text-muted-4 text-2xl cursor-pointer leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-[26px] overflow-y-auto flex-1">
          {!loading && teamAthletes.length > 0 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar atleta (mín. 3 letras)…"
              className="w-full h-10 border-[1.5px] border-border-input rounded-lg px-3.5 text-sm text-zinc-800 mb-3.5"
            />
          )}
          {loading ? (
            <p className="text-muted-2 text-sm">Carregando…</p>
          ) : teamAthletes.length === 0 ? (
            <p className="text-muted-2 text-sm">Nenhum atleta ativo nessa equipe ainda.</p>
          ) : visibleAthletes.length === 0 ? (
            <p className="text-muted-2 text-sm">Nenhum atleta encontrado para &ldquo;{search.trim()}&rdquo;.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {visibleAthletes.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 text-[14px] text-zinc-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={() => toggle(a.id)}
                    className="accent-brand-red w-4 h-4"
                  />
                  {a.nickname || a.name}
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-brand-red text-sm mt-4">{error}</p>}
        </div>

        <div className="px-[26px] py-5 border-t border-border-light flex justify-between items-center shrink-0">
          <span className="text-sm text-muted-2">
            {selected.length} escalado{selected.length === 1 ? "" : "s"}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11.5 px-5 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase cursor-pointer text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || loading}
              className="h-11.5 px-6 bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase cursor-pointer disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar escalação"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
