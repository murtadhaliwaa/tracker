import { hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { BootSplashDismiss } from "@/components/boot-splash-dismiss";
import { IntlProvider } from "@/components/intl-provider";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { cn } from "@/lib/utils";

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <IntlProvider locale={locale} messages={messages}>
      <BootSplashDismiss />
      <div dir={locale === "ar" ? "rtl" : "ltr"} className={cn(locale === "ar" && cairo.variable)}>
        <PwaInstallPrompt />
        {children}
      </div>
    </IntlProvider>
  );
}
