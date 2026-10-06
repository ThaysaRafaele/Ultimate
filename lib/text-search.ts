// Free-text filter of the "Visão geral" lists: case- and accent-insensitive,
// every typed word must appear in some field ("joao gra" finds JOÃO GRABALOS).
// Pure, so it can run in client components.

export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(query: string, fields: readonly (string | null | undefined)[]): boolean {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeSearch(fields.filter(Boolean).join(" "));
  return words.every((w) => haystack.includes(w));
}
