import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

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

    await writeFile(
      path.join(dataDir, `${baseName}_submission.json`),
      JSON.stringify(body, null, 2),
      "utf8",
    );

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

    if (body.consent?.signatureDataUrl) {
      const sig = body.consent.signatureDataUrl as string;
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
