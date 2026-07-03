"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamRow } from "@/lib/teams-repo";

function teamRowLabel(t: TeamRow): string {
  return t.maxAge == null ? t.label : `${t.label} · até ${t.maxAge} anos`;
}

export function TeamsManager({ teams }: Readonly<{ teams: TeamRow[] }>) {
  const [label, setLabel] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const active = teams.filter((t) => t.active);
  const inactive = teams.filter((t) => !t.active);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return setError("Informe o nome da categoria.");

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), maxAge: maxAge ? Number(maxAge) : null }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível criar a categoria.");
      }
      setLabel("");
      setMaxAge("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(team: TeamRow) {
    await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !team.active }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-150">
      <form onSubmit={onAdd} className="flex gap-2.5 mb-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome da nova categoria (ex.: Sub 14)"
          className="flex-1 h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
        />
        <input
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value.replace(/\D/g, ""))}
          placeholder="Idade máx."
          inputMode="numeric"
          className="w-32.5 h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
        />
        <button
          type="submit"
          disabled={saving}
          className="h-12 px-5 bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase cursor-pointer disabled:opacity-60"
        >
          {saving ? "Adicionando…" : "Adicionar"}
        </button>
      </form>
      <p className="text-xs text-muted-2 mb-6">
        Idade máxima é opcional — preencha só pra categorias de base (ex.: Sub 16 → 16). Ela
        impede vincular um atleta mais velho do que isso à categoria.
      </p>
      {error && <p className="text-brand-red text-sm mb-4">{error}</p>}

      <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold mb-2">
        Ativas
      </div>
      <div className="flex flex-col gap-2 mb-6">
        {active.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between bg-white border border-border-light rounded-lg px-4 py-3"
          >
            <span className="font-semibold text-ink">{teamRowLabel(t)}</span>
            <button
              onClick={() => toggleActive(t)}
              className="h-9 px-4 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-xs uppercase cursor-pointer text-ink hover:border-ink"
            >
              Inativar
            </button>
          </div>
        ))}
        {active.length === 0 && <p className="text-muted-2 text-sm">Nenhuma categoria ativa.</p>}
      </div>

      {inactive.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold mb-2">
            Inativas
          </div>
          <div className="flex flex-col gap-2">
            {inactive.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-bg-subtle rounded-lg px-4 py-3"
              >
                <span className="font-semibold text-muted-2">{teamRowLabel(t)}</span>
                <button
                  onClick={() => toggleActive(t)}
                  className="h-9 px-4 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-xs uppercase cursor-pointer text-ink hover:border-ink"
                >
                  Reativar
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
