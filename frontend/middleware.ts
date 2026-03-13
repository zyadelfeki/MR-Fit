import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup");

  const isProtected =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/onboarding") ||
    nextUrl.pathname.startsWith("/exercises");

  // Redirect unauthenticated users away from protected pages
  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Exclude /api/auth, static files, and favicon from middleware
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
