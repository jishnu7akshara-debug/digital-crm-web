/**
 * Digital Footprint OS Design Tokens: Modern Minimal SaaS Theme.
 * Recruitment CRM / Linear / Vercel style minimal SaaS aesthetic.
 */
export const themeTokens = {
  colors: {
    // Primary Accents
    primary: "#5B4BDB",        // Indigo/Violet
    primaryHover: "#4B3DC7",
    primaryLight: "#EEF2FF",   // Lavender tint
    
    // Neutrals
    navy: "#0F172A",          // Dark navy / near-black headings & primary buttons
    slate: "#64748B",         // Muted slate gray body & descriptions
    lightGray: "#94A3B8",     // Section labels & subtle hints
    border: "#E5E7EB",        // Thin light gray border
    background: "#F8F9FB",    // Page canvas very light gray
    card: "#FFFFFF",          // Pure white cards & sidebar
    white: "#FFFFFF",

    // Status Badges (Pill shapes with soft tinted background & matching text)
    badge: {
      lavender: { bg: "#EEF2FF", text: "#5B4BDB", border: "#E0E7FF" },
      blue: { bg: "#F0F9FF", text: "#0284C7", border: "#E0F2FE" },
      mint: { bg: "#ECFDF5", text: "#059669", border: "#D1FAE5" },
      amber: { bg: "#FFFBEB", text: "#D97706", border: "#FEF3C7" },
      rose: { bg: "#FFF1F2", text: "#E11D48", border: "#FFE4E6" },
      slate: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
    },
  },
  dimensions: {
    sidebarWidth: "260px",
    headerHeight: "64px",
    cardRadius: "16px",       // rounded-2xl
    inputRadius: "12px",      // rounded-xl
    buttonRadius: "12px",     // rounded-xl
    badgeRadius: "9999px",    // rounded-full
    baseFontSize: "14px",
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
} as const;
