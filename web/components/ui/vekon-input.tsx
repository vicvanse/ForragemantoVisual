import { vekon } from "@/lib/vekon/tokens";

interface VekonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function VekonInput({ label, hint, error, id, className = "", ...props }: VekonInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-semibold" style={{ color: vekon.colors.text }}>
        {label}
      </label>
      <input
        id={inputId}
        className="h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-2"
        style={{
          borderColor: error ? vekon.colors.danger : vekon.colors.border,
          color: vekon.colors.text,
        }}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs" style={{ color: vekon.colors.textMuted }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: vekon.colors.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
