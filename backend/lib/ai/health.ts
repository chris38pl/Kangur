import {
  AI_PROVIDER_CAPABILITIES,
} from "./capabilities";
import type { AiRuntimeConfig } from "./config";
import type { AiOrchestrator } from "./orchestrator";
import type { AiCapability, AiProviderId } from "./types";

export type AiProviderHealthEntry = {
  id: AiProviderId;
  configured: boolean;
  inChain: boolean;
  supports: AiCapability[];
  models?: { text: string; vision: string };
};

export type AiProvidersHealthResponse = {
  chain: AiProviderId[];
  providers: AiProviderHealthEntry[];
};

export function getAiProvidersHealth(
  orchestrator: AiOrchestrator,
): AiProvidersHealthResponse {
  const config = orchestrator.getConfig();
  const known: AiProviderId[] = ["openai", "gemini"];
  const chainSet = new Set(config.chain);

  const providers: AiProviderHealthEntry[] = known.map((id) => {
    const port = orchestrator.getProvider(id);
    const configured = Boolean(port?.isConfigured());
    const entry: AiProviderHealthEntry = {
      id,
      configured,
      inChain: chainSet.has(id),
      supports: [...AI_PROVIDER_CAPABILITIES[id]],
    };
    if (id === "openai") {
      entry.models = {
        text: config.openai.textModel,
        vision: config.openai.visionModel,
      };
    }
    if (id === "gemini") {
      entry.models = {
        text: config.gemini.textModel,
        vision: config.gemini.visionModel,
      };
    }
    return entry;
  });

  return { chain: config.chain, providers };
}

export function summarizeConfigForHealth(
  config: AiRuntimeConfig,
): AiProvidersHealthResponse {
  // Used only if orchestrator wiring needs a static snapshot — prefer getAiProvidersHealth.
  return {
    chain: config.chain,
    providers: [
      {
        id: "openai",
        configured: Boolean(config.openai.apiKey),
        inChain: config.chain.includes("openai"),
        supports: [...AI_PROVIDER_CAPABILITIES.openai],
        models: {
          text: config.openai.textModel,
          vision: config.openai.visionModel,
        },
      },
      {
        id: "gemini",
        configured: Boolean(config.gemini.apiKey),
        inChain: config.chain.includes("gemini"),
        supports: [...AI_PROVIDER_CAPABILITIES.gemini],
        models: {
          text: config.gemini.textModel,
          vision: config.gemini.visionModel,
        },
      },
    ],
  };
}
