import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShellLoader } from "@/components/gamification/app-shell-loader";
import { AppShellSkeleton } from "@/components/gamification/app-shell-skeleton";
import { PageLoading } from "@/components/ui/page-loading";
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
    <Suspense
      fallback={
        <AppShellSkeleton isRtl={locale === "ar"}>
          <PageLoading variant="default" />
        </AppShellSkeleton>
      }
    >
      <AppShellLoader userId={viewer.userId} locale={locale}>
        {children}
      </AppShellLoader>
    </Suspense>
  );
}
