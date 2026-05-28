import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        rpg: {
          page: "#0a0a0f",
          card: "#0f0f1a",
          sidebar: "#0c0c17",
          border: "#1e1e3a",
          elevated: "#13131f",
          gold: "#f0c040",
          purple: "#7c5cbf",
          teal: "#2dd4bf",
          red: "#ef4444",
          green: "#4ade80",
          blue: "#60a5fa",
          "text-primary": "#e8e8f0",
          "text-secondary": "#8888aa",
          "text-muted": "#555577",
        },
      },
      boxShadow: {
        rpgGold: "0 0 24px rgba(240, 192, 64, 0.25)",
        rpgPurple: "0 0 24px rgba(124, 92, 191, 0.25)",
        rpgTeal: "0 0 24px rgba(45, 212, 191, 0.25)",
        rpgBlue: "0 0 24px rgba(96, 165, 250, 0.25)",
        rpgGreen: "0 0 24px rgba(74, 222, 128, 0.25)",
        rpgRed: "0 0 24px rgba(239, 68, 68, 0.25)",
      },
    },
  },
} satisfies Config;
