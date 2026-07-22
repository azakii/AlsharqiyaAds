import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "rgb(var(--c-bg) / <alpha-value>)",
          soft: "rgb(var(--c-bg-soft) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--c-gold) / <alpha-value>)",
          light: "rgb(var(--c-gold-light) / <alpha-value>)",
          dark: "rgb(var(--c-gold-dark) / <alpha-value>)",
          muted: "#B99A48",
        },
        line: "rgba(212, 160, 23, 0.16)",
      },
      fontFamily: {
        display: ["var(--font-body)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(90deg, rgb(var(--c-gold-light)) 0%, rgb(var(--c-gold-dark)) 100%)",
        "gold-radial": "radial-gradient(circle at 50% 0%, rgb(var(--c-gold) / 0.10), transparent 60%)",
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
