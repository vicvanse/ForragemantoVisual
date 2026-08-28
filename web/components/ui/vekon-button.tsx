interface VekonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function VekonButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: VekonButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variants = {
    primary: "vekon-btn-primary",
    accent: "vekon-btn-accent",
    secondary:
      "bg-white text-[#0f2847] border border-[#cbd8e8] hover:bg-[#f4f7fb] shadow-sm",
    ghost: "bg-transparent text-[#0f2847] hover:bg-[#e2eaf4]/80",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-12 px-8 text-base rounded-xl",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
