import type { Metadata, Viewport } from "next";
import { Cinzel, Inter, Cairo } from "next/font/google";
import { PreloadCleanup } from "@/components/preload-cleanup";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://tracker-virid-mu.vercel.app"),
  title: {
    default: "Life RPG — Habit Tracker",
    template: "%s | Life RPG",
  },
  description: "Personal habit tracking and life gamification web app by Murtadha Ali.",
  applicationName: "Life RPG",
  authors: [{ name: "Murtadha Ali", url: "https://github.com/murtadhaliwaa/tracker" }],
  creator: "Murtadha Ali",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Life RPG",
    title: "Life RPG — Habit Tracker",
    description: "Personal habit tracking and life gamification web app.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life RPG",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/favicon-32.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cinzel.variable} ${cairo.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PreloadCleanup />
        {children}
      </body>
    </html>
  );
}
