import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    secret:
      process.env.NEXTAUTH_SECRET ||
      "default_development_secret_streamflix_super_secure_key",
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;
        if (
          pathname === "/" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/imagekit-auth") ||
          pathname.startsWith("/api/video") ||
          pathname.startsWith("/api/test-db") ||
          pathname === "/login" ||
          pathname === "/register"
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};