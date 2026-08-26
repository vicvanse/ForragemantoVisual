/**
 * Vekon — design tokens para interfaces de pesquisa online.
 * Paleta institucional, tipografia limpa e componentes consistentes.
 */
export const vekon = {
  colors: {
    primary: "#1e3a5f",
    primaryHover: "#152a45",
    primaryLight: "#e8eef5",
    accent: "#0ea5e9",
    accentMuted: "#bae6fd",
    surface: "#f4f7fb",
    surfaceElevated: "#ffffff",
    border: "#d7e0ea",
    borderStrong: "#94a3b8",
    text: "#0f172a",
    textMuted: "#64748b",
    textInverse: "#ffffff",
    success: "#059669",
    successBg: "#ecfdf5",
    warning: "#d97706",
    warningBg: "#fffbeb",
    danger: "#dc2626",
    dangerBg: "#fef2f2",
    experimentBg: "#666666",
  },
  radius: {
    sm: "0.375rem",
    md: "0.625rem",
    lg: "1rem",
    xl: "1.25rem",
    full: "9999px",
  },
  shadow: {
    sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
    md: "0 4px 16px rgba(15, 23, 42, 0.08)",
    lg: "0 12px 40px rgba(15, 23, 42, 0.12)",
  },
  font: {
    sans: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Consolas", monospace',
  },
} as const;

export type VekonColor = keyof typeof vekon.colors;
