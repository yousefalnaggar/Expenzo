import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PROTECTED_PREFIXES = ["/dashboard", "/expenses", "/settings"];

// UX-level redirect only — NOT the security boundary. Next.js middleware-only
// auth is bypassable (CVE-2025-29927); the real gate is requireUserId() in the
// DAL, which every data-access function calls independently of this file.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/expenses/:path*", "/settings/:path*"],
};
