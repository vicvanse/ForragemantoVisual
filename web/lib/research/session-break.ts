import { studyConfig } from "@/lib/research/study-config";

export function breakRemainingMs(lastCompletedAt?: string): number {
  if (!lastCompletedAt) return 0;
  const elapsed = Date.now() - new Date(lastCompletedAt).getTime();
  const need = studyConfig.sessionPlan.interSessionBreakS * 1000;
  return Math.max(0, need - elapsed);
}

export function formatBreakCountdown(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
