import { NextResponse } from "next/server";
import { buildParticipantSessionSequence } from "@/lib/experiment/session-sequence";
import { generateAnonymousParticipantId } from "@/lib/research/participant-id";
import {
  isStudyComplete,
  nextPendingIndex,
  normalizeEmail,
  type ParticipantRecord,
} from "@/lib/research/participant-record";
import { readParticipant, writeParticipant } from "@/lib/research/participant-server";

export async function GET(request: Request) {
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
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "upsert");
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
      // Alinha código anônimo do consentimento ao ID estável do participante
      if (consent) consent.participantCode = existing.participantId;
      existing.updatedAt = new Date().toISOString();
      await writeParticipant(existing);

      // Persistência da assinatura se enviada
      if (consent?.signatureDataUrl) {
        const { mkdir, writeFile } = await import("fs/promises");
        const path = await import("path");
        const dir = path.join(process.cwd(), "..", "data", "online", "participants");
        await mkdir(dir, { recursive: true });
        const b64 = String(consent.signatureDataUrl).replace(/^data:image\/png;base64,/, "");
        await writeFile(
          path.join(dir, `${existing.participantId}_signature.png`),
          Buffer.from(b64, "base64"),
        );
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
      existing.completedSessions = existing.completedSessions.filter(
        (s) => s.sequenceIndex !== completion.sequenceIndex,
      );
      existing.completedSessions.push(completion);
      existing.completedSessions.sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      existing.lastSessionCompletedAt = completion.completedAt;
      existing.nextSequenceIndex = nextPendingIndex(existing);
      existing.studyComplete = isStudyComplete(existing);
      existing.updatedAt = new Date().toISOString();
      await writeParticipant(existing);
      return NextResponse.json({
        ok: true,
        record: existing,
      });
    }

    return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
  } catch (err) {
    console.error("Participant API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
