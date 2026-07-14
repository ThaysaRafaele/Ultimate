"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChampionshipWithGameCount } from "@/lib/championships-repo";

export function ChampionshipsManager({
  championships,
}: Readonly<{ championships: ChampionshipWithGameCount[] }>) {
  return (
    <div className="max-w-150">
      <p className="text-xs text-muted-2 mb-6">
        Campeonatos são criados automaticamente ao cadastrar um jogo. Se dois nomes acabaram
        virando entradas separadas por um erro de digitação (ex.: &ldquo;Ferias Cup&rdquo; e
        &ldquo;Férias Cup&rdquo;), use &ldquo;Mesclar&rdquo; para juntar os jogos de um no outro.
      </p>

      <div className="flex flex-col gap-2">
        {championships.map((c) => (
          <ChampionshipRowItem key={c.id} championship={c} allChampionships={championships} />
        ))}
        {championships.length === 0 && (
          <p className="text-muted-2 text-sm">Nenhum campeonato cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}

function ChampionshipRowItem({
  championship,
  allChampionships,
}: Readonly<{
  championship: ChampionshipWithGameCount;
  allChampionships: ChampionshipWithGameCount[];
}>) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [merging, setMerging] = useState(false);
  const [name, setName] = useState(championship.name);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherChampionships = allChampionships.filter((c) => c.id !== championship.id);

  async function onSaveRename() {
    if (!name.trim()) return setError("Informe o nome do campeonato.");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/championships/${championship.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível renomear o campeonato.");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  function onCancelRename() {
    setName(championship.name);
    setError(null);
    setEditing(false);
  }

  async function onConfirmMerge() {
    if (!mergeTargetId) return setError("Escolha o campeonato de destino.");
    const target = allChampionships.find((c) => c.id === mergeTargetId);
    const confirmed = window.confirm(
      `Mesclar "${championship.name}" (${championship.gameCount} jogo${
        championship.gameCount === 1 ? "" : "s"
      }) em "${target?.name}"? Os jogos passam a pertencer a "${target?.name}" e "${championship.name}" é removido. Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/championships/${championship.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: mergeTargetId }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível mesclar os campeonatos.");
      }
      setMerging(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="bg-white border border-border-light rounded-lg px-4 py-3">
        <div className="flex gap-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 h-10 border-[1.5px] border-border-input rounded-lg px-3 text-sm text-zinc-800"
          />
          <button
            type="button"
            onClick={onSaveRename}
            disabled={saving}
            className="h-10 px-3.5 bg-brand-red text-white border-none rounded-lg font-bold text-xs uppercase cursor-pointer disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={onCancelRename}
            className="h-10 px-3.5 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-xs uppercase cursor-pointer text-ink"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="text-brand-red text-xs mt-2">{error}</p>}
      </div>
    );
  }

  if (merging) {
    return (
      <div className="bg-white border border-border-light rounded-lg px-4 py-3">
        <div className="text-sm text-zinc-800 mb-2">
          Mesclar <span className="font-semibold">{championship.name}</span> em:
        </div>
        <div className="flex gap-2.5">
          <select
            value={mergeTargetId}
            onChange={(e) => setMergeTargetId(e.target.value)}
            className="flex-1 h-10 border-[1.5px] border-border-input rounded-lg px-3 text-sm text-zinc-800 bg-white"
          >
            <option value="">Selecione o destino…</option>
            {otherChampionships.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.gameCount} jogo{c.gameCount === 1 ? "" : "s"})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onConfirmMerge}
            disabled={saving || !mergeTargetId}
            className="h-10 px-3.5 bg-brand-red text-white border-none rounded-lg font-bold text-xs uppercase cursor-pointer disabled:opacity-60"
          >
            {saving ? "Mesclando…" : "Mesclar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMerging(false);
              setError(null);
            }}
            className="h-10 px-3.5 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-xs uppercase cursor-pointer text-ink"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="text-brand-red text-xs mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white border border-border-light rounded-lg px-4 py-3">
      <span className="font-semibold text-ink">
        {championship.name}{" "}
        <span className="text-muted-2 font-normal text-sm">
          · {championship.gameCount} jogo{championship.gameCount === 1 ? "" : "s"}
        </span>
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="h-9 px-4 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-xs uppercase cursor-pointer text-ink hover:border-ink"
        >
          Editar
        </button>
        {otherChampionships.length > 0 && (
          <button
            onClick={() => setMerging(true)}
            className="h-9 px-4 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-xs uppercase cursor-pointer text-ink hover:border-ink"
          >
            Mesclar
          </button>
        )}
      </div>
    </div>
  );
}
