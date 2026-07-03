"use client";

import { useRef, useState } from "react";
import { POSITIONS } from "@/lib/teams";
import type { Team } from "@/lib/teams";
import { formatPhoneBR } from "@/lib/format";
import {
  ageLimitError,
  isValidBRPhone,
  isValidEmail,
  maxBirthDateISO,
  MIN_ATHLETE_AGE,
  todayISO,
  withCountryCode,
} from "@/lib/validation";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

type FormValues = {
  name: string;
  teams: string[];
  email: string;
  contact: string;
  birthDate: string;
  entryDate: string;
};

function validateForm(values: FormValues, teamList: Team[]): string | null {
  const { name, teams, email, contact, birthDate, entryDate } = values;

  if (!name.trim()) return "Informe o nome completo do atleta.";
  if (teams.length === 0) return "Selecione ao menos uma equipe.";
  if (!entryDate) return "Informe a data de entrada no time.";
  if (email.trim() && !isValidEmail(email.trim())) return "Informe um e-mail válido.";
  if (contact.trim() && !isValidBRPhone(contact)) return "Informe um telefone válido, com DDD.";
  if (birthDate && birthDate > maxBirthDateISO()) {
    return `Data de nascimento inválida (idade mínima de ${MIN_ATHLETE_AGE} anos).`;
  }
  if (entryDate > todayISO()) return "Data de entrada não pode ser no futuro.";
  if (birthDate && birthDate >= entryDate) return "Data de nascimento deve ser anterior à data de entrada.";

  return ageLimitError(teams, birthDate || null, teamList);
}

function localPhone(contact: string | null): string {
  return contact ? contact.replace(/^\+55\s*/, "") : "";
}

