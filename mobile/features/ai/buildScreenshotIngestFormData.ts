import { File } from "expo-file-system";

type ImageAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

/**
 * Build multipart body for AI screenshot ingest.
 * Do not append RN `{ uri, name, type }` - newer fetch throws
 * "Unsupported FormDataPart implementation".
 */
export async function buildScreenshotIngestFormData(
  asset: ImageAsset,
): Promise<FormData> {
  const formData = new FormData();
  formData.append("source", "screenshot");

  const fileName = asset.fileName ?? "screenshot.jpg";
  const mimeType = asset.mimeType ?? "image/jpeg";

  try {
    // Preferred: expo-file-system File (Blob) for expo/fetch multipart.
    formData.append("file", new File(asset.uri));
  } catch {
    // Fallback for odd content:// URIs - read as Blob via fetch.
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    formData.append("file", blob, fileName);
  }

  formData.append("fileName", fileName);
  formData.append("mimeType", mimeType);
  return formData;
}
