"use client";

import { useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { VekonCard } from "@/components/ui/vekon-card";
import { VekonInput } from "@/components/ui/vekon-input";
import type { ParticipantRecord } from "@/lib/research/participant-record";
import { normalizeEmail } from "@/lib/research/participant-record";
import { studyConfig } from "@/lib/research/study-config";

interface EmailGateProps {
  onReady: (record: ParticipantRecord) => void;
}

export function EmailGate({ onReady }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeEmail(email);
    if (!normalized.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const lookup = await fetch(`/api/participant?email=${encodeURIComponent(normalized)}`);
      const data = await lookup.json();
      if (data.found && data.record) {
        onReady(data.record as ParticipantRecord);
        return;
      }
      const res = await fetch("/api/participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email: normalized }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || "Falha ao registrar");
      onReady(created.record as ParticipantRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const nSessions = studyConfig.sessionPlan.repsPerCondition === 1 ? 6 : 10;
  const breakMin = Math.round(studyConfig.sessionPlan.interSessionBreakS / 60);

  return (
    <VekonCard
      kicker="Pesquisa científica · IPUSP / LAEC"
      title="Atenção dividida como escolha operante"
      subtitle={`Estudo com várias sessões · ~${studyConfig.taskDurationMinutes} min cada`}
    >
      <div className="mb-6 space-y-3 text-sm leading-relaxed text-[#334155]">
        <p>
          Bem-vindo(a)! Você usará o <strong>mouse</strong> para controlar um ponteiro na tela
          (resposta de observação — não é eye-tracking).
        </p>
        <div className="rounded-xl border border-[#cbd8e8] bg-[#f0f6fc] p-4 text-[#0f2847]">
          <p className="mb-2 font-semibold">Como funciona</p>
          <ul className="list-disc space-y-1 pl-5 text-[#5a6b82]">
            <li>
              São <strong>{nSessions} sessões</strong> com condições diferentes (começando e
              terminando com a mesma quantidade de estímulos em cada lado).
            </li>
            <li>Entre em com o mesmo e-mail para retomar de onde parou.</li>
            <li>
              Se fizer tudo de uma vez, haverá um intervalo de <strong>{breakMin} minutos</strong>{" "}
              entre sessões.
            </li>
            <li>O TCLE só precisa ser assinado uma vez.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleContinue} className="space-y-4">
        <VekonInput
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          hint="Usamos o e-mail só para localizar seu progresso e o TCLE. Os dados da tarefa ficam sob um código anônimo."
        />
        {error && (
          <p className="rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</p>
        )}
        <VekonButton
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Verificando…" : "Continuar"}
        </VekonButton>
      </form>
    </VekonCard>
  );
}
