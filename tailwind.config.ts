import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0A0B",
          soft: "#0F0F11",
          card: "#141416",
        },
        gold: {
          DEFAULT: "#E8C56A",
          light: "#F5DE9A",
          dark: "#C9A227",
          muted: "#B99A48",
        },
        line: "rgba(232, 197, 106, 0.14)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F5DE9A 0%, #E8C56A 45%, #C9A227 100%)",
        "gold-radial": "radial-gradient(circle at 50% 0%, rgba(232,197,106,0.12), transparent 60%)",
      },
      boxShadow: {
        gold: "0 10px 40px -10px rgba(232, 197, 106, 0.35)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
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
