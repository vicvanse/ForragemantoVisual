/**
 * Persistência de dados do estudo.
 *
 * - Com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → Supabase (produção / Vercel)
 * - Sem Supabase, em desenvolvimento local → pasta data/online
 * - Sem Supabase na Vercel → erro explícito (filesystem é read-only)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { normalizeEmail } from "@/lib/research/participant-record";
import { logApiWarn } from "@/lib/research/safe-api-log";

export function emailToFileKey(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 32);
}

function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isVercel(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function localParticipantsDir(): string {
  return path.join(process.cwd(), "data", "online", "participants");
}

function localBehaviorDir(): string {
  return path.join(process.cwd(), "data", "online", "behavior");
}

function localConsentDir(): string {
  return path.join(process.cwd(), "data", "online", "consent");
}

function storageBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "forrageamento";
}

function safeStorageId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Prefixo Storage: behavior/{baseName}/ */
function behaviorStoragePrefix(baseName: string): string {
  return `behavior/${safeStorageId(baseName)}`;
}

/** Prefixo Storage: consent/{participantId}/[{baseName}/] */
function consentStoragePrefix(participantId: string, baseName?: string): string {
  const pid = safeStorageId(participantId);
  if (baseName) return `consent/${pid}/${safeStorageId(baseName)}`;
  return `consent/${pid}`;
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export type StorageBackend = "supabase" | "local";

export function getStorageBackend(): StorageBackend {
  if (supabaseConfigured()) return "supabase";
  if (isVercel()) {
    throw new Error(
      "Armazenamento não configurado na Vercel. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (veja web/.env.example e supabase/schema.sql).",
    );
  }
  return "local";
}

/* —— Participants —— */

export async function readParticipant(email: string): Promise<ParticipantRecord | null> {
  const backend = getStorageBackend();
  const key = emailToFileKey(email);

  if (backend === "supabase") {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("participants")
      .select("record")
      .eq("email_hash", key)
      .maybeSingle();
    if (error) throw new Error(`Supabase read participant: ${error.message}`);
    return (data?.record as ParticipantRecord) ?? null;
  }

  const file = path.join(localParticipantsDir(), `${key}.json`);
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ParticipantRecord;
  } catch {
    // Compat: data/ na raiz do monorepo (dev antigo)
    try {
      const alt = path.join(process.cwd(), "..", "data", "online", "participants", `${key}.json`);
      const raw = await readFile(alt, "utf8");
      return JSON.parse(raw) as ParticipantRecord;
    } catch {
      return null;
    }
  }
}

