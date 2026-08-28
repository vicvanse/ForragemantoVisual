import { vekon } from "@/lib/vekon/tokens";

interface VekonBrandMarkProps {
  size?: "sm" | "md";
}

export function VekonBrandMark({ size = "md" }: VekonBrandMarkProps) {
  const dim = size === "sm" ? 36 : 44;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{
        width: dim,
        height: dim,
        background: vekon.gradient.accent,
        boxShadow: vekon.shadow.glow,
        color: vekon.colors.navy,
        fontSize: size === "sm" ? 12 : 14,
        letterSpacing: "-0.04em",
      }}
      aria-hidden
    >
      VC
    </div>
  );
}
