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
import {
  getTcleSections,
  TCLE_PDF_PATH,
  tcleConsentDeclaration,
  tcleSimpleConsentLabel,
} from "@/lib/research/tcle-content";

interface ConsentPageProps {
  onSubmit: (consent: ConsentRecord) => void;
  /** E-mail já informado na entrada (não pedimos de novo). */
  lockedEmail?: string;
  /** Código anônimo já atribuído ao participante. */
  participantId?: string;
  defaultFullName?: string;
}

export function ConsentPage({
  onSubmit,
  lockedEmail,
  participantId,
  defaultFullName = "",
}: ConsentPageProps) {
  const sections = useMemo(() => getTcleSections(), []);
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(lockedEmail || "");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [readAndAgreed, setReadAndAgreed] = useState(false);
  const [formalDeclaration, setFormalDeclaration] = useState(false);
  const [lgpdAcknowledged, setLgpdAcknowledged] = useState(false);
  const [withdrawAcknowledged, setWithdrawAcknowledged] = useState(false);
  const [saveCopyAcknowledged, setSaveCopyAcknowledged] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");

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
    if (
      !readAndAgreed ||
      !formalDeclaration ||
      !lgpdAcknowledged ||
      !withdrawAcknowledged ||
      !saveCopyAcknowledged
    ) {
      setError("Marque todas as declarações obrigatórias.");
      return;
    }
    if (!signature) {
      setError("A assinatura digital é obrigatória.");
      return;
    }

    const participantCode = participantId || generateAnonymousParticipantId();
    const record: ConsentRecord = {
      tcleVersion: studyConfig.tcleVersion,
      participantCode,
      fullName: fullName.trim(),
      email: (lockedEmail || email).trim().toLowerCase(),
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
      kicker="CEP-IPUSP · Universidade de São Paulo"
      title="Termo de Consentimento Livre e Esclarecido (TCLE)"
      subtitle={`Versão ${studyConfig.tcleVersion}. Leia integralmente antes de consentir. A tarefa só inicia após o consentimento.`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <a
          href={TCLE_PDF_PATH}
          download="TCLE_DA_ajustado.pdf"
          className="inline-flex items-center justify-center rounded-xl border border-[#cbd8e8] bg-white px-4 py-2 text-sm font-semibold text-[#0f2847] transition hover:border-[#22d3ee]/50 hover:bg-[#f0f9ff]"
        >
          Baixar uma cópia do TCLE (PDF)
        </a>
        <VekonButton type="button" variant="secondary" size="sm" onClick={downloadTcleTemplate}>
          Baixar TCLE online (texto)
        </VekonButton>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-[#5a6b82]">
        <strong>Importante (CONEP):</strong> guarde uma cópia deste termo antes ou ao
        consentir. O PDF é o documento aprovado pelo CEP; o texto online inclui o anexo
        sobre participação remota, dados coletados e privacidade da plataforma.
      </p>

      <div className="vekon-tcle-scroll mb-6 rounded-xl border border-[#cbd8e8] bg-white/70 p-5 text-sm leading-relaxed text-[#0c1524]">
        {sections.map((section) => (
          <section key={section.id} className="mb-5 last:mb-0">
            <h3 className="mb-2 font-bold text-[#0f2847]">{section.title}</h3>
            {section.paragraphs.map((p, i) =>
              p ? (
                <p key={i} className="mb-2 last:mb-0 text-[#334155]">
                  {p}
                </p>
              ) : null,
            )}
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
          hint="Usado somente no registro de consentimento. Não é vinculado aos arquivos comportamentais da tarefa."
        />
        <VekonInput
          label="E-mail"
          type="email"
          value={lockedEmail || email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          disabled={Boolean(lockedEmail)}
          hint={
            lockedEmail
              ? "E-mail informado na entrada (vinculado ao seu progresso)."
              : "Para contato da equipe, se necessário. Mantido separado do participant_id da tarefa."
          }
        />

        <CheckboxField
          checked={ageConfirmed}
          onChange={setAgeConfirmed}
          label={`Declaro ter ${studyConfig.minAge} anos ou mais.`}
        />
        <CheckboxField
          checked={readAndAgreed}
          onChange={setReadAndAgreed}
          label={tcleSimpleConsentLabel}
        />
        <CheckboxField
          checked={formalDeclaration}
          onChange={setFormalDeclaration}
          label={tcleConsentDeclaration}
        />
        <CheckboxField
          checked={lgpdAcknowledged}
          onChange={setLgpdAcknowledged}
          label="Fui informado(a) sobre o tratamento de dados pessoais conforme a LGPD e a Res. CNS 510/2016, inclusive sobre dados que a plataforma de hospedagem pode registrar automaticamente."
        />
        <CheckboxField
          checked={withdrawAcknowledged}
          onChange={setWithdrawAcknowledged}
          label="Sei que posso fechar esta página e interromper minha participação a qualquer momento, sem penalidade. Se interromper antes do envio final, os dados comportamentais parciais não serão salvos automaticamente."
        />
        <CheckboxField
          checked={saveCopyAcknowledged}
          onChange={setSaveCopyAcknowledged}
          label="Baixei ou guardarei uma cópia deste TCLE (PDF ou texto), conforme recomendação da CONEP para pesquisa virtual."
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-[#0c1524]">Assinatura digital</p>
          <SignaturePad onChange={setSignature} />
        </div>

        {error && (
          <p className="rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</p>
        )}

        <VekonButton type="submit" variant="accent" size="lg" className="w-full">
          Li as informações acima e concordo: continuar
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
        className="mt-1 h-4 w-4 shrink-0 rounded accent-[#0891b2]"
      />
      <span className="text-sm leading-relaxed text-[#0c1524]">{label}</span>
    </label>
  );
}
