interface VekonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function VekonInput({ label, hint, error, id, className = "", ...props }: VekonInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-semibold text-[#0c1524]">
        {label}
      </label>
      <input
        id={inputId}
        className="h-11 w-full rounded-xl border border-[#cbd8e8] bg-white/90 px-4 text-sm text-[#0c1524] outline-none transition focus:border-[#22d3ee] focus:ring-2 focus:ring-[#22d3ee]/25"
        style={error ? { borderColor: "#dc2626" } : undefined}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#5a6b82]">{hint}</p>}
      {error && <p className="text-xs text-[#dc2626]">{error}</p>}
    </div>
  );
}
