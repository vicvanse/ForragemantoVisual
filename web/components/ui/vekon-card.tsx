import { vekon } from "@/lib/vekon/tokens";

interface VekonCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function VekonCard({ children, className = "", title, subtitle }: VekonCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 md:p-8 ${className}`}
      style={{
        borderColor: vekon.colors.border,
        boxShadow: vekon.shadow.md,
      }}
    >
      {(title || subtitle) && (
        <header className="mb-6">
          {title && (
            <h2
              className="text-xl font-bold tracking-tight md:text-2xl"
              style={{ color: vekon.colors.text }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: vekon.colors.textMuted }}>
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
