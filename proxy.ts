import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/api/notifications/retailcrm-order",
  "/api/telegram-webhook",
  "/favicon.ico",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="Dashboard"',
    },
  });
}

function isAuthorized(request: NextRequest) {
  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;

  if (!username || !password) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return false;

  const credentials = atob(authorization.slice("Basic ".length));
  const separatorIndex = credentials.indexOf(":");
  if (separatorIndex === -1) return false;

  const incomingUsername = credentials.slice(0, separatorIndex);
  const incomingPassword = credentials.slice(separatorIndex + 1);

  return incomingUsername === username && incomingPassword === password;
}

export function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!isAuthorized(request)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
