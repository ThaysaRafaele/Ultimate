export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function numLabel(number: number | null): string {
  return number == null ? "—" : `#${number}`;
}

export function entryYear(entryDate: string): string {
  return entryDate.slice(0, 4);
}
