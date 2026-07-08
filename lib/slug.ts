const COMBINING_DIACRITICS_RE = /[̀-ͯ]/g;

export function slugify(label: string): string {
  return label
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_RE, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(label: string, existingIds: ReadonlySet<string>, fallback = "item"): string {
  const base = slugify(label) || fallback;
  let id = base;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}
