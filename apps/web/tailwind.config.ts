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
        background: "#F3F3F3",
        foreground: "#181818",
        brand: {
          blue: "#0176D3",
          hover: "#014486",
          navy: "#032D60",
          header: "#EAF5FE",
          DEFAULT: "#0176D3",
        },
        sf: {
          blue: "#0176D3",
          blueHover: "#014486",
          navy: "#032D60",
          header: "#EAF5FE",
          canvas: "#F3F3F3",
          border: "#DDDBDA",
          text: "#181818",
          secondary: "#5C5C5C",
          success: "#2E844A",
          successBg: "#EBF7E6",
          warning: "#8A5200",
          warningBg: "#FEF1D6",
          error: "#BA0517",
          errorBg: "#FEDED8",
          lead: "#F88962",
          account: "#7F8DE1",
          project: "#3BA755",
          agreement: "#4BC076",
          opportunity: "#FCB95B",
        },
        primary: {
          DEFAULT: "#0176D3",
          foreground: "#FFFFFF",
          hover: "#014486",
        },
        secondary: {
          DEFAULT: "#EAF5FE",
          foreground: "#0176D3",
          hover: "#D6ECFD",
        },
        muted: {
          DEFAULT: "#F3F3F3",
          foreground: "#5C5C5C",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#181818",
        },
        border: "#DDDBDA",
      },
      borderRadius: {
        lg: "4px",
        md: "4px",
        sm: "4px",
        DEFAULT: "4px",
      },
      fontSize: {
        base: ["13px", "18px"],
      },
    },
  },
  plugins: [],
};

export default config;
