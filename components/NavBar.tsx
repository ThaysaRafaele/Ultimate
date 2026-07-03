import Link from "next/link";

const NAV_ITEMS = [
  { label: "Atletas", href: "/", active: true },
  { label: "Jogos", active: false },
  { label: "Escalação", active: false },
  { label: "Estatísticas", active: false },
  { label: "Visão Geral", active: false },
] as const;

export function NavBar() {
  return (
    <nav className="bg-brand-red h-[50px] flex items-stretch px-6 flex-shrink-0">
      {NAV_ITEMS.map((item) =>
        item.active ? (
          <Link
            key={item.label}
            href={item.href}
            className="bg-transparent text-white font-heading font-bold text-[15px] tracking-[0.06em] uppercase px-5 h-full flex items-center border-b-[3px] border-white"
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={item.label}
            disabled
            title="Em breve"
            className="bg-transparent text-white/80 font-heading font-bold text-[15px] tracking-[0.06em] uppercase px-5 h-full flex items-center border-b-[3px] border-transparent cursor-not-allowed"
          >
            {item.label}
          </button>
        )
      )}
    </nav>
  );
}