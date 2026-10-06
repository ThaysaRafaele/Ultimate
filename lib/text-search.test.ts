import { describe, expect, it } from "vitest";
import { matchesSearch } from "@/lib/text-search";

describe("matchesSearch", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(matchesSearch("joao", ["JOÃO GRABALOS"])).toBe(true);
    expect(matchesSearch("AMÉRICA", ["America"])).toBe(true);
  });

  it("exige todas as palavras, em qualquer campo", () => {
    expect(matchesSearch("joao gra", ["JOÃO", "JOÃO GRABALOS"])).toBe(true);
    expect(matchesSearch("neon copa", ["Neon", "Copa Ucdb"])).toBe(true);
    expect(matchesSearch("neon nbms", ["Neon", "Copa Ucdb"])).toBe(false);
  });

  it("busca vazia mostra tudo e campos nulos não quebram", () => {
    expect(matchesSearch("   ", ["IBRA"])).toBe(true);
    expect(matchesSearch("ibra", [null, undefined, "IBRAHIM"])).toBe(true);
  });
});
