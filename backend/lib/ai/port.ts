import type {
  AiCapability,
  AiProviderAttemptResult,
  AiStructuredRequest,
} from "./types";

export interface AiCompletionPort {
  readonly id: string;
  supports(capability: AiCapability): boolean;
  isConfigured(): boolean;
  completeStructured(
    req: AiStructuredRequest,
  ): Promise<AiProviderAttemptResult>;
}
