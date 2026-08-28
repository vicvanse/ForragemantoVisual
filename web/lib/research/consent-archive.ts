import type { ConsentRecord } from "@/lib/experiment/types";
import { getTclePlainText } from "./tcle-content";

export function buildConsentArchiveText(record: ConsentRecord): string {
  return [
    getTclePlainText(),
    "",
    "REGISTRO DE CONSENTIMENTO",
    `Versão TCLE: ${record.tcleVersion}`,
    `Nome: ${record.fullName}`,
    `E-mail: ${record.email}`,
    `Data/hora (ISO): ${record.signedAt}`,
    `Fuso horário: ${record.timezone}`,
    `Código anônimo: ${record.participantCode}`,
    `Maior de ${record.minAgeConfirmed ? "sim" : "não"} (${record.minAge}+ anos)`,
    "Consentimento: voluntário, livre e esclarecido",
    "",
    "Nota: nome e e-mail deste arquivo não são vinculados aos arquivos comportamentais (behavior.json / CSV de eventos).",
    "",
    "Assinatura digital registrada em formato PNG (anexo separado, se aplicável).",
  ].join("\n");
}
