import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FB",
        foreground: "#0F172A",
        navy: {
          DEFAULT: "#0F172A",
          900: "#0F172A",
          800: "#1E293B",
        },
        slate: {
          muted: "#64748B",
          light: "#94A3B8",
        },
        brand: {
          DEFAULT: "#5B4BDB",
          hover: "#4B3DC7",
          light: "#EEF2FF",
        },
        primary: {
          DEFAULT: "#5B4BDB",
          foreground: "#FFFFFF",
          hover: "#4B3DC7",
        },
        secondary: {
          DEFAULT: "#EEF2FF",
          foreground: "#5B4BDB",
          hover: "#E0E7FF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
      },
      borderRadius: {
        "2xl": "16px",
        xl: "12px",
        lg: "10px",
        md: "8px",
        sm: "6px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
        dropdown: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
