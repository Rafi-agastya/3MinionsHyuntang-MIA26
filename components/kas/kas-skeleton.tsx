export function KasSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-14 bg-zinc-200/70 rounded-2xl w-full" />

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-zinc-200/60 rounded-2xl p-5" />
        ))}
      </div>

      {/* Controls Skeleton */}
      <div className="h-28 bg-zinc-200/50 rounded-2xl p-5" />

      {/* Table Skeleton */}
      <div className="h-96 bg-zinc-200/40 rounded-2xl p-5" />
    </div>
  );
}
