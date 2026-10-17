// A one-shot hand-off from another view to Prep (R3-A, Mariam #3): the Day view's "Make it" on
// tonight's job opens Prep with that recipe's Make / Cook dialog. Owner: Lena.
// Module state, not the URL: the router keeps `#/prep` as it is, and Back never reopens a dialog.

let pending = null;

/** @param {{ cook: string }} intent the food id of the recipe to open in the Cook dialog */
export function setPrepIntent(intent) {
  pending = intent && typeof intent.cook === 'string' ? { cook: intent.cook } : null;
}

/** The pending intent, once: reading it clears it. @returns {{ cook: string }|null} */
export function takePrepIntent() {
  const out = pending;
  pending = null;
  return out;
}
