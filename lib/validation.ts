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

// Completed years between two ISO dates (YYYY-MM-DD), not a plain year
// subtraction — someone born 2008-07-10 isn't 18 until that date in 2026.
export function ageInYears(birthDateISO: string, atISO: string): number {
  const [by, bm, bd] = birthDateISO.split("-").map(Number);
  const [ay, am, ad] = atISO.split("-").map(Number);

  let age = ay - by;
  if (am < bm || (am === bm && ad < bd)) age -= 1;
  return age;
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
  teams?: unknown;
  position?: unknown;
  email?: unknown;
  contact?: unknown;
  birthDate?: unknown;
  entryDate?: unknown;
  height?: unknown;
};

export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;

export type TeamAgeRule = { id: string; label: string; maxAge: number | null };

function isValidTeamList(teams: unknown, teamIds: readonly string[]): teams is string[] {
  return (
    Array.isArray(teams) &&
    teams.length > 0 &&
    teams.every((t) => typeof t === "string" && teamIds.includes(t))
  );
}

export function ageLimitError(
  selectedTeams: string[],
  birthDate: string | null,
  teamList: readonly TeamAgeRule[]
): string | null {
  const capped = teamList.filter((t) => selectedTeams.includes(t.id) && t.maxAge != null);
  if (capped.length === 0) return null;

  if (!birthDate) {
    return `Informe a data de nascimento para vincular o atleta a ${capped[0].label}.`;
  }

  const age = ageInYears(birthDate, todayISO());
  const exceeded = capped.find((t) => age > (t.maxAge as number));
  if (exceeded) {
    return `Atleta com ${age} anos não pode ser vinculado a ${exceeded.label} (máximo ${exceeded.maxAge} anos completos).`;
  }

  return null;
}

function birthAndEntryDateError(birthDate: unknown, entryDate: string): string | null {
  if (typeof birthDate === "string" && birthDate && birthDate > maxBirthDateISO()) {
    return `Data de nascimento inválida (idade mínima de ${MIN_ATHLETE_AGE} anos).`;
  }
  if (entryDate > todayISO()) return "Data de entrada não pode ser no futuro.";
  if (typeof birthDate === "string" && birthDate && birthDate >= entryDate) {
    return "Data de nascimento deve ser anterior à data de entrada.";
  }
  return null;
}

function heightError(height: unknown): string | null {
  if (height == null) return null;
  if (typeof height !== "number" || height < MIN_HEIGHT_CM || height > MAX_HEIGHT_CM) {
    return `Altura deve estar entre ${MIN_HEIGHT_CM} e ${MAX_HEIGHT_CM} cm.`;
  }
  return null;
}

// Shared by POST /api/athletes and PUT /api/athletes/[id] so both entry
// points enforce the same rules server-side (client-side checks in
// AthleteFormModal can't be trusted alone).
export function validateAthletePayload(
  body: AthletePayload,
  teamList: readonly TeamAgeRule[],
  positions: readonly string[]
): string | null {
  const { name, teams, position, email, contact, birthDate, entryDate, height } = body;
  const teamIds = teamList.map((t) => t.id);

  if (typeof name !== "string" || name.trim() === "") return "Nome é obrigatório.";
  if (!isValidTeamList(teams, teamIds)) return "Selecione ao menos uma equipe válida.";
  if (typeof position !== "string" || !positions.includes(position)) return "Posição inválida.";
  if (typeof entryDate !== "string" || entryDate.trim() === "") return "Data de entrada é obrigatória.";
  if (typeof email === "string" && email && !isValidEmail(email)) return "E-mail inválido.";
  if (typeof contact === "string" && contact && !isValidBRPhone(contact)) return "Telefone inválido.";

  const dateError = birthAndEntryDateError(birthDate, entryDate);
  if (dateError) return dateError;

  const ageError = ageLimitError(teams, (birthDate as string) || null, teamList);
  if (ageError) return ageError;

  return heightError(height);
}
