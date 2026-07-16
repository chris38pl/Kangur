import { NextResponse } from "next/server";
import { HealthResponseSchema } from "@/openapi/registry";

export function GET() {
  const body = HealthResponseSchema.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(body);
}
