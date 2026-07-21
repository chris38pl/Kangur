import { type NextRequest, NextResponse } from "next/server";

import { corsHeaders, isOriginAllowed } from "@/lib/cors";
import {
  MARKETING_LOCALE_COOKIE,
  isAppLocale,
  isMarketingStaticAsset,
  resolveMarketingLocale,
  withLocale,
} from "@/lib/marketing/locale";

function applyCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  if (!isOriginAllowed(origin)) return response;
  const headers = corsHeaders(origin);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

function setLocaleCookie(response: NextResponse, locale: string) {
  response.cookies.set(MARKETING_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  response.headers.set("x-kangur-locale", locale);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      if (!isOriginAllowed(origin)) {
        return new NextResponse(null, { status: 204 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }
    return applyCors(request, NextResponse.next());
  }

  if (isMarketingStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && isAppLocale(first)) {
    const response = NextResponse.next();
    setLocaleCookie(response, first);
    return response;
  }

  const locale = resolveMarketingLocale({
    cookieLocale: request.cookies.get(MARKETING_LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });

  // Unprefixed /support → /{locale}/contact
  if (pathname === "/support" || pathname === "/support/") {
    const response = NextResponse.redirect(
      new URL(withLocale(locale, "/contact"), request.url),
      308,
    );
    setLocaleCookie(response, locale);
    return response;
  }

  const targetPath =
    pathname === "/" ? withLocale(locale, "/") : withLocale(locale, pathname);
  const response = NextResponse.redirect(new URL(targetPath, request.url));
  setLocaleCookie(response, locale);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
