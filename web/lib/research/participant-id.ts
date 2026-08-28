import { sanitizeParticipantId } from "@/lib/experiment/constants";

/** Código anônimo — não derivado de nome ou e-mail (CONEP / minimização de dados). */
export function generateAnonymousParticipantId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const ts = Date.now().toString(36);
  return sanitizeParticipantId(`P_${ts}_${hex}`);
}
