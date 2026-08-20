import Link from "next/link";
import { getUserProfile } from "@/lib/dal/users";
import { NavLinks } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export async function Navbar() {
  // Reads the DB directly rather than session.user.{name,email,image} — the
  // JWT is per-device and only refreshes on this device's own
  // unstable_update() call, so trusting it here would show a stale avatar
  // on every other signed-in device until they next log in.
  const profile = await getUserProfile();

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
          <UserMenu name={profile.name} email={profile.email} image={profile.image} />
        </div>
      </div>
    </header>
  );
}
