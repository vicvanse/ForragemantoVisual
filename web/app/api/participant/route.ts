import { NextResponse } from "next/server";
import { buildParticipantSessionSequence } from "@/lib/experiment/session-sequence";
import { generateAnonymousParticipantId } from "@/lib/research/participant-id";
import {
  isStudyComplete,
  isCompletedSessionRecordValid,
  nextPendingIndex,
  normalizeEmail,
  type ParticipantRecord,
} from "@/lib/research/participant-record";
import {
  readParticipant,
  saveParticipantSignature,
  writeParticipant,
} from "@/lib/research/data-store";
import { logApiError } from "@/lib/research/safe-api-log";

export async function GET(request: Request) {
  try {
    const email = normalizeEmail(new URL(request.url).searchParams.get("email") || "");
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }
    const record = await readParticipant(email);
    if (!record) return NextResponse.json({ found: false });
    return NextResponse.json({
      found: true,
      record: {
        ...record,
        nextSequenceIndex: nextPendingIndex(record),
        studyComplete: isStudyComplete(record),
      },
    });
  } catch (err) {
    logApiError("Participant GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let action = "unknown";
  try {
    const body = await request.json();
    action = String(body.action || "upsert");
    const email = normalizeEmail(String(body.email || ""));
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    if (action === "register") {
      const existing = await readParticipant(email);
      if (existing) {
        return NextResponse.json({
          ok: true,
          record: {
            ...existing,
            nextSequenceIndex: nextPendingIndex(existing),
            studyComplete: isStudyComplete(existing),
          },
        });
      }

      const participantId = generateAnonymousParticipantId();
      const sequence = buildParticipantSessionSequence(email);
      const now = new Date().toISOString();
      const record: ParticipantRecord = {
        email,
        participantId,
        fullName: String(body.fullName || "").trim(),
        consentSigned: false,
        sequence,
        completedSessions: [],
        nextSequenceIndex: 0,
        createdAt: now,
        updatedAt: now,
        studyComplete: false,
      };
      await writeParticipant(record);
      return NextResponse.json({ ok: true, record });
    }

    if (action === "save_consent") {
      const existing = await readParticipant(email);
      if (!existing) {
        return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
      }
      const consent = body.consent;
      existing.consentSigned = true;
      existing.fullName = String(consent?.fullName || existing.fullName || "").trim();
      existing.consent = {
        tcleVersion: consent.tcleVersion,
        participantCode: existing.participantId,
        fullName: existing.fullName,
        email: existing.email,
        minAge: consent.minAge,
        minAgeConfirmed: consent.minAgeConfirmed,
        agreed: consent.agreed,
        lgpdAcknowledged: consent.lgpdAcknowledged,
        withdrawAcknowledged: consent.withdrawAcknowledged,
        consentCopyRequested: consent.consentCopyRequested,
        signedAt: consent.signedAt,
        timezone: consent.timezone,
        locale: consent.locale,
        userAgent: consent.userAgent,
        hasSignature: Boolean(consent.signatureDataUrl),
      };
      if (consent) consent.participantCode = existing.participantId;
      existing.updatedAt = new Date().toISOString();
      await writeParticipant(existing);

      if (consent?.signatureDataUrl) {
        const b64 = String(consent.signatureDataUrl).replace(/^data:image\/png;base64,/, "");
        await saveParticipantSignature(existing.participantId, Buffer.from(b64, "base64"));
      }

      return NextResponse.json({
        ok: true,
        record: {
          ...existing,
          nextSequenceIndex: nextPendingIndex(existing),
          studyComplete: isStudyComplete(existing),
        },
      });
    }

    if (action === "complete_session") {
      const existing = await readParticipant(email);
      if (!existing) {
        return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
      }
      const completion = body.completion;
      const entry = {
        sequenceIndex: Number(completion.sequenceIndex),
        session: Number(completion.session),
        ratio_label: String(completion.ratio_label || ""),
        completedAt: String(completion.completedAt || new Date().toISOString()),
        duration_s_run: Number(completion.duration_s_run),
        duration_s_planned: Number(completion.duration_s_planned),
        points_total: Number(completion.points_total),
        aborted: Number(completion.aborted ?? 0),
        saved: completion.saved !== false,
        valid: false,
        baseName: completion.baseName ? String(completion.baseName) : undefined,
      };
      entry.valid = isCompletedSessionRecordValid(entry);

      if (!entry.valid) {
        return NextResponse.json({
          ok: true,
          progressUpdated: false,
          record: {
            ...existing,
            nextSequenceIndex: nextPendingIndex(existing),
            studyComplete: isStudyComplete(existing),
          },
        });
      }

      existing.completedSessions = existing.completedSessions.filter(
        (s) => s.sequenceIndex !== entry.sequenceIndex,
      );
      existing.completedSessions.push(entry);
      existing.completedSessions.sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      existing.lastSessionCompletedAt = entry.completedAt;
      existing.nextSequenceIndex = nextPendingIndex(existing);
      existing.studyComplete = isStudyComplete(existing);
      existing.updatedAt = new Date().toISOString();
      await writeParticipant(existing);
      return NextResponse.json({
        ok: true,
        progressUpdated: true,
        record: existing,
      });
    }

    return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
  } catch (err) {
    logApiError("Participant POST", err, { action });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
