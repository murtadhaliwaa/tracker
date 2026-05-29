import { redirect } from "next/navigation";
import { AppShellLoader } from "@/components/gamification/app-shell-loader";
import { getViewerContext } from "@/lib/viewer";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <AppShellLoader userId={viewer.userId} locale={locale}>
      {children}
    </AppShellLoader>
  );
}
