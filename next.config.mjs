import createNextIntlPlugin from "next-intl/plugin";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tracker-virid-mu.vercel.app";
const isProd = process.env.NODE_ENV === "production";

const baseSecurityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

if (isProd) {
  baseSecurityHeaders.unshift({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const productionCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    cssChunking: "strict",
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },
  async headers() {
    const headers = [...baseSecurityHeaders];

    // Next.js dev (HMR/webpack) requires eval; skip CSP locally to avoid console errors.
    if (isProd) {
      headers.push({
        key: "Content-Security-Policy",
        value: productionCsp,
      });
    }

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_URL: appUrl,
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
