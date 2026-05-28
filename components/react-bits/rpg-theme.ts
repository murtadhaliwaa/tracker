/** Shared React Bits defaults tuned for Life RPG palette. */

export const RPG_BORDER_GLOW = {
  surface: "#1a1a2e",
  radius: 12,
  goldColors: ["#D4AF37", "#f5e6a3", "#7C3AED"],
  purpleColors: ["#7C3AED", "#a78bfa", "#D4AF37"],
  bossColors: ["#ef4444", "#7C3AED", "#D4AF37"],
  goldGlowHsl: "43 70 55",
  purpleGlowHsl: "262 83 65",
} as const;

export const RPG_SHINY_GOLD = {
  color: "#D4AF37",
  shineColor: "#fff7d6",
  speed: 3,
  spread: 110,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
