"use client";

import { useEffect, useState } from "react";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "done" } | { kind: "error"; message: string };

function fileNameFrom(disposition: string | null): string {
  return disposition?.match(/filename="([^"]+)"/)?.[1] ?? "ultimate-visao-geral.xlsx";
}

// Downloads the current "Visão geral" cut (category + year) as .xlsx. The page
// keys it by the cut, so changing category/year clears the old feedback.
export function ExportButton({
  team,
  year,
  disabled,
}: Readonly<{ team: string; year: string; disabled?: boolean }>) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (status.kind !== "done") return;
    const timer = setTimeout(() => setStatus({ kind: "idle" }), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  async function onExport() {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch(`/api/visao-geral/export?${new URLSearchParams({ team, year })}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setStatus({ kind: "error", message: body?.error ?? "Não foi possível gerar a planilha. Tente de novo." });
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(res.headers.get("Content-Disposition"));
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus({ kind: "done" });
    } catch {
      setStatus({ kind: "error", message: "Sem conexão com o servidor. Verifique a internet e tente de novo." });
    }
  }

  const loading = status.kind === "loading";

  return (
    <div className="relative max-md:flex-1">
      <button
        type="button"
        onClick={onExport}
        disabled={disabled || loading}
        title={disabled ? "Não há jogos com placar para exportar" : "Baixar planilha do Excel com o que está na tela"}
        className="h-10 px-4 max-md:w-full inline-flex items-center justify-center gap-2 bg-white text-ink border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase tracking-[0.04em] cursor-pointer hover:border-ink disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border-input whitespace-nowrap"
      >
        {loading ? (
          <span aria-hidden className="w-3.5 h-3.5 border-2 border-muted-3 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg aria-hidden viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {loading ? "Gerando..." : status.kind === "done" ? "Planilha baixada" : "Exportar Excel"}
      </button>
      <p role="status" aria-live="polite" className="sr-only">
        {status.kind === "done" ? "Planilha baixada." : ""}
      </p>
      {status.kind === "error" && (
        <p
          role="alert"
          className="absolute right-0 top-full mt-1.5 z-30 w-max max-w-72 max-md:max-w-none max-md:left-0 text-xs text-brand-red bg-white border border-red-200 rounded-lg px-3 py-2 shadow-sm"
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
