import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ExpensePagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefForPage = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/expenses?${query}` : "/expenses";
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        Page {page} of {totalPages} ({total} expense{total === 1 ? "" : "s"})
      </p>
      <div className="flex gap-2">
        {page <= 1 ? (
          <Button variant="outline" disabled>
            Previous
          </Button>
        ) : (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={hrefForPage(page - 1)} />}
          >
            Previous
          </Button>
        )}
        {page >= totalPages ? (
          <Button variant="outline" disabled>
            Next
          </Button>
        ) : (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={hrefForPage(page + 1)} />}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
