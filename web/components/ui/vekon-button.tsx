import { vekon } from "@/lib/vekon/tokens";

interface VekonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
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
    "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: `text-white hover:opacity-95 focus-visible:ring-[${vekon.colors.accent}]`,
    secondary:
      "bg-white text-[#1e3a5f] border border-[#d7e0ea] hover:bg-[#f4f7fb] focus-visible:ring-[#1e3a5f]",
    ghost: "bg-transparent text-[#1e3a5f] hover:bg-[#e8eef5] focus-visible:ring-[#1e3a5f]",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-13 px-8 text-base rounded-xl",
  };

  const style =
    variant === "primary"
      ? { backgroundColor: vekon.colors.primary }
      : undefined;

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={style}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
