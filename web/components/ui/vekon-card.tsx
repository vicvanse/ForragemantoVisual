interface VekonCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  kicker?: string;
}

export function VekonCard({
  children,
  className = "",
  title,
  subtitle,
  kicker,
}: VekonCardProps) {
  return (
    <div className={`vekon-glass-card p-6 md:p-8 ${className}`}>
      {(kicker || title || subtitle) && (
        <header className="mb-6">
          {kicker && <p className="vekon-kicker mb-2">{kicker}</p>}
          {title && (
            <h2 className="text-xl font-bold tracking-tight text-[#0c1524] md:text-2xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-[#5a6b82]">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
