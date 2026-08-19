"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; color: string };

export function ExpenseFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // any filter change resets pagination
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        updateParams({ search: search || undefined });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("categoryId") ||
    searchParams.get("from") ||
    searchParams.get("to");

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit md:hidden"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {hasFilters && <span className="bg-primary size-1.5 rounded-full" />}
      </Button>
      <div
        className={cn(
          "flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end",
          mobileOpen ? "flex" : "hidden md:flex",
        )}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="filter-search">Search</Label>
          <Input
            id="filter-search"
            placeholder="Search description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-category">Category</Label>
          <Select
            value={searchParams.get("categoryId") ?? "__all__"}
            onValueChange={(value) =>
              updateParams({ categoryId: value === "__all__" ? undefined : (value ?? undefined) })
            }
          >
            <SelectTrigger id="filter-category" className="w-full sm:w-40">
              <SelectValue placeholder="All categories">
                {(value: string | null) => {
                  const category = categories.find((c) => c.id === value);
                  return category?.name ?? "All categories";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <span
                    className="inline-block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <div className="grid flex-1 gap-1.5 sm:flex-none">
            <Label htmlFor="filter-from">From</Label>
            <Input
              id="filter-from"
              type="date"
              defaultValue={searchParams.get("from") ?? ""}
              onChange={(e) => updateParams({ from: e.target.value || undefined })}
              className="w-full sm:w-40"
            />
          </div>
          <div className="grid flex-1 gap-1.5 sm:flex-none">
            <Label htmlFor="filter-to">To</Label>
            <Input
              id="filter-to"
              type="date"
              defaultValue={searchParams.get("to") ?? ""}
              onChange={(e) => updateParams({ to: e.target.value || undefined })}
              className="w-full sm:w-40"
            />
          </div>
        </div>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            className="w-fit"
            onClick={() => {
              setSearch("");
              router.push(pathname);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
