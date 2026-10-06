"use client";

import Link from "next/link";

export default function VisaoGeralError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center bg-zinc-100">
      <p className="font-heading font-bold text-2xl uppercase text-ink">
        Não deu para carregar a visão geral
      </p>
      <p className="text-sm text-muted-2 max-w-100">
        Pode ser uma falha momentânea de conexão com o banco. Tente de novo em alguns segundos.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-10 px-4 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg font-bold text-sm uppercase cursor-pointer"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="h-10 px-4 border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase text-ink flex items-center"
        >
          Voltar para atletas
        </Link>
      </div>
    </div>
  );
}
