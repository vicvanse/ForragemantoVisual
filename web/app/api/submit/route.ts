import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { buildConsentArchiveText } from "@/lib/research/consent-archive";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participantId = String(body?.summary?.participant_id || "unknown");
    const session = body?.summary?.session_condition ?? 0;
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

    const safeId = participantId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const baseName = `forrageamento_online_exp2_${safeId}_s${session}_r1_${ts}`;

    const dataDir = path.join(process.cwd(), "..", "data", "online");
    await mkdir(dataDir, { recursive: true });

    // Minimização: payload de tarefa sem repetir assinatura em base64 no JSON principal
    const consent = body.consent;
    const payloadForStorage = {
      ...body,
      consent: consent
        ? {
            ...consent,
            signatureDataUrl: consent.signatureDataUrl ? "[stored_as_png]" : "",
          }
        : undefined,
    };

    await writeFile(
      path.join(dataDir, `${baseName}_submission.json`),
      JSON.stringify(payloadForStorage, null, 2),
      "utf8",
    );

    if (consent) {
      await writeFile(
        path.join(dataDir, `${baseName}_consent.txt`),
        buildConsentArchiveText(consent),
        "utf8",
      );
    }

    if (body.eventsCsv) {
      await writeFile(
        path.join(dataDir, `${baseName}_exp2_events.csv`),
        body.eventsCsv,
        "utf8",
      );
    }

    if (body.summaryCsv) {
      await writeFile(
        path.join(dataDir, `${baseName}_exp2_summary.csv`),
        body.summaryCsv,
        "utf8",
      );
    }

    if (consent?.signatureDataUrl) {
      const sig = consent.signatureDataUrl as string;
      const b64 = sig.replace(/^data:image\/png;base64,/, "");
      await writeFile(
        path.join(dataDir, `${baseName}_signature.png`),
        Buffer.from(b64, "base64"),
      );
    }

    return NextResponse.json({ ok: true, baseName });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar" },
      { status: 500 },
    );
  }
}
