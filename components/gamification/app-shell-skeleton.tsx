import { PageLoading, type PageLoadingVariant } from "@/components/ui/page-loading";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-[#1a1a2e]/80", className)} aria-hidden />;
}

export function AppShellSkeleton({
  children,
  isRtl = false,
}: {
  children: React.ReactNode;
  isRtl?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header
        className={cn(
          "sticky top-0 z-40 flex h-14 items-center justify-between border-b border-rpg-border bg-rpg-sidebar/95 px-4 backdrop-blur-md md:hidden",
          isRtl && "flex-row-reverse",
        )}
      >
        <Bar className="size-10 rounded-lg" />
        <Bar className="h-5 w-24" />
        <Bar className="h-7 w-12 rounded-full" />
      </header>

      <div className={cn("mx-auto flex max-w-7xl", isRtl && "rpg-shell-row")}>
        <aside
          className={cn(
            "sticky top-0 hidden h-[100dvh] w-[280px] shrink-0 border-rpg-border bg-rpg-sidebar p-5 md:flex md:flex-col",
            isRtl ? "border-l" : "border-r",
          )}
        >
          <Bar className="mb-6 h-6 w-32" />
          <Bar className="mb-2 h-20 w-full rounded-xl" />
          <Bar className="mb-6 h-16 w-full rounded-xl" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bar key={i} className="h-11 w-full" />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-24 pt-4 md:px-10 md:pb-8 md:pt-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rpg-border bg-rpg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bar key={i} className="mx-1 h-10 flex-1 rounded-lg" />
          ))}
        </div>
      </nav>
    </div>
  );
}

export function AppShellPageSkeleton({ variant = "default" }: { variant?: PageLoadingVariant }) {
  return (
    <AppShellSkeleton>
      <PageLoading variant={variant} />
    </AppShellSkeleton>
  );
}
