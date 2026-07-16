import Link from "next/link";
import Image from "next/image";
import { ChampionshipsManager } from "@/components/ChampionshipsManager";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { getChampionshipsWithGameCount } from "@/lib/championships-repo";

// No dynamic segments/searchParams here, so Next would otherwise prerender
// this page once at build/deploy time — see the same fix on /times.
export const dynamic = "force-dynamic";

export default async function CampeonatosPage() {
  const championships = await getChampionshipsWithGameCount();

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-[72px] bg-ink-deep flex items-center gap-5 px-6 flex-shrink-0">
        <MobileNavDrawer />
        <Image src="/logo.png" alt="Ultimate" height={44} width={44} className="h-11 w-auto block" priority />
      </header>
      <main className="flex-1 px-10 max-md:px-4 py-8 max-md:py-5 pb-14">
        <div className="max-w-150 mx-auto">
          <Link
            href="/"
            className="bg-transparent border-none text-muted-1 font-semibold text-sm cursor-pointer mb-3.5 p-0 inline-block hover:text-ink"
          >
            ← Voltar para atletas
          </Link>
          <h1 className="font-heading font-bold text-[40px] max-md:text-[28px] uppercase mt-0.5 mb-6 text-ink">
            Gerenciar campeonatos
          </h1>
          <ChampionshipsManager championships={championships} />
        </div>
      </main>
    </div>
  );
}
