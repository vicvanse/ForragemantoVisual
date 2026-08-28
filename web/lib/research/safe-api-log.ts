/**
 * Logs de API sem e-mail, assinatura ou blobs base64 (minimização LGPD / CONEP).
 */

const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const DATA_URL_RE = /data:[^;]+;base64,[A-Za-z0-9+/=\s]+/g;
const JSON_SENSITIVE_FIELD_RE =
  /"(?:email|signatureDataUrl|signature_base64|fullName)"\s*:\s*"[^"]*"/gi;

export interface SafeLogMeta {
  action?: string;
  participantId?: string;
  baseName?: string;
  backend?: string;
  storagePath?: string;
}

function truncate(text: string, max = 400): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function sanitizeForLog(value: unknown): string {
  if (value === null || value === undefined) return String(value);

  if (value instanceof Error) {
    return sanitizeForLog(value.message || value.name);
  }

  let text: string;
  if (typeof value === "string") {
    text = value;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }

  text = text.replace(DATA_URL_RE, "[signature_redacted]");
  text = text.replace(JSON_SENSITIVE_FIELD_RE, (match) => {
    const key = match.split(":")[0] ?? "field";
    return `${key}:"[redacted]"`;
  });
  text = text.replace(EMAIL_RE, "[email_redacted]");

  return truncate(text);
}

export function logApiError(
  context: string,
  err: unknown,
  meta?: SafeLogMeta,
): void {
  const parts = [context, sanitizeForLog(err)];
  if (meta && Object.keys(meta).length) {
    parts.push(sanitizeForLog(meta));
  }
  console.error(parts.join(" | "));
}

export function logApiWarn(
  context: string,
  message: string,
  meta?: SafeLogMeta,
): void {
  const parts = [context, sanitizeForLog(message)];
  if (meta && Object.keys(meta).length) {
    parts.push(sanitizeForLog(meta));
  }
  console.warn(parts.join(" | "));
}
