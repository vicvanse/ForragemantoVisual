"use client";

import { useEffect, useState } from "react";
import { breakRemainingMs, formatBreakCountdown } from "@/lib/research/session-break";

interface BreakCountdownProps {
  lastSessionCompletedAt?: string;
  className?: string;
}

export function BreakCountdown({ lastSessionCompletedAt, className }: BreakCountdownProps) {
  const [leftMs, setLeftMs] = useState(() => breakRemainingMs(lastSessionCompletedAt));

  useEffect(() => {
    setLeftMs(breakRemainingMs(lastSessionCompletedAt));
    const id = setInterval(() => {
      setLeftMs(breakRemainingMs(lastSessionCompletedAt));
    }, 250);
    return () => clearInterval(id);
  }, [lastSessionCompletedAt]);

  if (leftMs <= 0) return null;

  return (
    <p
      className={
        className ??
        "rounded-xl border border-[#bae6fd] bg-[#ecfeff] px-4 py-3 text-center text-lg font-bold tabular-nums text-[#0e7490]"
      }
    >
      {formatBreakCountdown(leftMs)}
    </p>
  );
}

export function useBreakRemainingMs(lastSessionCompletedAt?: string): number {
  const [leftMs, setLeftMs] = useState(() => breakRemainingMs(lastSessionCompletedAt));

  useEffect(() => {
    setLeftMs(breakRemainingMs(lastSessionCompletedAt));
    const id = setInterval(() => {
      setLeftMs(breakRemainingMs(lastSessionCompletedAt));
    }, 250);
    return () => clearInterval(id);
  }, [lastSessionCompletedAt]);

  return leftMs;
}
