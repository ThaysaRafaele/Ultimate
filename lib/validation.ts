const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export const MIN_ATHLETE_AGE = 10;

// Uses local calendar date parts rather than toISOString() (which is UTC-based
// and can land on the wrong day depending on the runtime's timezone/time of day).
function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toLocalISODate(new Date());
}

export function maxBirthDateISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_ATHLETE_AGE);
  return toLocalISODate(d);
}

const BR_COUNTRY_CODE_RE = /^\+55\s*/;

// Accepts either the local part ("(67) 99123-4567") or the full stored
// value with country code ("+55 (67) 99123-4567") — the "+55" is a fixed
// literal prefix we control, so stripping it here is unambiguous.
export function isValidBRPhone(value: string): boolean {
  const local = value.replace(BR_COUNTRY_CODE_RE, "");
  const digitCount = local.replace(/\D/g, "").length;
  return [10, 11].includes(digitCount);
}

export function withCountryCode(localPhone: string): string {
  return `+55 ${localPhone}`;
}

type AthletePayload = {
  name?: unknown;
  team?: unknown;
  position?: unknown;
  email?: unknown;
  contact?: unknown;
  birthDate?: unknown;
  entryDate?: unknown;
};

// Shared by POST /api/athletes and PUT /api/athletes/[id] so both entry
// points enforce the same rules server-side (client-side checks in
// AthleteFormModal can't be trusted alone).
export function validateAthletePayload(
  body: AthletePayload,
  teamIds: readonly string[],
  positions: readonly string[]
): string | null {
  const { name, team, position, email, contact, birthDate, entryDate } = body;

  if (typeof name !== "string" || name.trim() === "") return "Nome é obrigatório.";
  if (typeof team !== "string" || !teamIds.includes(team)) return "Equipe inválida.";
  if (typeof position !== "string" || !positions.includes(position)) return "Posição inválida.";
  if (typeof entryDate !== "string" || entryDate.trim() === "") return "Data de entrada é obrigatória.";
  if (typeof email === "string" && email && !isValidEmail(email)) return "E-mail inválido.";
  if (typeof contact === "string" && contact && !isValidBRPhone(contact)) return "Telefone inválido.";
  if (typeof birthDate === "string" && birthDate && birthDate > maxBirthDateISO()) {
    return `Data de nascimento inválida (idade mínima de ${MIN_ATHLETE_AGE} anos).`;
  }
  if (entryDate > todayISO()) return "Data de entrada não pode ser no futuro.";
  if (typeof birthDate === "string" && birthDate && birthDate >= entryDate) {
    return "Data de nascimento deve ser anterior à data de entrada.";
  }

  return null;
}
