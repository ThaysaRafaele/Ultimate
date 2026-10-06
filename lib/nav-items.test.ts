import { describe, expect, it } from "vitest";
import { navPath, profileBackLink } from "@/lib/nav-items";

describe("profileBackLink", () => {
  it("volta para a visão geral de onde a pessoa saiu", () => {
    expect(profileBackLink("/visao-geral?team=adulto&year=2018&aba=jogadores")).toEqual({
      href: "/visao-geral?team=adulto&year=2018&aba=jogadores",
      label: "Voltar para a visão geral",
    });
    expect(profileBackLink("/visao-geral").label).toBe("Voltar para a visão geral");
  });

  it("cai na lista de atletas sem origem ou com origem estranha", () => {
    const atletas = { href: "/", label: "Voltar para atletas" };
    expect(profileBackLink(undefined)).toEqual(atletas);
    expect(profileBackLink("https://site-malicioso.com/visao-geral")).toEqual(atletas);
    expect(profileBackLink("//site-malicioso.com")).toEqual(atletas);
    expect(profileBackLink("/visao-geral-falsa")).toEqual(atletas);
  });
});

describe("navPath", () => {
  it("mantém Visão Geral destacada no perfil aberto a partir dela", () => {
    expect(navPath("/perfil/35", "/visao-geral?team=adulto")).toBe("/visao-geral");
    expect(navPath("/perfil/35", null)).toBe("/perfil/35");
    expect(navPath("/jogos", "/visao-geral")).toBe("/jogos");
  });
});
