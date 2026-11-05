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
        background: "#F8F8FC",
        foreground: "#1D1930",
        brand: {
          purple: "#6C3BDB",
          "dark-purple": "#25124D",
          lavender: "#F5F1FF",
          DEFAULT: "#6C3BDB",
        },
        sidebar: {
          bg: "#25124D",
          text: "#E9E5F0",
          muted: "#9D95B5",
          active: "#381E6E",
          hover: "#2F195C",
          border: "#3F2577",
        },
        df: {
          text: "#1D1930",
          secondary: "#77738A",
          border: "#E9E5F0",
          surface: "#FFFFFF",
          subtle: "#F5F1FF",
          canvas: "#F8F8FC",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1D1930",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1D1930",
        },
        primary: {
          DEFAULT: "#6C3BDB",
          foreground: "#FFFFFF",
          hover: "#5A2EC0",
        },
        secondary: {
          DEFAULT: "#F5F1FF",
          foreground: "#6C3BDB",
          hover: "#ECE4FC",
        },
        muted: {
          DEFAULT: "#F3F1F8",
          foreground: "#77738A",
        },
        accent: {
          DEFAULT: "#F5F1FF",
          foreground: "#6C3BDB",
        },
        destructive: {
          DEFAULT: "#E53E3E",
          foreground: "#FFFFFF",
        },
        border: "#E9E5F0",
        input: "#E9E5F0",
        ring: "#6C3BDB",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