export function AthleteFormModal({
  mode,
  athlete,
  teams,
  defaultTeamId,
  onClose,
  onSaved,
}: Readonly<{
  mode: "create" | "edit";
  athlete?: Athlete;
  teams: Team[];
  defaultTeamId: string;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [name, setName] = useState(athlete?.name ?? "");
  const [selectedTeams, setSelectedTeams] = useState<string[]>(athlete?.teams ?? [defaultTeamId]);
  const [email, setEmail] = useState(athlete?.email ?? "");
  const [contact, setContact] = useState(localPhone(athlete?.contact ?? null));
  const [position, setPosition] = useState<string>(athlete?.position ?? POSITIONS[0]);
  const [number, setNumber] = useState(athlete?.number == null ? "" : String(athlete.number));
  const [birthDate, setBirthDate] = useState(athlete?.birthDate ?? "");
  const [entryDate, setEntryDate] = useState(athlete?.entryDate ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoUrl = athlete?.photoUrl ?? null;
  const [photoPreview, setPhotoPreview] = useState<string | null>(athlete?.photoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contactInputRef = useRef<HTMLInputElement>(null);

  function toggleTeam(teamId: string) {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((t) => t !== teamId) : [...prev, teamId]
    );
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : photoUrl);
  }

  function onContactChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cursorPos = e.target.selectionStart ?? raw.length;
    const digitsBeforeCursor = raw.slice(0, cursorPos).replace(/\D/g, "").length;
    const formatted = formatPhoneBR(raw);
    setContact(formatted);

    requestAnimationFrame(() => {
      const input = contactInputRef.current;
      if (!input) return;
      let seenDigits = 0;
      let newPos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) seenDigits++;
        if (seenDigits === digitsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
      if (digitsBeforeCursor === 0) newPos = 0;
      input.setSelectionRange(newPos, newPos);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateForm(
      { name, teams: selectedTeams, email, contact, birthDate, entryDate },
      teams
    );
    if (validationError) return setError(validationError);

    setSaving(true);
    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(photoFile.name)}`, {
          method: "POST",
          body: photoFile,
        });
        if (!uploadRes.ok) throw new Error("Falha ao enviar a foto.");
        const uploaded = await uploadRes.json();
        finalPhotoUrl = uploaded.url;
      }

      const url = mode === "create" ? "/api/athletes" : `/api/athletes/${athlete!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          teams: selectedTeams,
          position,
          number: number ? Number(number) : null,
          photoUrl: finalPhotoUrl,
          email: email || null,
          contact: contact ? withCountryCode(contact) : null,
          birthDate: birthDate || null,
          entryDate,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível salvar o atleta.");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  let submitLabel = mode === "create" ? "Salvar atleta" : "Salvar alterações";
  if (saving) submitLabel = "Salvando…";

  return (
    <div
      className="fixed inset-0 bg-ink-deep/60 backdrop-blur-[2px] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-[520px] rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ink-deep px-[26px] py-5 flex items-center justify-between">
          <div className="font-heading font-bold text-2xl uppercase text-white">
            {mode === "create" ? "Novo atleta" : "Editar atleta"}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="bg-transparent border-none text-muted-4 text-2xl cursor-pointer leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-[26px]">
          <div className="flex gap-[18px] mb-[18px] items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-bg-subtle-2 border-2 border-dashed border-border-dash flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- may be a local blob: preview, not always an optimizable remote image
                <img src={photoPreview} alt="Prévia da foto" className="object-cover w-full h-full" />
              ) : (
                <span className="font-heading font-bold text-muted-2 text-[13px] text-center leading-tight">
                  FOTO
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickPhoto}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-[13px] uppercase cursor-pointer text-ink"
            >
              Enviar foto
            </button>
          </div>

          <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
            Nome completo
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: João Silva"
            className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] mb-4 text-zinc-800"
          />

          <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
            Times (pode marcar mais de um)
          </label>
          <div className="w-full border-[1.5px] border-border-input rounded-lg px-3.5 py-3 mb-4 grid grid-cols-2 gap-x-3 gap-y-2">
            {teams.map((t) => (
              <label
                key={t.id}
                className={`flex items-center gap-2 text-[14px] cursor-pointer ${
                  t.active ? "text-zinc-800" : "text-muted-2"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(t.id)}
                  onChange={() => toggleTeam(t.id)}
                  className="accent-brand-red w-4 h-4"
                />
                {t.label}
                {t.maxAge != null && ` (até ${t.maxAge} anos)`}
                {!t.active && " (inativo)"}
              </label>
            ))}
          </div>

          <div className="flex gap-3.5 mb-4">
            <div className="flex-1">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="atleta@email.com"
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
              />
            </div>
            <div className="w-52.5">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Contato
              </label>
              <div className="w-full h-12 border-[1.5px] border-border-input rounded-lg flex items-center pl-3.5 pr-2 gap-1.5">
                <span className="text-muted-3 text-[15px] shrink-0">+55</span>
                <input
                  ref={contactInputRef}
                  type="tel"
                  inputMode="tel"
                  value={contact}
                  onChange={onContactChange}
                  placeholder="(67) 91234-5678"
                  className="flex-1 min-w-0 h-full outline-none text-[15px] text-zinc-800"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3.5 mb-4">
            <div className="flex-1">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Posição
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white"
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[110px]">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Número
              </label>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="00"
                inputMode="numeric"
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
              />
            </div>
          </div>

          <div className="flex gap-3.5 mb-6">
            <div className="flex-1">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Data de nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                max={maxBirthDateISO()}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold text-[13px] uppercase tracking-[0.04em] text-muted-3 mb-1.5">
                Data de entrada no time
              </label>
              <input
                type="date"
                value={entryDate}
                max={todayISO()}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full h-12 border-[1.5px] border-border-input rounded-lg px-3.5 text-[15px] text-zinc-800"
              />
            </div>
          </div>

          {error && <p className="text-brand-red text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[46px] px-5 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase cursor-pointer text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-[46px] px-6 bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase cursor-pointer disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
