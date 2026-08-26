"use client";

import { useState } from "react";
import { SignaturePad } from "@/components/consent/signature-pad";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import { VekonInput } from "@/components/ui/vekon-input";
import type { ConsentRecord } from "@/lib/experiment/types";
import { vekon } from "@/lib/vekon/tokens";

interface ConsentPageProps {
  onSubmit: (consent: ConsentRecord) => void;
}

export function ConsentPage({ onSubmit }: ConsentPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
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
    if (!agreed) {
      setError("É necessário marcar que leu e concorda com o termo.");
      return;
    }
    if (!signature) {
      setError("A assinatura digital é obrigatória.");
      return;
    }

    onSubmit({
      fullName: fullName.trim(),
      email: email.trim(),
      agreed: true,
      signatureDataUrl: signature,
      signedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
  }

  return (
    <VekonCard
      title="Termo de Consentimento Livre e Esclarecido (TCLE)"
      subtitle="Leia atentamente antes de participar. Este estudo investiga processos de busca visual em ambiente online."
    >
      <div
        className="mb-6 max-h-72 overflow-y-auto rounded-xl border p-5 text-sm leading-relaxed"
        style={{
          borderColor: vekon.colors.border,
          backgroundColor: vekon.colors.surface,
          color: vekon.colors.text,
        }}
      >
        <p className="mb-3 font-semibold">Objetivo</p>
        <p className="mb-4">
          Você foi convidado(a) a participar de um estudo de forrageamento visual
          conduzido de forma remota. Sua participação consiste em localizar a
          letra T entre distratores L, usando o mouse como indicador de atenção
          visual, por aproximadamente 7 minutos.
        </p>

        <p className="mb-3 font-semibold">Procedimentos</p>
        <p className="mb-4">
          Após ler este termo e assinar digitalmente, você receberá instruções
          sobre a tarefa. Os dados coletados incluem tempos de resposta, pontuação,
          movimentos do mouse e eventos da sessão. Não coletamos imagem de rosto
          nem gravação de áudio/vídeo.
        </p>

        <p className="mb-3 font-semibold">Riscos e desconfortos</p>
        <p className="mb-4">
          O procedimento apresenta risco mínimo, comparável ao uso habitual de
          computador. Pode haver leve fadiga visual. Você pode interromper a
          qualquer momento fechando a janela do navegador.
        </p>

        <p className="mb-3 font-semibold">Benefícios</p>
        <p className="mb-4">
          Não há benefício direto garantido. Os resultados contribuirão para pesquisa
          científica em cognição e atenção visual.
        </p>

        <p className="mb-3 font-semibold">Confidencialidade</p>
        <p className="mb-4">
          Seus dados serão identificados por um código e armazenados de forma
          segura, acessíveis apenas à equipe de pesquisa autorizada.
        </p>

        <p className="mb-3 font-semibold">Contato</p>
        <p>
          Em caso de dúvidas sobre o estudo ou seus direitos como participante,
          entre em contato com o pesquisador responsável pelo e-mail informado no
          convite de participação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <VekonInput
          label="Nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Como consta no documento"
          autoComplete="name"
        />
        <VekonInput
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          hint="Usado apenas para contato, se necessário"
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4" style={{ borderColor: vekon.colors.border }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded"
          />
          <span className="text-sm leading-relaxed" style={{ color: vekon.colors.text }}>
            Declaro que li o Termo de Consentimento Livre e Esclarecido, tive
            oportunidade de tirar dúvidas e concordo voluntariamente em participar
            deste estudo online.
          </span>
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold" style={{ color: vekon.colors.text }}>
            Assinatura digital
          </p>
          <SignaturePad onChange={setSignature} />
        </div>

        {error && (
          <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: vekon.colors.dangerBg, color: vekon.colors.danger }}>
            {error}
          </p>
        )}

        <VekonButton type="submit" size="lg" className="w-full">
          Concordo e desejo continuar
        </VekonButton>
      </form>
    </VekonCard>
  );
}
