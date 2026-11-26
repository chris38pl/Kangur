/**
 * Printing is the opposite of the app: a list in Kangur is shared and ticked with a thumb.
 * "Małym drukiem" is an idiom about small print, not about paper.
 */
export function printingIn(text: string): RegExpExecArray | null {
  return /\p{L}*druk\p{L}*|druczek|\bPDF\b/iu.exec(text.replace(/małym drukiem/giu, ""));
}
