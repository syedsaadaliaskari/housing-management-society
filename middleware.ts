import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any)?.role as string | undefined;

  const adminPaths = [
    "/",
    "/members",
    "/units",
    "/ownerships",
    "/billing",
    "/payments",
    "/expenses",
    "/complaints",
    "/sos",
    "/notices",
    "/polls",
    "/vehicles",
    "/reports",
    "/staff",
    "/visitors",
    "/gate-log",
    "/patrols",
    "/amenities",
    "/inventory",
    "/users",
    "/notifications",
  ];

  const isAdminPath = adminPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const isResidentPath =
    pathname === "/resident" || pathname.startsWith("/resident/");

  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/resident", req.url));
  }

  if (isResidentPath && role !== "RESIDENT") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|public).*)",
  ],
};