export async function writeParticipant(record: ParticipantRecord): Promise<void> {
  const backend = getStorageBackend();
  const key = emailToFileKey(record.email);

  if (backend === "supabase") {
    const sb = getSupabase();
    const { error } = await sb.from("participants").upsert(
      {
        email_hash: key,
        email: normalizeEmail(record.email),
        participant_id: record.participantId,
        record,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email_hash" },
    );
    if (error) throw new Error(`Supabase write participant: ${error.message}`);
    return;
  }

  const dir = localParticipantsDir();
  await ensureDir(dir);
  await writeFile(path.join(dir, `${key}.json`), JSON.stringify(record, null, 2), "utf8");
}

/* —— Session submissions —— */

export interface SubmissionFiles {
  baseName: string;
  participantId: string;
  sessionCondition: number;
  sequenceIndex?: number;
  behavior: unknown;
  summary?: unknown;
  eventsCsv?: string;
  summaryCsv?: string;
  analysisCsv?: string;
  reinforcementsCsv?: string;
  dwellBinsCsv?: string;
  visitsCsv?: string;
  cursorSamplesCsv?: string;
  regionTransitionsCsv?: string;
  txtReport?: string;
  consentJson?: unknown;
  consentTxt?: string;
  signaturePng?: Buffer;
}

export async function saveSubmission(files: SubmissionFiles): Promise<{ backend: StorageBackend }> {
  const backend = getStorageBackend();

  if (backend === "supabase") {
    const sb = getSupabase();
    const { error } = await sb.from("submissions").insert({
      base_name: files.baseName,
      participant_id: files.participantId,
      session_condition: files.sessionCondition,
      sequence_index: files.sequenceIndex ?? null,
      behavior: files.behavior,
      summary: files.summary ?? null,
      events_csv: files.eventsCsv ?? null,
      summary_csv: files.summaryCsv ?? null,
      analysis_csv: files.analysisCsv ?? null,
      reinforcements_csv: files.reinforcementsCsv ?? null,
      dwell_bins_csv: files.dwellBinsCsv ?? null,
      visits_csv: files.visitsCsv ?? null,
      cursor_samples_csv: files.cursorSamplesCsv ?? null,
      region_transitions_csv: files.regionTransitionsCsv ?? null,
      txt_report: files.txtReport ?? null,
      consent_json: files.consentJson ?? null,
      consent_txt: files.consentTxt ?? null,
      signature_base64: files.signaturePng
        ? files.signaturePng.toString("base64")
        : null,
    });
    if (error) throw new Error(`Supabase save submission: ${error.message}`);

    // Storage: behavior/ e consent/ separados (bucket privado)
    const bucket = storageBucketName();
    const behaviorPrefix = behaviorStoragePrefix(files.baseName);
    const consentPrefix = consentStoragePrefix(files.participantId, files.baseName);

    const behaviorUploads: Array<{
      path: string;
      body: Buffer | string;
      contentType: string;
    }> = [
      {
        path: `${behaviorPrefix}/behavior.json`,
        body: JSON.stringify(files.behavior, null, 2),
        contentType: "application/json",
      },
    ];
    if (files.eventsCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_events.csv`,
        body: files.eventsCsv,
        contentType: "text/csv",
      });
    }
    if (files.summaryCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_summary.csv`,
        body: files.summaryCsv,
        contentType: "text/csv",
      });
    }
    if (files.analysisCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_analysis.csv`,
        body: files.analysisCsv,
        contentType: "text/csv",
      });
    }
    if (files.reinforcementsCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_reinforcements.csv`,
        body: files.reinforcementsCsv,
        contentType: "text/csv",
      });
    }
    if (files.dwellBinsCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_dwell_bins.csv`,
        body: files.dwellBinsCsv,
        contentType: "text/csv",
      });
    }
    if (files.visitsCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_visits.csv`,
        body: files.visitsCsv,
        contentType: "text/csv",
      });
    }
    if (files.cursorSamplesCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_cursor_samples.csv`,
        body: files.cursorSamplesCsv,
        contentType: "text/csv",
      });
    }
    if (files.regionTransitionsCsv) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2_region_transitions.csv`,
        body: files.regionTransitionsCsv,
        contentType: "text/csv",
      });
    }
    if (files.txtReport) {
      behaviorUploads.push({
        path: `${behaviorPrefix}/exp2.txt`,
        body: files.txtReport,
        contentType: "text/plain",
      });
    }

    const consentUploads: Array<{
      path: string;
      body: Buffer | string;
      contentType: string;
    }> = [];
    if (files.consentTxt) {
      consentUploads.push({
        path: `${consentPrefix}/consent.txt`,
        body: files.consentTxt,
        contentType: "text/plain",
      });
    }
    if (files.consentJson) {
      consentUploads.push({
        path: `${consentPrefix}/consent.json`,
        body: JSON.stringify(files.consentJson, null, 2),
        contentType: "application/json",
      });
    }
    if (files.signaturePng) {
      consentUploads.push({
        path: `${consentPrefix}/signature.png`,
        body: files.signaturePng,
        contentType: "image/png",
      });
    }

    for (const u of [...behaviorUploads, ...consentUploads]) {
      const body = typeof u.body === "string" ? Buffer.from(u.body, "utf8") : u.body;
      const { error: upErr } = await sb.storage.from(bucket).upload(u.path, body, {
        contentType: u.contentType,
        upsert: true,
      });
      if (upErr) {
        logApiWarn("Supabase storage upload", upErr.message, {
          storagePath: u.path,
          participantId: files.participantId,
          baseName: files.baseName,
        });
      }
    }

    return { backend };
  }

  const behaviorDir = localBehaviorDir();
  const consentDir = path.join(
    localConsentDir(),
    safeStorageId(files.participantId),
    safeStorageId(files.baseName),
  );
  await ensureDir(behaviorDir);
  await ensureDir(consentDir);

  const writeBehavior = async (name: string, data: string | Buffer) => {
    await writeFile(path.join(behaviorDir, `${files.baseName}_${name}`), data);
  };
  const writeConsent = async (name: string, data: string | Buffer) => {
    await writeFile(path.join(consentDir, name), data);
  };

  await writeBehavior("behavior.json", JSON.stringify(files.behavior, null, 2));
  if (files.consentTxt) await writeConsent("consent.txt", files.consentTxt);
  if (files.consentJson) {
    await writeConsent("consent.json", JSON.stringify(files.consentJson, null, 2));
  }
  if (files.eventsCsv) await writeBehavior("exp2_events.csv", files.eventsCsv);
  if (files.summaryCsv) await writeBehavior("exp2_summary.csv", files.summaryCsv);
  if (files.analysisCsv) await writeBehavior("exp2_analysis.csv", files.analysisCsv);
  if (files.reinforcementsCsv) {
    await writeBehavior("exp2_reinforcements.csv", files.reinforcementsCsv);
  }
  if (files.dwellBinsCsv) await writeBehavior("exp2_dwell_bins.csv", files.dwellBinsCsv);
  if (files.visitsCsv) await writeBehavior("exp2_visits.csv", files.visitsCsv);
  if (files.cursorSamplesCsv) {
    await writeBehavior("exp2_cursor_samples.csv", files.cursorSamplesCsv);
  }
  if (files.regionTransitionsCsv) {
    await writeBehavior("exp2_region_transitions.csv", files.regionTransitionsCsv);
  }
  if (files.txtReport) await writeBehavior("exp2.txt", files.txtReport);
  if (files.signaturePng) await writeConsent("signature.png", files.signaturePng);

  return { backend };
}

export async function saveParticipantSignature(
  participantId: string,
  png: Buffer,
): Promise<void> {
  const backend = getStorageBackend();
  const safeId = safeStorageId(participantId);
  if (backend === "supabase") {
    const sb = getSupabase();
    const bucket = storageBucketName();
    const storagePath = `${consentStoragePrefix(participantId)}/signature.png`;
    const { error } = await sb.storage.from(bucket).upload(storagePath, png, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) {
      logApiWarn("Supabase signature upload", error.message, {
        participantId,
        storagePath,
      });
    }
    return;
  }

  const dir = path.join(localConsentDir(), safeId);
  await ensureDir(dir);
  await writeFile(path.join(dir, "signature.png"), png);
}
