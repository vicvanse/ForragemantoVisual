import type { ConsentRecord } from "@/lib/experiment/types";
import { buildConsentArchiveText } from "./consent-archive";
import { getTclePlainText } from "./tcle-content";
import { studyConfig } from "./study-config";

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadConsentCopy(record: ConsentRecord): void {
  const safeCode = record.participantCode.replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadTextFile(`TCLE_${safeCode}.txt`, buildConsentArchiveText(record));
}

export function downloadTcleTemplate(): void {
  downloadTextFile(
    `TCLE_${studyConfig.studyTitle.replace(/\s+/g, "_").slice(0, 40)}.txt`,
    getTclePlainText(),
  );
}
