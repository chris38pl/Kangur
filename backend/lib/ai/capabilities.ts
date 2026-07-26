import type { AiCapability, AiProviderId } from "./types";

/**
 * Capability matrix SSOT — orchestrator filters the chain via supports().
 * Update this when adding a provider; do not scatter capability checks.
 */
export const AI_PROVIDER_CAPABILITIES: Record<
  AiProviderId,
  readonly AiCapability[]
> = {
  openai: ["text", "vision", "structuredJson"],
  gemini: ["text", "vision", "structuredJson"],
};

export function providerSupports(
  providerId: AiProviderId,
  capability: AiCapability,
): boolean {
  return AI_PROVIDER_CAPABILITIES[providerId]?.includes(capability) ?? false;
}

export function capabilitiesForRequest(
  capability: "text" | "vision",
): AiCapability[] {
  return capability === "vision"
    ? ["vision", "structuredJson"]
    : ["text", "structuredJson"];
}
