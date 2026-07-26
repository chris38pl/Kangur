import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { requireUser } from "@/lib/auth/requireUser";

const f = createUploadthing();

/**
 * UploadThing file router — Feedback attachments only.
 * Do not add other product upload routes here without an explicit product decision.
 */
export const feedbackFileRouter = {
  feedbackImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      try {
        const { user } = await requireUser(req);
        return { userId: user.id };
      } catch (error) {
        console.warn("[uploadthing]", "FeedbackImageUnauthorized", error);
        throw new UploadThingError("Unauthorized");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.info("[uploadthing]", "FeedbackImageComplete", {
        userId: metadata.userId,
        key: file.key,
      });

      return {
        uploadedBy: metadata.userId,
        key: file.key,
        url: file.ufsUrl,
      };
    }),
} satisfies FileRouter;

export type FeedbackFileRouter = typeof feedbackFileRouter;
