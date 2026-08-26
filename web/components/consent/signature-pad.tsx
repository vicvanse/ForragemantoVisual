"use client";

import { useEffect, useRef, useState } from "react";
import { VekonButton } from "@/components/ui/vekon-button";
import { vekon } from "@/lib/vekon/tokens";

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = vekon.colors.text;
  }, []);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStroke(true);
    onChange(canvasRef.current!.toDataURL("image/png"));
  }

  function endDraw() {
    drawingRef.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange("");
  }

  return (
    <div>
      <div
        className="overflow-hidden rounded-xl border-2 border-dashed bg-white"
        style={{ borderColor: vekon.colors.borderStrong }}
      >
        <canvas
          ref={canvasRef}
          className="h-36 w-full touch-none"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs" style={{ color: vekon.colors.textMuted }}>
          Assine com o mouse ou dedo (touchscreen)
        </p>
        <VekonButton type="button" variant="ghost" size="sm" onClick={clear}>
          Limpar
        </VekonButton>
      </div>
      {!hasStroke && (
        <p className="mt-1 text-xs" style={{ color: vekon.colors.warning }}>
          A assinatura é obrigatória para continuar
        </p>
      )}
    </div>
  );
}
