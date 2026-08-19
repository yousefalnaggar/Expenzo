"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-6 text-center sm:px-6">
      <h1 className="text-lg font-medium">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        We couldn&apos;t load your dashboard. Please try again.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
