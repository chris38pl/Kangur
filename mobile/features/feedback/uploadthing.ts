import { generateReactNativeHelpers } from "@uploadthing/expo";

function getUploadThingUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim()?.replace(/\/$/, "");
  if (!base) {
    return "http://localhost:3000/api/uploadthing";
  }
  return `${base}/api/uploadthing`;
}

/**
 * Build an RN-compatible File for UploadThing.
 * Plain `{ uri, name, type }` lacks `size` → server returns 400 Invalid input.
 * Matches @uploadthing/expo image-picker helpers.
 */
export async function toUploadThingRnFile(input: {
  uri: string;
  fileName: string;
  mimeType: string;
}): Promise<File> {
  const blob = await fetch(input.uri).then((r) => r.blob());
  const file = new File([blob], input.fileName, {
    type: input.mimeType || "image/jpeg",
  });
  // RN FormData reads `uri` off the object (not a browser Blob stream).
  return Object.assign(file, { uri: input.uri });
}

/**
 * Typed against backend FeedbackFileRouter endpoint names.
 * Auth: pass Clerk bearer via useUploadThing headers option.
 */
export const { useUploadThing } = generateReactNativeHelpers<{
  feedbackImage: any;
}>({
  url: getUploadThingUrl(),
});
