"use client";

import { useCallback, useMemo, useState } from "react";
import { ConsentPage } from "@/components/consent/consent-page";
import { CompletionPage } from "@/components/experiment/completion-page";
import { ExperimentCanvas } from "@/components/experiment/experiment-canvas";
import { IntermissionPage } from "@/components/experiment/intermission-page";
import { SessionHub } from "@/components/experiment/session-hub";
import { ChecklistPage } from "@/components/instructions/checklist-page";
import { InstructionSteps } from "@/components/instructions/instruction-steps";
import { VekonProgress } from "@/components/ui/vekon-progress";
import { VekonShell } from "@/components/ui/vekon-shell";
import { EmailGate } from "@/components/welcome/email-gate";
import { isSessionValidCompletion } from "@/lib/experiment/session-sequence";
import type {
  ConsentRecord,
  Exp2SummaryRow,
  ExperimentCompletePayload,
  StudyStep,
} from "@/lib/experiment/types";
import { eventsToCsv, summaryToCsv } from "@/lib/experiment/types";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { validCompletedSessions } from "@/lib/research/participant-record";
import { studyConfig } from "@/lib/research/study-config";

function stepIndex(step: StudyStep): number {
  const map: Record<StudyStep, number> = {
    welcome: 0,
    hub: 1,
    consent: 1,
    instructions: 2,
    checklist: 3,
    experiment: 4,
    intermission: 4,
    complete: 5,
  };
  return map[step];
}

function consentFromRecord(record: ParticipantRecord): ConsentRecord | null {
  if (!record.consent) return null;
  const { hasSignature: _hasSignature, ...rest } = record.consent;
  return {
    ...rest,
    signatureDataUrl: "",
  };
}

