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
import {
  pickSessionCondition,
  sanitizeParticipantId,
  type Exp2SessionRow,
} from "@/lib/experiment/constants";
import type {
  ConsentRecord,
  Exp2EventRow,
  Exp2SummaryRow,
  StudyStep,
  SubmissionPayload,
} from "@/lib/experiment/types";
import { eventsToCsv, summaryToCsv } from "@/lib/experiment/types";
import { vekon } from "@/lib/vekon/tokens";

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

function makeParticipantId(consent: ConsentRecord): string {
  const base = sanitizeParticipantId(
    consent.fullName
      .split(/\s+/)
      .map((p) => p[0] || "")
      .join("")
      .toUpperCase() || "P",
  );
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return sanitizeParticipantId(`${base}_${ts}`);
}

export function StudyFlow() {
  const [step, setStep] = useState<StudyStep>("welcome");
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [participantId, setParticipantId] = useState("");
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
    const pid = makeParticipantId(record);
    const session = pickSessionCondition(pid);
    setConsent(record);
    setParticipantId(pid);
    setSessionRow(session);
    setStep("instructions");
  }, []);

  const submitResults = useCallback(
    async (
      events: Exp2EventRow[],
      summaryRow: Exp2SummaryRow,
      consentRecord: ConsentRecord,
      session: Exp2SessionRow,
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
      if (consent && sessionRow) {
        await submitResults(events, summaryRow, consent, sessionRow);
      }
    },
    [consent, sessionRow, submitResults],
  );

  function handleRestart() {
    setStep("welcome");
    setConsent(null);
    setParticipantId("");
    setSessionRow(null);
    setSummary(null);
    setSaved(false);
    setSaveError(undefined);
  }

  if (step === "experiment" && sessionRow && participantId) {
    return (
      <ExperimentCanvas
        participantId={participantId}
        sessionCondition={sessionRow.session}
        sessionRun={1}
        sessionRow={sessionRow}
        durationS={demoDuration}
        onComplete={handleExperimentComplete}
      />
    );
  }

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: vekon.colors.surface }}>
      <header
        className="border-b bg-white"
        style={{ borderColor: vekon.colors.border, boxShadow: vekon.shadow.sm }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: vekon.colors.primary }}
            >
              V
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: vekon.colors.primary }}>
                Vekon Research
              </p>
              <p className="text-xs" style={{ color: vekon.colors.textMuted }}>
                Forrageamento Visual — Exp. 2
              </p>
            </div>
          </div>
          {step !== "complete" && (
            <span
              className="hidden rounded-full px-3 py-1 text-xs font-medium md:inline"
              style={{ backgroundColor: vekon.colors.primaryLight, color: vekon.colors.primary }}
            >
              Online · Mouse
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        {step !== "complete" && (
          <div className="mb-8">
            <VekonProgress currentStep={stepIndex(step)} />
          </div>
        )}

        {step === "welcome" && (
          <VekonCard
            title="Estudo de Forrageamento Visual"
            subtitle="Participação online — duração aproximada de 10 minutos"
          >
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: vekon.colors.text }}>
              <p>
                Bem-vindo(a)! Este estudo faz parte de uma pesquisa acadêmica sobre
                atenção visual e tomada de decisão. Você realizará uma tarefa
                interativa no navegador, usando o <strong>mouse</strong> para
                indicar onde está olhando.
              </p>
              <p>O fluxo será:</p>
              <ol className="list-decimal space-y-1 pl-5" style={{ color: vekon.colors.textMuted }}>
                <li>Termo de consentimento (TCLE) com assinatura</li>
                <li>Instruções passo a passo</li>
                <li>Verificação do ambiente</li>
                <li>Tarefa principal (~7 min)</li>
              </ol>
            </div>
            <VekonButton
              type="button"
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

        {step === "checklist" && (
          <ChecklistPage onReady={() => setStep("experiment")} />
        )}

        {step === "complete" && summary && (
          <CompletionPage
            summary={summary}
            saved={saved}
            saveError={saveError}
            onRestart={isDev ? handleRestart : undefined}
          />
        )}

        {submitting && step === "complete" && (
          <p className="mt-4 text-center text-sm" style={{ color: vekon.colors.textMuted }}>
            Salvando dados…
          </p>
        )}
      </main>

      <footer className="pb-8 text-center text-xs" style={{ color: vekon.colors.textMuted }}>
        Plataforma Vekon Research · Dados criptografados em trânsito
      </footer>
    </div>
  );
}
