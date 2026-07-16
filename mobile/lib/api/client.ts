import { z } from "zod";

const HealthSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthSchema>;

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
}

export async function fetchHealth(): Promise<HealthResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return HealthSchema.parse(await res.json());
}

export function hasApiUrl(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());
}