export function StudyFlow() {
  const [step, setStep] = useState<StudyStep>("welcome");
  const [participant, setParticipant] = useState<ParticipantRecord | null>(null);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [summary, setSummary] = useState<Exp2SummaryRow | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [invalidSession, setInvalidSession] = useState(false);
  const [seenInstructions, setSeenInstructions] = useState(false);

  const isDev = process.env.NODE_ENV === "development";
  const demoDuration = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("duration");
    if (d) return parseFloat(d);
    return isDev ? 30 : undefined;
  }, [isDev]);

  const nextSession = participant
    ? participant.sequence[participant.nextSequenceIndex] ?? null
    : null;

  const plannedDuration =
    demoDuration && demoDuration > 0
      ? demoDuration
      : nextSession?.duration_s ?? studyConfig.sessionPlan.durationS;

  const handleParticipantReady = useCallback((record: ParticipantRecord) => {
    setParticipant(record);
    setConsent(consentFromRecord(record));
    setSeenInstructions(validCompletedSessions(record).length > 0);
    if (!record.consentSigned) setStep("consent");
    else if (record.studyComplete) setStep("complete");
    else setStep("hub");
  }, []);

  const handleConsent = useCallback(
    async (record: ConsentRecord) => {
      if (!participant) return;
      setConsent(record);
      setSubmitting(true);
      try {
        const res = await fetch("/api/participant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_consent",
            email: participant.email,
            consent: record,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha ao salvar TCLE");
        setParticipant(data.record);
        setStep("instructions");
        setSeenInstructions(false);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Erro ao salvar TCLE");
      } finally {
        setSubmitting(false);
      }
    },
    [participant],
  );

  const goToSessionPrep = useCallback(() => {
    if (!seenInstructions && (participant?.nextSequenceIndex ?? 0) === 0) {
      setStep("instructions");
    } else {
      setStep("checklist");
    }
  }, [participant?.nextSequenceIndex, seenInstructions]);

  const submitResults = useCallback(
    async (
      payload: ExperimentCompletePayload,
      consentRecord: ConsentRecord,
      sequenceIndex: number,
    ) => {
      if (!participant) return { savedOk: false, record: participant };

      const { events, summary: summaryRow, cursorSamples, regionTransitions } =
        payload;

      setSubmitting(true);
      const valid = isSessionValidCompletion(
        summaryRow.duration_s_run,
        summaryRow.duration_s_planned,
        summaryRow.aborted,
      );

      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consent: consentRecord,
            metadata: {
              participantId: summaryRow.participant_id,
              sessionCondition: summaryRow.session_condition,
              sessionRun: summaryRow.session_run,
              sequenceIndex,
              ratioLabel: summaryRow.ratio_label,
              mode: "online_mouse",
              viewportW: window.innerWidth,
              viewportH: window.innerHeight,
              tcleVersion: studyConfig.tcleVersion,
              submittedAt: new Date().toISOString(),
              platform: studyConfig.platform.name,
              emailHashSkipped: true,
              ipCollected: false,
              sessionValid: valid,
            },
            events,
            summary: summaryRow,
            cursorSamples,
            regionTransitions,
            eventsCsv: eventsToCsv(events),
            summaryCsv: summaryToCsv(summaryRow),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Falha ao salvar dados");
        }
        const submitData = await res.json();

        if (!valid) {
          setSaved(true);
          setInvalidSession(true);
          return { savedOk: true, record: participant, valid: false };
        }

        const progressRes = await fetch("/api/participant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete_session",
            email: participant.email,
            completion: {
              sequenceIndex,
              session: summaryRow.session_condition,
              ratio_label: summaryRow.ratio_label,
              completedAt: new Date().toISOString(),
              duration_s_run: summaryRow.duration_s_run,
              duration_s_planned: summaryRow.duration_s_planned,
              points_total: summaryRow.points_total,
              aborted: summaryRow.aborted,
              saved: true,
              valid: true,
              baseName: submitData.baseName,
            },
          }),
        });
        const progressData = await progressRes.json();
        if (!progressRes.ok) throw new Error(progressData.error || "Falha ao atualizar progresso");

        setSaved(true);
        setParticipant(progressData.record);
        setInvalidSession(false);
        return { savedOk: true, record: progressData.record as ParticipantRecord, valid: true };
      } catch (err) {
        setSaved(false);
        setSaveError(err instanceof Error ? err.message : "Erro desconhecido");
        return { savedOk: false, record: participant, valid: false };
      } finally {
        setSubmitting(false);
      }
    },
    [participant],
  );

  const handleExperimentComplete = useCallback(
    async (payload: ExperimentCompletePayload) => {
      setSummary(payload.summary);
      if (!consent || !participant || !nextSession) {
        setStep("complete");
        return;
      }

      const result = await submitResults(
        payload,
        consent,
        nextSession.sequenceIndex,
      );

      if (!result.savedOk) {
        setStep("complete");
        return;
      }

      if (!result.valid) {
        setStep("complete");
        return;
      }

      const updated = result.record;
      if (updated?.studyComplete) {
        setStep("complete");
        return;
      }

      setStep("intermission");
    },
    [consent, participant, nextSession, submitResults],
  );

  function handleLeaveToWelcome() {
    setStep("welcome");
    setParticipant(null);
    setConsent(null);
    setSummary(null);
    setSaved(false);
    setSaveError(undefined);
    setInvalidSession(false);
  }

  if (step === "experiment" && nextSession && participant) {
    return (
      <div className="relative">
        <ExperimentCanvas
          participantId={participant.participantId}
          sessionCondition={nextSession.session}
          sessionRun={nextSession.sessionRun ?? 1}
          sessionRow={{
            ...nextSession,
            duration_s: plannedDuration,
          }}
          durationS={plannedDuration}
          onComplete={handleExperimentComplete}
        />
        {submitting && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 text-white">
            <p className="text-2xl font-semibold">Salvando...</p>
          </div>
        )}
      </div>
    );
  }

  const showProgress = step !== "welcome" && step !== "complete" && step !== "intermission";

  return (
    <VekonShell
      badge={
        participant
          ? `Sessão ${(participant.nextSequenceIndex || 0) + 1}/${participant.sequence.length}`
          : "Online · Mouse"
      }
      showFooter
    >
      {showProgress && (
        <div className="mb-8">
          <VekonProgress currentStep={stepIndex(step)} />
        </div>
      )}

      {step === "welcome" && <EmailGate onReady={handleParticipantReady} />}

      {step === "hub" && participant && (
        <SessionHub
          record={participant}
          nextSession={nextSession}
          lastSessionCompletedAt={participant.lastSessionCompletedAt}
          onNeedConsent={() => setStep("consent")}
          onStartNext={goToSessionPrep}
        />
      )}

      {step === "consent" && participant && (
        <ConsentPage
          lockedEmail={participant.email}
          participantId={participant.participantId}
          defaultFullName={participant.fullName}
          onSubmit={handleConsent}
        />
      )}

      {step === "instructions" && (
        <InstructionSteps
          onComplete={() => {
            setSeenInstructions(true);
            setStep("checklist");
          }}
        />
      )}

      {step === "checklist" && (
        <ChecklistPage onReady={() => setStep("experiment")} />
      )}

      {step === "intermission" && participant && nextSession && summary && (
        <IntermissionPage
          record={participant}
          justCompleted={{
            points: summary.points_total,
          }}
          onContinue={() => {
            setSummary(null);
            setSaved(false);
            setInvalidSession(false);
            setStep("checklist");
          }}
          onLeave={handleLeaveToWelcome}
        />
      )}

      {step === "complete" && participant && (
        <CompletionPage
          summary={
            summary ?? {
              participant_id: participant.participantId,
              experiment: 2,
              session_condition: 0,
              session_run: 1,
              ratio_label: "—",
              points_total: 0,
              duration_s_run: 0,
              duration_s_planned: plannedDuration,
              cod_switch_count: 0,
              cod_grey_ms: 0,
              forage_time_left_s: 0,
              forage_time_right_s: 0,
              aborted: 0,
              ended_by_t_esc: 0,
              k_decay_per_panel: 0,
              initial_n_L_left: 0,
              initial_n_L_right: 0,
              both_panels_visible: 0,
              single_visible_panel_by_gaze: 1,
              dual_target_scoring: 1,
              correctkey_csv: "",
            }
          }
          consent={
            consent ?? {
              tcleVersion: studyConfig.tcleVersion,
              participantCode: participant.participantId,
              fullName: participant.fullName || "Participante",
              email: participant.email,
              minAge: studyConfig.minAge,
              minAgeConfirmed: true,
              agreed: true,
              lgpdAcknowledged: true,
              withdrawAcknowledged: true,
              consentCopyRequested: true,
              signatureDataUrl: "",
              signedAt: participant.updatedAt,
              timezone: "",
              locale: "",
              userAgent: "",
            }
          }
          saved={saved || participant.studyComplete}
          saveError={
            saveError ||
            (invalidSession
              ? "A sessão não foi concluída por completo. Entre novamente com o mesmo e-mail para refazer esta sessão desde o início."
              : undefined)
          }
          studyComplete={participant.studyComplete}
          progressLabel={`${validCompletedSessions(participant).length}/${participant.sequence.length} sessões`}
          onContinueLater={handleLeaveToWelcome}
          onRetrySession={
            invalidSession
              ? () => {
                  setInvalidSession(false);
                  setSummary(null);
                  setSaveError(undefined);
                  setStep("hub");
                }
              : undefined
          }
          onRestart={isDev ? handleLeaveToWelcome : undefined}
        />
      )}

      {submitting && step !== "experiment" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 text-white">
          <p className="text-2xl font-semibold">Salvando...</p>
        </div>
      )}
    </VekonShell>
  );
}
