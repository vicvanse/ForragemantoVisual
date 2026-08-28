interface VekonBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "muted";
}

export function VekonBadge({ children, variant = "default" }: VekonBadgeProps) {
  const styles = {
    default: "bg-[#e2eaf4] text-[#0f2847]",
    accent: "bg-[#cffafe] text-[#0e7490]",
    muted: "bg-white/60 text-[#5a6b82] border border-[#cbd8e8]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
