// A one-shot hand-off from another view to Prep (R3-A, Mariam #3): the Day view's "Make it" on
// tonight's job opens Prep with that recipe's Make / Cook dialog. Owner: Lena.
// Module state, not the URL: the router keeps `#/prep` as it is, and Back never reopens a dialog.

let pending = null;

/**
 * @param {{ cook: string, boxes?: number|null }} intent the food id of the recipe to open in the
 *   Cook dialog, and (from a plan job) how many boxes the plan's batch makes: the dialog opens on it
 */
export function setPrepIntent(intent) {
  pending =
    intent && typeof intent.cook === 'string'
      ? {
          cook: intent.cook,
          boxes: Number.isInteger(intent.boxes) && intent.boxes > 0 ? intent.boxes : null,
        }
      : null;
}

/** The pending intent, once: reading it clears it. @returns {{ cook: string, boxes: number|null }|null} */
export function takePrepIntent() {
  const out = pending;
  pending = null;
  return out;
}
