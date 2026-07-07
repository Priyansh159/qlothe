import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#06402B", // brand green
        pine: "#052E1F", // hover green
        ink: "#1A1A16", // body text
        paper: "#F4F4F2", // warm off-white surfaces
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      keyframes: {
        qfade: { from: { opacity: "0" }, to: { opacity: "1" } },
        qslideup: {
          from: { transform: "translateY(14px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        qdrawer: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        qsheet: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        qpop: {
          "0%": { transform: "scale(.85)", opacity: "0" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        qmarquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        qfade: "qfade .3s ease",
        qslideup: "qslideup .25s ease",
        qdrawer: "qdrawer .28s cubic-bezier(.4,0,.2,1)",
        qsheet: "qsheet .3s cubic-bezier(.4,0,.2,1)",
        qpop: "qpop .5s ease",
        qmarquee: "qmarquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
