"use client";

import { LogOut } from "lucide-react";
import { signOutUser } from "@/lib/actions/auth-actions";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  name,
  email,
  image,
}: {
  name: string | null;
  email: string | null;
  image: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="focus-visible:ring-ring/50 cursor-pointer rounded-full outline-none focus-visible:ring-3"
          >
            <UserAvatar name={name} image={image} size="sm" />
            <span className="sr-only">Open account menu</span>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 p-2">
          <UserAvatar name={name} image={image} size="lg" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{name ?? "Account"}</span>
            <span className="text-muted-foreground truncate text-xs">{email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOutUser()}
          className="bg-destructive focus:bg-destructive/90 mt-1 rounded-lg px-3 py-2.5 text-white hover:cursor-pointer focus:text-white dark:text-white"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
