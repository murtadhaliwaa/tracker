"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages, IntlError } from "next-intl";

type Props = {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
};

function onIntlError(error: IntlError) {
  if (error.code === "MISSING_MESSAGE" || error.code === "ENVIRONMENT_FALLBACK") {
    return;
  }
  console.error(error);
}

export function IntlProvider({ children, locale, messages }: Props) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="UTC"
      onError={onIntlError}
      getMessageFallback={({ key }) => key}
    >
      {children}
    </NextIntlClientProvider>
  );
}
