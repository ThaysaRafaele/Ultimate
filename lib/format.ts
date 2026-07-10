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

export function timeAgo(date: string | Date): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));

  if (seconds < 60) return "Agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Há ${days} dia${days === 1 ? "" : "s"}`;
  return formatDateBR(then.toISOString());
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
