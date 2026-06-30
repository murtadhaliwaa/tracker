/** Static skeleton matching DashboardMagicBento grid — shown while GSAP chunk loads. */
export function DashboardBentoSkeleton() {
  return (
    <div className="magic-bento-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[120px] animate-pulse rounded-2xl border border-rpg-border bg-rpg-surface/80"
          style={{
            gridColumn: i === 0 ? "span 2" : undefined,
            gridRow: i === 0 ? "span 2" : undefined,
          }}
        />
      ))}
    </div>
  );
}
