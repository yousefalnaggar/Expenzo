import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Second UX-level layer alongside proxy.ts — every future dashboard route
  // inherits this guard. Still not the security boundary; requireUserId() in
  // the DAL is what actually enforces ownership on every query.
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="min-h-svh">
      <Navbar />
      {children}
    </div>
  );
}
