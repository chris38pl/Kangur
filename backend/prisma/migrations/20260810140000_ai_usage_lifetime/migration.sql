-- Consolidate Free AI usage into a single lifetime bucket (epoch periodStart).
-- Sum historical monthly rows so users do not get a free refill.

CREATE TEMP TABLE "_ai_usage_lifetime_sums" AS
SELECT
  "workspaceId",
  SUM("aiCreditsUsed")::integer AS "total"
FROM "AIUsage"
GROUP BY "workspaceId";

DELETE FROM "AIUsage";

INSERT INTO "AIUsage" ("id", "workspaceId", "periodStart", "aiCreditsUsed", "updatedAt")
SELECT
  'ai_lt_' || md5(random()::text || clock_timestamp()::text || s."workspaceId"),
  s."workspaceId",
  TIMESTAMPTZ '1970-01-01 00:00:00+00',
  s."total",
  CURRENT_TIMESTAMP
FROM "_ai_usage_lifetime_sums" s;

DROP TABLE "_ai_usage_lifetime_sums";
