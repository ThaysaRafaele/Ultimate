export type NavItem = {
  label: string;
  href: string | null;
  isActive: (pathname: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Atletas",
    href: "/",
    isActive: (p) => p === "/" || p.startsWith("/importar") || p.startsWith("/perfil"),
  },
  { label: "Jogos", href: "/jogos", isActive: (p) => p.startsWith("/jogos") },
  { label: "Escalação", href: "/escalacao", isActive: (p) => p.startsWith("/escalacao") },
  { label: "Estatísticas", href: "/estatisticas", isActive: (p) => p.startsWith("/estatisticas") },
  { label: "Visão Geral", href: null, isActive: () => false },
];
