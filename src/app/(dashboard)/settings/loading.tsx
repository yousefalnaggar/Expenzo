export default function Loading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="bg-muted h-6 w-24 animate-pulse rounded" />
        <div className="bg-muted h-8 w-28 animate-pulse rounded" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-10 w-full animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
