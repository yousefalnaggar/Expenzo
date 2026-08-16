import Link from "next/link";
import { auth } from "@/auth";
import { signOutUser } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/layout/nav-links";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-6 sm:justify-start">
          <Link href="/dashboard" className="text-primary text-lg font-semibold tracking-tight">
            Expenzo
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {session?.user?.email}
          </span>
          <form action={signOutUser}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
