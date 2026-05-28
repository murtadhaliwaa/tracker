import createNextIntlPlugin from "next-intl/plugin";

const nextConfig = {
  experimental: {
    cssChunking: "strict",
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
