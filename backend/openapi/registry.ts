import { z } from "zod";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const HealthResponseSchema = z
  .object({
    status: z.literal("ok"),
    timestamp: z.string().datetime(),
  })
  .openapi("HealthResponse");

registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Health check",
  tags: ["System"],
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Kangur Platform API",
      version: "0.1.0",
      description:
        "AUTO-GENERATED from Zod via openapi:generate. Do not hand-edit.",
    },
    servers: [{ url: "/" }],
  });
}
