import Link from "next/link";
import { auth } from "@/auth";
import { NavLinks } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="text-primary shrink-0 text-lg font-semibold tracking-tight"
        >
          Expenzo
        </Link>
        <NavLinks className="hidden md:flex" />
        <MobileNav className="md:hidden" />
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
