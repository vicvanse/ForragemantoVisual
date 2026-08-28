import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { normalizeEmail } from "@/lib/research/participant-record";

function dataRoot(): string {
  return path.join(process.cwd(), "..", "data", "online", "participants");
}

export function emailToFileKey(email: string): string {
  const norm = normalizeEmail(email);
  return createHash("sha256").update(norm).digest("hex").slice(0, 32);
}

export async function readParticipant(email: string): Promise<ParticipantRecord | null> {
  const key = emailToFileKey(email);
  const file = path.join(dataRoot(), `${key}.json`);
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ParticipantRecord;
  } catch {
    return null;
  }
}

export async function writeParticipant(record: ParticipantRecord): Promise<void> {
  const dir = dataRoot();
  await mkdir(dir, { recursive: true });
  const key = emailToFileKey(record.email);
  const file = path.join(dir, `${key}.json`);
  await writeFile(file, JSON.stringify(record, null, 2), "utf8");
}
