import Link from "next/link";
import { auth } from "@/auth";
import { signOutUser } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Welcome, {session?.user?.name ?? "there"}</h1>
          <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
        </div>
        <form action={signOutUser}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
      <p className="text-muted-foreground text-sm">
        Dashboard charts and summaries land in a later phase.
      </p>
      <Button variant="outline" className="w-fit" render={<Link href="/expenses" />}>
        View expenses
      </Button>
    </div>
  );
}
