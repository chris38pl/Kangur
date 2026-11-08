import { ApiClientError } from "@/lib/api/client";

/** Boot reads fail closed so Home cannot sit on a skeleton forever. */
export const BOOT_REQUEST_TIMEOUT_MS = 12_000;

export function withTimeout<T>(
  promise: Promise<T>,
  ms = BOOT_REQUEST_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ApiClientError("NETWORK_ERROR", "Network request failed."));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
