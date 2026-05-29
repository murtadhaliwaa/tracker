import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life RPG — Habit Tracker",
    short_name: "Life RPG",
    description: "Personal habit tracking and life gamification web app.",
    start_url: "/en/dashboard",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    lang: "en",
    dir: "auto",
    categories: ["productivity", "health", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
