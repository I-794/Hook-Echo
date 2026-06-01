import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Storm-ops palette
        ink: {
          950: "#05070d",
          900: "#0a0e17",
          800: "#11161f",
          700: "#1a212c",
          600: "#28303d",
        },
        storm: {
          // accent cyan used for radar / brand
          400: "#38e1ff",
          500: "#13c3ee",
          600: "#0aa3cc",
        },
        warn: {
          tornado: "#ff2e63",
          severe: "#ff7b29",
          watch: "#ffd23f",
          flood: "#28c76f",
          winter: "#7aa2ff",
          other: "#9aa6b2",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,46,99,0.55)" },
          "70%": { boxShadow: "0 0 0 14px rgba(255,46,99,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,46,99,0)" },
        },
        "sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        "sweep": "sweep 4s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
