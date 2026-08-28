/** Código numérico anônimo (ex.: 0047) — não derivado de nome ou e-mail. */
export function generateAnonymousParticipantId(): string {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const n = ((bytes[0]! << 8) | bytes[1]!) % 10000;
  return String(n).padStart(4, "0");
}
