import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { findTeamLabel } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";

export default async function ImportarPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ team?: string }>;
}>) {
  const { team } = await searchParams;

  const allTeams = await getAllTeams();
  const activeTeams = allTeams.filter((t) => t.active);
  const teamId = activeTeams.some((t) => t.id === team) ? team! : (activeTeams[0]?.id ?? "");

  return (
    <div className="flex-1 flex flex-col">
      <Header team={teamId} teams={activeTeams} />
      <NavBar />
      <main className="flex-1 px-10 max-md:px-4 py-8 max-md:py-5 pb-14">
        <div className="max-w-250 mx-auto">
          <Link
            href={`/?team=${teamId}`}
            className="bg-transparent border-none text-muted-1 font-semibold text-sm cursor-pointer mb-3.5 p-0 inline-block hover:text-ink"
          >
            ← Voltar para atletas
          </Link>
          <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
            {findTeamLabel(allTeams, teamId)}
          </div>
          <h1 className="font-heading font-bold text-[40px] max-md:text-[28px] uppercase mt-0.5 mb-6 text-ink">
            Importar atletas
          </h1>

          <div className="bg-white border-2 border-dashed border-border-dash rounded-2xl p-11 max-md:p-6 text-center">
            <div className="font-heading font-bold text-xl uppercase text-ink mb-2">
              Importação em breve
            </div>
            <p className="text-sm text-muted-2 max-w-125 mx-auto">
              A planilha atual do time reúne vários anos de dados espalhados em diversas abas.
              Antes de automatizar a importação, vamos cadastrar os atletas por aqui mesmo: o
              botão &ldquo;+ Novo atleta&rdquo; já está pronto pra isso. A importação direta da planilha fica
              para uma próxima etapa.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
