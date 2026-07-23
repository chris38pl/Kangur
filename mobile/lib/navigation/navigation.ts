import { type Href, router } from "expo-router";

const ROOT_HREF = "/(tabs)" as const;

/**
 * Thin navigation API — one responsibility per method.
 * Screens/Intents call these; do not use raw dismiss/replace for Root/Task exits.
 *
 * @see docs/navigation-principles.md
 */

/** Leave stacks and land on app Root (today: Home tab). */
export function goRoot(): void {
  try {
    // Pop list / shop / nested Task frames back to Root when possible.
    if (router.canDismiss()) {
      router.dismissTo(ROOT_HREF as Href);
    }
  } catch {
    // fall through
  }
  try {
    // replace (not navigate) so list/shop unmount even if dismissTo could not
    // fully clear the stack — avoids a mounted-but-blurred subscriber.
    router.replace("/(tabs)/" as never);
  } catch {
    try {
      router.navigate("/(tabs)/" as never);
    } catch {
      router.replace(ROOT_HREF as never);
    }
  }
}

/** End Task → Root; clears Task history under the finished screen. */
export function finishTask(): void {
  goRoot();
}

/** End Task → Root → push Details (e.g. Create List → list editor). */
export function finishTaskAndOpen(href: Href): void {
  goRoot();
  queueMicrotask(() => {
    router.push(href as never);
  });
}

/** Replace current Details (Edit → saved Product). Not a Task exit. */
export function replaceDetails(href: Href): void {
  router.replace(href as never);
}

/** One step back in hierarchy (Details / inside Task). */
export function navigateBack(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  goRoot();
}

/**
 * Leave current screen toward a parent when stack back is wrong/unavailable.
 * Prefer an explicit href (e.g. list editor) over guessing.
 */
export function navigateUp(fallbackHref?: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  if (fallbackHref) {
    router.replace(fallbackHref as never);
    return;
  }
  goRoot();
}

/** Push Details over current stack. */
export function openDetails(href: Href): void {
  router.push(href as never);
}

/** Push Task (conscious entry into a user job). */
export function openTask(href: Href): void {
  router.push(href as never);
}
