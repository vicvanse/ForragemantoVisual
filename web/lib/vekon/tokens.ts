/**
 * Vekon — design system para plataformas de pesquisa online.
 * Estética institucional premium: navy profundo, acentos ciano, superfícies em vidro.
 */
export const vekon = {
  colors: {
    navy: "#0b1220",
    navyMid: "#152238",
    navySoft: "#1e3354",
    primary: "#0f2847",
    primaryHover: "#0a1f38",
    accent: "#22d3ee",
    accentDark: "#0891b2",
    accentMuted: "#cffafe",
    accentGlow: "rgba(34, 211, 238, 0.35)",
    surface: "#eef3f9",
    surfaceAlt: "#e2eaf4",
    surfaceElevated: "#ffffff",
    glass: "rgba(255, 255, 255, 0.78)",
    glassBorder: "rgba(255, 255, 255, 0.55)",
    border: "#cbd8e8",
    borderStrong: "#94a8be",
    text: "#0c1524",
    textMuted: "#5a6b82",
    textInverse: "#f8fafc",
    success: "#059669",
    successBg: "#ecfdf5",
    warning: "#d97706",
    warningBg: "#fffbeb",
    danger: "#dc2626",
    dangerBg: "#fef2f2",
    experimentBg: "#666666",
  },
  gradient: {
    hero: "linear-gradient(145deg, #0b1220 0%, #152238 45%, #1a3a5c 100%)",
    accent: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    cardShine:
      "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.72) 100%)",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    full: "9999px",
  },
  shadow: {
    sm: "0 1px 2px rgba(11, 18, 32, 0.06)",
    md: "0 8px 30px rgba(11, 18, 32, 0.08)",
    lg: "0 20px 50px rgba(11, 18, 32, 0.14)",
    glow: "0 0 0 1px rgba(34, 211, 238, 0.2), 0 8px 32px rgba(34, 211, 238, 0.15)",
  },
  font: {
    sans: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Consolas", monospace',
  },
} as const;

export type VekonColor = keyof typeof vekon.colors;
