import { type NextRequest, NextResponse } from "next/server";

import { corsHeaders, isOriginAllowed } from "@/lib/cors";
import {
  MARKETING_LOCALE_COOKIE,
  isMarketingStaticAsset,
} from "@/lib/marketing/locale";
import { decideMarketingRoute } from "@/lib/marketing/routing";

function applyCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  if (!isOriginAllowed(origin)) return response;
  const headers = corsHeaders(origin);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/** The same request on another path. Keeps the query string (utm_* from campaign links). */
function atPath(request: NextRequest, path: string): URL {
  const url = new URL(path, request.url);
  url.search = request.nextUrl.search;
  return url;
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

  // No cookie is set here: pages stay identical for everyone and the CDN can keep them.
  // The language switcher stores the visitor's choice itself.
  const decision = decideMarketingRoute({
    pathname,
    cookieLocale: request.cookies.get(MARKETING_LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    userAgent: request.headers.get("user-agent"),
  });

  switch (decision.kind) {
    case "next":
      return NextResponse.next();
    case "rewrite":
      return NextResponse.rewrite(atPath(request, decision.path));
    case "redirect":
      return NextResponse.redirect(
        atPath(request, decision.path),
        decision.status,
      );
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
