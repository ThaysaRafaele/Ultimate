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
  { label: "Visão Geral", href: "/visao-geral", isActive: (p) => p.startsWith("/visao-geral") },
];

// Profile opened from the "Visão geral" carries ?voltar=<that page's URL>, so
// the back link returns to the same category/year/tab. Only internal overview
// paths are accepted (never an external URL); anything else falls back to the
// athletes list.
export function profileBackLink(voltar: string | null | undefined): { href: string; label: string } {
  if (voltar && /^\/visao-geral(?:[?#]|$)/.test(voltar)) {
    return { href: voltar, label: "Voltar para a visão geral" };
  }
  return { href: "/", label: "Voltar para atletas" };
}

// Path that decides the highlighted nav item: a profile opened from the
// overview keeps "Visão Geral" highlighted.
export function navPath(pathname: string, voltar: string | null): string {
  return pathname.startsWith("/perfil") && profileBackLink(voltar).href !== "/" ? "/visao-geral" : pathname;
}
