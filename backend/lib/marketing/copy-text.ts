/**
 * Puts text on the clipboard. The old way is still needed: apps that open links in their own
 * window (most of our visitors from social media) often have no async clipboard.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Not allowed here. The old way may still work.
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  // Stays in the viewport, otherwise phones scroll to it. 16px stops iPhones from zooming in.
  field.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
  document.body.append(field);
  const focused = document.activeElement;
  field.select();
  field.setSelectionRange(0, text.length);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
  }
}
