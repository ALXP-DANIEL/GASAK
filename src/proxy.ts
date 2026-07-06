import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/about",
  "/tournaments",
  "/squads",
  "/shop",
  "/contact",
  "/news",
  "/recruitment",
] as const;

const authPaths = ["/login", "/forgot-password", "/reset-password"] as const;

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (path) =>
      pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

function isAuthPath(pathname: string) {
  return authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function safeCallbackPath(value: string | null, request: NextRequest) {
  if (!value) return null;

  const url = new URL(value, request.url);
  if (url.origin !== request.nextUrl.origin) return null;
  if (isAuthPath(url.pathname)) return null;
  if (isPublicPath(url.pathname)) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isAuthPath(pathname)) {
    if (hasSession && pathname === "/login") {
      const callbackPath =
        safeCallbackPath(
          request.nextUrl.searchParams.get("callbackUrl"),
          request,
        ) ??
        safeCallbackPath(
          request.nextUrl.searchParams.get("callbackURL"),
          request,
        ) ??
        safeCallbackPath(request.nextUrl.searchParams.get("next"), request);

      return NextResponse.redirect(
        new URL(callbackPath ?? "/dashboard", request.url),
      );
    }

    return NextResponse.next();
  }

  if (!hasSession) {
    const callbackPath = `${pathname}${search}`;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    loginUrl.searchParams.set("next", callbackPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|logos|icons|.*\\..*).*)",
  ],
};
