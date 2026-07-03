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
