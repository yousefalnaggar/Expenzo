import Link from "next/link";
import { auth } from "@/auth";
import { NavLinks } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

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
          <ThemeToggle />
          <UserMenu
            name={session?.user?.name ?? null}
            email={session?.user?.email ?? null}
            image={session?.user?.image ?? null}
          />
        </div>
      </div>
    </header>
  );
}
