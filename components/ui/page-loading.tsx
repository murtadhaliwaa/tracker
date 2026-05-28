import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#1a1a2e]/70", className)}
      aria-hidden
    />
  );
}

function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-0.5 w-14 rounded-full" />
          <Skeleton className="h-8 w-44 max-w-[60vw] sm:w-56" />
        </div>
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withAction ? <Skeleton className="h-10 w-28 shrink-0 rounded-lg" /> : null}
    </div>
  );
}

function BentoGridSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/3] min-h-[160px]" />
      ))}
    </div>
  );
}

function ListSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function ChartGridSkeleton() {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Skeleton className="h-52" />
      <Skeleton className="h-52" />
    </div>
  );
}

export type PageLoadingVariant =
  | "default"
  | "dashboard"
  | "habits"
  | "stats"
  | "profile"
  | "settings"
  | "list"
  | "split";

type Props = {
  variant?: PageLoadingVariant;
  className?: string;
};

export function PageLoading({ variant = "default", className }: Props) {
  return (
    <div
      className={cn("min-w-0 max-w-full space-y-6 overflow-x-hidden", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading…</span>

      {variant === "dashboard" ? (
        <>
          <PageHeaderSkeleton />
          <BentoGridSkeleton />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            </div>
            <Skeleton className="min-h-[280px]" />
          </div>
        </>
      ) : null}

      {variant === "habits" ? (
        <>
          <PageHeaderSkeleton withAction />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>
          <ListSectionSkeleton rows={4} />
          <ListSectionSkeleton rows={2} />
        </>
      ) : null}

      {variant === "stats" ? (
        <>
          <PageHeaderSkeleton />
          <ChartGridSkeleton />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </>
      ) : null}

      {variant === "profile" ? (
        <>
          <PageHeaderSkeleton withAction />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56 max-w-full" />
              <Skeleton className="h-2 w-full max-w-md" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </>
      ) : null}

      {variant === "settings" ? (
        <>
          <PageHeaderSkeleton />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-[#1e1e3a]/60 p-5">
              <Skeleton className="h-5 w-36" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between gap-4">
                    <Skeleton className="h-4 w-48 max-w-[70%]" />
                    <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : null}

      {variant === "list" ? (
        <>
          <PageHeaderSkeleton />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        </>
      ) : null}

      {variant === "split" ? (
        <>
          <PageHeaderSkeleton />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="min-h-[320px]" />
            <Skeleton className="min-h-[320px]" />
          </div>
        </>
      ) : null}

      {variant === "default" ? (
        <>
          <PageHeaderSkeleton />
          <ChartGridSkeleton />
          <Skeleton className="h-40" />
        </>
      ) : null}
    </div>
  );
}
