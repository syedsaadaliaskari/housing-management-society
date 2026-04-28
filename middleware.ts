export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/",
    "/resident/:path*",
    "/members/:path*",
    "/units/:path*",
    "/users/:path*",
    "/billing/:path*",
    "/payments/:path*",
    "/expenses/:path*",
    "/complaints/:path*",
    "/sos/:path*",
    "/notices/:path*",
    "/polls/:path*",
    "/vehicles/:path*",
    "/ownerships/:path*",
    "/reports/:path*",
  ],
};
