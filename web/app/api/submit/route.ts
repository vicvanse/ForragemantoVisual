import { NextResponse } from "next/server";
import {
  buildExp2AnalysisExports,
  buildExp2TxtReport,
} from "@/lib/experiment/analysis-export";
import {
  cursorSamplesToCsv,
  regionTransitionsToCsv,
  type CursorSampleRow,
  type RegionTransitionRow,
} from "@/lib/experiment/cursor-sampling";
import { getTemplateForRatio } from "@/lib/experiment/session-sequence";
import type { Exp2EventRow, Exp2SummaryRow } from "@/lib/experiment/types";
import { buildConsentArchiveText } from "@/lib/research/consent-archive";
import { saveSubmission } from "@/lib/research/data-store";
import { logApiError } from "@/lib/research/safe-api-log";

export async function POST(request: Request) {
  let participantId = "unknown";
  let baseName: string | undefined;
  try {
    const body = await request.json();
    const summary = body?.summary as Exp2SummaryRow | undefined;
    const events = (body?.events ?? []) as Exp2EventRow[];
    participantId = String(summary?.participant_id || "unknown");
    const session = summary?.session_condition ?? 0;
    const sessionRun = summary?.session_run ?? 1;
    const sequenceIndex = body?.metadata?.sequenceIndex;
    const ratioLabel = String(summary?.ratio_label || body?.metadata?.ratioLabel || "");
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

    const safeId = participantId.replace(/[^a-zA-Z0-9_-]/g, "_");
    baseName = `forrageamento_online_exp2_${safeId}_s${session}_r${sessionRun}_${ts}`;

    const consent = body.consent;
    const cursorSamples = (body?.cursorSamples ?? []) as CursorSampleRow[];
    const regionTransitions = (body?.regionTransitions ?? []) as RegionTransitionRow[];

    const template = ratioLabel ? getTemplateForRatio(ratioLabel) : null;
    const sessionRow = template
      ? {
          session: Number(session),
          ratio_label: template.ratio_label,
          w_esq: template.w_esq,
          w_dir: template.w_dir,
          n_L_left: template.n_L_left,
          n_L_right: template.n_L_right,
          correctkey: template.correctkey,
          duration_s: summary?.duration_s_planned ?? 0,
        }
      : undefined;

    const analysisExports =
      summary && events.length
        ? buildExp2AnalysisExports(events, summary, sessionRow, {
            cursorSamples,
          })
        : null;

    const txtReport =
      summary && events.length
        ? buildExp2TxtReport({
            participantId,
            sessionCondition: Number(session),
            sessionRun: Number(sessionRun),
            timestamp: new Date().toISOString(),
            mode: "online_mouse (cursor)",
            note: "Versão web — amostras de cursor equivalentes operacionalmente ao gaze.",
            summary,
            eventRows: events,
          })
        : undefined;

    const behavioralPayload = {
      metadata: body.metadata,
      events,
      summary,
      cursorSamples,
      regionTransitions,
    };

    let signaturePng: Buffer | undefined;
    if (consent?.signatureDataUrl) {
      const b64 = String(consent.signatureDataUrl).replace(/^data:image\/png;base64,/, "");
      signaturePng = Buffer.from(b64, "base64");
    }

    const { backend } = await saveSubmission({
      baseName,
      participantId,
      sessionCondition: Number(session),
      sequenceIndex: sequenceIndex != null ? Number(sequenceIndex) : undefined,
      behavior: behavioralPayload,
      summary,
      eventsCsv: body.eventsCsv,
      summaryCsv: body.summaryCsv,
      analysisCsv: analysisExports?.analysisCsv,
      reinforcementsCsv: analysisExports?.reinforcementsCsv,
      dwellBinsCsv: analysisExports?.dwellBinsCsv,
      visitsCsv: analysisExports?.visitsCsv,
      cursorSamplesCsv: cursorSamples.length ? cursorSamplesToCsv(cursorSamples) : undefined,
      regionTransitionsCsv: regionTransitions.length
        ? regionTransitionsToCsv(regionTransitions)
        : undefined,
      txtReport,
      consentJson: consent
        ? {
            ...consent,
            signatureDataUrl: consent.signatureDataUrl ? "[stored_as_png]" : "",
          }
        : undefined,
      consentTxt: consent ? buildConsentArchiveText(consent) : undefined,
      signaturePng,
    });

    return NextResponse.json({ ok: true, baseName, backend });
  } catch (err) {
    logApiError("Submit POST", err, { participantId, baseName });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar" },
      { status: 500 },
    );
  }
}
