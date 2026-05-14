import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyToken(token: string) {
  try {
    if (!JWT_SECRET) return false;
    const encodedSecret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, encodedSecret);
    return true;
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip public assets and api auth paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/public"
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("session")?.value;
  const isAuthenticated = sessionToken ? await verifyToken(sessionToken) : false;

  // Public pages that don't require authentication
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (isAuthPage) {
    // If already logged in, redirect away from login/register to dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // For all other routes (dashboard, normal APIs), require auth
  if (!isAuthenticated) {
    // If it's an API call, return JSON error instead of redirect
    if (pathname.startsWith("/api")) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // Redirect to login for page requests
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (except /api/chat, /api/projects, etc which are explicitly secured inside API too)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
