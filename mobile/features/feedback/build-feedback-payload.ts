import * as Device from "expo-device";
import { Platform } from "react-native";

import { getAppBuildInfo } from "@/lib/app-build-info";
import type { AppLocale } from "@/lib/i18n/locales";

import type { CreateFeedbackInput, FeedbackType } from "./schemas";

export type FeedbackDiagnosticsContext = {
  type: FeedbackType;
  title: string;
  description: string;
  language: AppLocale;
  attachmentKey?: string | null;
  attachmentUrl?: string | null;
  workspaceId?: string | null;
  listId?: string | null;
  shoppingSessionId?: string | null;
  route?: string | null;
};

export function buildFeedbackPayload(
  ctx: FeedbackDiagnosticsContext,
): CreateFeedbackInput {
  const build = getAppBuildInfo();
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || null;

  return {
    type: ctx.type,
    title: ctx.title,
    description: ctx.description,
    language: ctx.language,
    attachmentKey: ctx.attachmentKey ?? null,
    attachmentUrl: ctx.attachmentUrl ?? null,
    appVersion: build.version,
    buildNumber: build.build !== "-" ? build.build : null,
    platform: Platform.OS,
    deviceModel: Device.modelName ?? null,
    osVersion: Device.osVersion ?? null,
    environment: build.environment,
    apiBaseUrl,
    workspaceId: ctx.workspaceId ?? null,
    listId: ctx.listId ?? null,
    shoppingSessionId: ctx.shoppingSessionId ?? null,
    route: ctx.route ?? null,
  };
}
