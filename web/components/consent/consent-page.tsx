"use client";

import { useMemo, useState } from "react";
import { SignaturePad } from "@/components/consent/signature-pad";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import { VekonInput } from "@/components/ui/vekon-input";
import type { ConsentRecord } from "@/lib/experiment/types";
import { downloadConsentCopy, downloadTcleTemplate } from "@/lib/research/consent-export";
import { generateAnonymousParticipantId } from "@/lib/research/participant-id";
import { studyConfig } from "@/lib/research/study-config";
import { getTcleSections } from "@/lib/research/tcle-content";

interface ConsentPageProps {
  onSubmit: (consent: ConsentRecord) => void;
}

export function ConsentPage({ onSubmit }: ConsentPageProps) {
  const sections = useMemo(() => getTcleSections(), []);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [lgpdAcknowledged, setLgpdAcknowledged] = useState(false);
  const [withdrawAcknowledged, setWithdrawAcknowledged] = useState(false);
  const [saveCopyAcknowledged, setSaveCopyAcknowledged] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");

  function handleDownloadTcleOnly() {
    downloadTcleTemplate();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Informe um e-mail válido para contato.");
      return;
    }
    if (!ageConfirmed) {
      setError(`Confirme que tem ${studyConfig.minAge} anos ou mais.`);
      return;
    }
    if (!agreed || !lgpdAcknowledged || !withdrawAcknowledged) {
      setError("Marque todas as declarações obrigatórias.");
      return;
    }
    if (!saveCopyAcknowledged) {
      setError("Confirme que guardará uma cópia deste termo (recomendação CONEP).");
      return;
    }
    if (!signature) {
      setError("A assinatura digital é obrigatória.");
      return;
    }

    const participantCode = generateAnonymousParticipantId();
    const record: ConsentRecord = {
      tcleVersion: studyConfig.tcleVersion,
      participantCode,
      fullName: fullName.trim(),
      email: email.trim(),
      minAge: studyConfig.minAge,
      minAgeConfirmed: true,
      agreed: true,
      lgpdAcknowledged: true,
      withdrawAcknowledged: true,
      consentCopyRequested: saveCopyAcknowledged,
      signatureDataUrl: signature,
      signedAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      userAgent: navigator.userAgent,
    };

    downloadConsentCopy(record);
    onSubmit(record);
  }

  return (
    <VekonCard
      kicker="Res. CNS 510/2016 · Ambiente virtual"
      title="Termo de Consentimento Livre e Esclarecido (TCLE)"
      subtitle={`Versão ${studyConfig.tcleVersion} — leia integralmente antes de consentir.`}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <VekonButton type="button" variant="secondary" size="sm" onClick={handleDownloadTcleOnly}>
          Baixar TCLE (texto)
        </VekonButton>
        <span className="self-center text-xs text-[#5a6b82]">
          Recomendado guardar uma cópia antes de assinar (CONEP).
        </span>
      </div>

      <div className="vekon-tcle-scroll mb-6 rounded-xl border border-[#cbd8e8] bg-white/70 p-5 text-sm leading-relaxed text-[#0c1524]">
        {sections.map((section) => (
          <section key={section.id} className="mb-5 last:mb-0">
            <h3 className="mb-2 font-bold text-[#0f2847]">{section.title}</h3>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mb-2 last:mb-0 text-[#334155]">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <VekonInput
          label="Nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Como consta no documento"
          autoComplete="name"
          hint="Usado apenas para registro de consentimento, separado do código anônimo da tarefa."
        />
        <VekonInput
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          hint="Para contato da equipe de pesquisa, se necessário."
        />

        <CheckboxField
          checked={ageConfirmed}
          onChange={setAgeConfirmed}
          label={`Declaro ter ${studyConfig.minAge} anos ou mais.`}
        />
        <CheckboxField
          checked={agreed}
          onChange={setAgreed}
          label="Li o TCLE, tive oportunidade de esclarecer dúvidas e concordo voluntariamente em participar."
        />
        <CheckboxField
          checked={lgpdAcknowledged}
          onChange={setLgpdAcknowledged}
          label="Fui informado(a) sobre o tratamento de dados pessoais conforme a LGPD e a Res. CNS 510/2016."
        />
        <CheckboxField
          checked={withdrawAcknowledged}
          onChange={setWithdrawAcknowledged}
          label="Sei que posso recusar ou retirar meu consentimento a qualquer momento, sem prejuízo."
        />
        <CheckboxField
          checked={saveCopyAcknowledged}
          onChange={setSaveCopyAcknowledged}
          label="Comprometo-me a guardar a cópia do TCLE que será baixada ao confirmar (ou já baixei acima)."
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-[#0c1524]">Assinatura digital</p>
          <SignaturePad onChange={setSignature} />
        </div>

        {error && (
          <p className="rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</p>
        )}

        <VekonButton type="submit" variant="accent" size="lg" className="w-full">
          Concordo e desejo continuar
        </VekonButton>
      </form>
    </VekonCard>
  );
}

function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cbd8e8] bg-white/60 p-4 transition hover:border-[#22d3ee]/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded accent-[#0891b2]"
      />
      <span className="text-sm leading-relaxed text-[#0c1524]">{label}</span>
    </label>
  );
}
