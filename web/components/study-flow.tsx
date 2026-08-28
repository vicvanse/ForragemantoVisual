"use client";

import { useCallback, useMemo, useState } from "react";
import { ConsentPage } from "@/components/consent/consent-page";
import { CompletionPage } from "@/components/experiment/completion-page";
import { ExperimentCanvas } from "@/components/experiment/experiment-canvas";
import { ChecklistPage } from "@/components/instructions/checklist-page";
import { InstructionSteps } from "@/components/instructions/instruction-steps";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import { VekonProgress } from "@/components/ui/vekon-progress";
import { VekonShell } from "@/components/ui/vekon-shell";
import { pickSessionCondition, type Exp2SessionRow } from "@/lib/experiment/constants";
import type {
  ConsentRecord,
  Exp2EventRow,
  Exp2SummaryRow,
  StudyStep,
  SubmissionPayload,
} from "@/lib/experiment/types";
import { eventsToCsv, summaryToCsv } from "@/lib/experiment/types";
import { studyConfig } from "@/lib/research/study-config";

function stepIndex(step: StudyStep): number {
  const map: Record<StudyStep, number> = {
    welcome: 0,
    consent: 1,
    instructions: 2,
    checklist: 3,
    experiment: 4,
    complete: 5,
  };
  return map[step];
}

export function StudyFlow() {
  const [step, setStep] = useState<StudyStep>("welcome");
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [sessionRow, setSessionRow] = useState<Exp2SessionRow | null>(null);
  const [summary, setSummary] = useState<Exp2SummaryRow | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const isDev = process.env.NODE_ENV === "development";
  const demoDuration = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("duration");
    return d ? parseFloat(d) : isDev ? 30 : undefined;
  }, [isDev]);

  const handleConsent = useCallback((record: ConsentRecord) => {
    const session = pickSessionCondition(record.participantCode);
    setConsent(record);
    setSessionRow(session);
    setStep("instructions");
  }, []);

  const submitResults = useCallback(
    async (
      events: Exp2EventRow[],
      summaryRow: Exp2SummaryRow,
      consentRecord: ConsentRecord,
    ) => {
      setSubmitting(true);
      const payload: SubmissionPayload = {
        consent: consentRecord,
        metadata: {
          participantId: summaryRow.participant_id,
          sessionCondition: summaryRow.session_condition,
          sessionRun: 1,
          ratioLabel: summaryRow.ratio_label,
          mode: "online_mouse",
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
          tcleVersion: studyConfig.tcleVersion,
          submittedAt: new Date().toISOString(),
          platform: studyConfig.platform.name,
          ipCollected: false,
        },
        events,
        summary: summaryRow,
      };

      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            eventsCsv: eventsToCsv(events),
            summaryCsv: summaryToCsv(summaryRow),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Falha ao salvar dados");
        }
        setSaved(true);
      } catch (err) {
        setSaved(false);
        setSaveError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const handleExperimentComplete = useCallback(
    async (events: Exp2EventRow[], summaryRow: Exp2SummaryRow) => {
      setSummary(summaryRow);
      setStep("complete");
      if (consent) {
        await submitResults(events, summaryRow, consent);
      }
    },
    [consent, submitResults],
  );

  function handleRestart() {
    setStep("welcome");
    setConsent(null);
    setSessionRow(null);
    setSummary(null);
    setSaved(false);
    setSaveError(undefined);
  }

  if (step === "experiment" && sessionRow && consent) {
    return (
      <ExperimentCanvas
        participantId={consent.participantCode}
        sessionCondition={sessionRow.session}
        sessionRun={1}
        sessionRow={sessionRow}
        durationS={demoDuration}
        onComplete={handleExperimentComplete}
      />
    );
  }

  return (
    <VekonShell badge={step !== "complete" ? "Online · Mouse" : undefined} showFooter>
      {step !== "complete" && (
        <div className="mb-8">
          <VekonProgress currentStep={stepIndex(step)} />
        </div>
      )}

      {step === "welcome" && (
        <VekonCard
          kicker="Pesquisa científica"
          title="Estudo de Forrageamento Visual"
          subtitle={`Participação remota · ~${studyConfig.studyDurationMinutes} minutos`}
        >
          <div className="space-y-4 text-sm leading-relaxed text-[#334155]">
            <p>
              Bem-vindo(a)! Este estudo investiga atenção visual e escolha em ambiente
              online. Você usará o <strong>mouse</strong> para indicar onde está olhando.
            </p>
            <div className="rounded-xl border border-[#cbd8e8] bg-[#f0f6fc] p-4 text-[#0f2847]">
              <p className="mb-2 font-semibold">Fluxo da sessão</p>
              <ol className="list-decimal space-y-1 pl-5 text-[#5a6b82]">
                <li>TCLE com assinatura digital e download da cópia</li>
                <li>Instruções passo a passo</li>
                <li>Verificação do ambiente e privacidade</li>
                <li>Tarefa principal (~{studyConfig.taskDurationMinutes} min)</li>
              </ol>
            </div>
            <p className="text-xs text-[#5a6b82]">
              Seus dados são tratados conforme LGPD e Res. CNS 510/2016. Você pode
              desistir a qualquer momento.
            </p>
          </div>
          <VekonButton
            type="button"
            variant="accent"
            size="lg"
            className="mt-8 w-full"
            onClick={() => setStep("consent")}
          >
            Começar
          </VekonButton>
        </VekonCard>
      )}

      {step === "consent" && <ConsentPage onSubmit={handleConsent} />}

      {step === "instructions" && (
        <InstructionSteps onComplete={() => setStep("checklist")} />
      )}

      {step === "checklist" && <ChecklistPage onReady={() => setStep("experiment")} />}

      {step === "complete" && summary && consent && (
        <CompletionPage
          summary={summary}
          consent={consent}
          saved={saved}
          saveError={saveError}
          onRestart={isDev ? handleRestart : undefined}
        />
      )}

      {submitting && step === "complete" && (
        <p className="mt-4 text-center text-sm text-[#5a6b82]">Salvando dados com segurança…</p>
      )}
    </VekonShell>
  );
}
