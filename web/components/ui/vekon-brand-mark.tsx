import { vekon } from "@/lib/vekon/tokens";

interface VekonBrandMarkProps {
  size?: "sm" | "md";
}

export function VekonBrandMark({ size = "md" }: VekonBrandMarkProps) {
  const dim = size === "sm" ? 36 : 44;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: dim,
        height: dim,
        background: vekon.gradient.accent,
        boxShadow: vekon.shadow.glow,
      }}
    >
      <svg
        width={size === "sm" ? 20 : 24}
        height={size === "sm" ? 20 : 24}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 12h16M12 4v16"
          stroke={vekon.colors.navy}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3" fill={vekon.colors.navy} />
      </svg>
    </div>
  );
}
