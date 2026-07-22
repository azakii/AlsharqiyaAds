import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--c-bg, #06080B)",
          soft: "var(--c-bg-soft, #0B0E13)",
          card: "var(--c-card, #10141B)",
        },
        gold: {
          DEFAULT: "var(--c-gold, #D4A017)",
          light: "var(--c-gold-light, #F5D17E)",
          dark: "var(--c-gold-dark, #B8860B)",
          muted: "#B99A48",
        },
        line: "var(--c-line, rgba(212, 160, 23, 0.16))",
      },
      fontFamily: {
        display: ["var(--font-body)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(90deg, var(--c-gold-light, #F5D17E) 0%, var(--c-gold-dark, #B8860B) 100%)",
        "gold-radial": "radial-gradient(circle at 50% 0%, rgba(212,160,23,0.10), transparent 60%)",
      },
      boxShadow: {
        gold: "0 10px 40px -10px rgba(212, 160, 23, 0.35)",
        card: "0 8px 30px -12px rgba(0,0,0,0.7)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
