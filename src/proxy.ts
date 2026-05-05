import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = new Set([
  "/",
  "/login",
  "/register",
  "/convite",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic =
    publicPaths.has(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/manifest") ||
    pathname === "/sw.js";

  if (isPublic) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as string | undefined;
  if (pathname.startsWith("/aluno") && role !== "STUDENT") {
    return NextResponse.redirect(new URL(homeForRole(role), req.url));
  }
  if (pathname.startsWith("/encarregado") && role !== "PARENT") {
    return NextResponse.redirect(new URL(homeForRole(role), req.url));
  }
  if (pathname.startsWith("/professor") && role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), req.url));
  }

  return NextResponse.next();
}

function homeForRole(role: string | undefined) {
  switch (role) {
    case "STUDENT":
      return "/aluno";
    case "PARENT":
      return "/encarregado";
    case "TEACHER":
    case "ADMIN":
      return "/professor";
    default:
      return "/login";
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
