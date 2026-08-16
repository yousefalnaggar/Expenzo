export default function Loading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="bg-muted h-6 w-40 animate-pulse rounded" />
          <div className="bg-muted h-4 w-52 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-8 w-20 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-muted h-72 animate-pulse rounded-lg" />
        <div className="bg-muted h-72 animate-pulse rounded-lg" />
      </div>
      <div className="bg-muted h-48 animate-pulse rounded-lg" />
    </div>
  );
}
