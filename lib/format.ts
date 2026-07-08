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

export function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const MONTH_ABBR = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function gameDay(iso: string): string {
  return iso.slice(8, 10);
}

export function gameMonth(iso: string): string {
  const monthIndex = Number(iso.slice(5, 7)) - 1;
  return MONTH_ABBR[monthIndex] ?? "";
}

// Formats only the local part (DDD + number); the "+55" country code is
// rendered as a static prefix outside the editable input, not baked into
// this string — mixing literal digit characters into the mask breaks
// cursor-position tracking while typing.
export function formatPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  let out = `(${ddd}`;
  if (digits.length >= 2) out += ")";

  if (rest) {
    const splitAt = digits.length > 10 ? 5 : 4;
    out += rest.length > splitAt ? ` ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}` : ` ${rest}`;
  }

  return out;
}
