import { type NextRequest, NextResponse } from "next/server";

import { corsHeaders, isOriginAllowed } from "@/lib/cors";

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    if (!isOriginAllowed(origin)) {
      return new NextResponse(null, { status: 204 });
    }
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const response = NextResponse.next();
  if (isOriginAllowed(origin)) {
    const headers = corsHeaders(origin);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

export const proxyConfig = {
  matcher: "/api/:path*",
};
