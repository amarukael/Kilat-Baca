import { NextRequest, NextResponse } from "next/server";
import { generateTraceId } from "./lib/logger";

const SESSION_COOKIE = "mctk_auth";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  // Generate traceId untuk setiap request
  const traceId = generateTraceId();

  // Protect /dashboard — redirect to /login if no session cookie
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Add traceId to request headers
  const response = NextResponse.next();
  response.headers.set("x-trace-id", traceId);

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
