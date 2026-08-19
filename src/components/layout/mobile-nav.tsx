"use client";

import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { LINKS } from "@/components/layout/nav-links";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileNav({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer rounded-md p-1.5 outline-none focus-visible:ring-3",
              className,
            )}
          >
            <Menu className="size-5" />
            <span className="sr-only">Open navigation menu</span>
          </button>
        }
      />
      <DropdownMenuContent align="center" className="w-44">
        {LINKS.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <DropdownMenuItem
              key={link.href}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "text-primary font-medium" : undefined}
              onClick={() => router.push(link.href)}
            >
              {link.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
