// Fix wave R3-B (Mariam and Nasreen, Review 3): the data a beginner plans with, generated from the recipe sheets so
// the method, the record, the library recipe and the weekly plans say the same thing. Owner: Yusuf Benali.
//
//   minutesOf(s)        hands-on and start-to-finish minutes from the method's own steps (never typed)
//   keepOf(s, r, ST)    the one storage truth: fridge life, fridge/freezer split, parts made later or fresh
//   splitText(...)      the sentence every boxUp and storage plan carries ({{split}} in the sheet)
//   storageWordsCheck   a boxUp / storage plan may not state its own split or other day counts
//   packCheck           "Done when" is checked on a step before the food is packed

// Sheet-only step keys (the app's Method contract keeps text, heat, minutes; build.mjs strips the rest):
//   wait: true    hands-off minutes (oven, simmer, rest, cool, soak, chill): counts in the total, not hands-on
//   during: true  done while the previous timer runs ("Meanwhile ..."): counts hands-on, not in the total
//   ahead: true   started before the cooking session (the night before: a 4 h marinade). Counts in the total (start
//                 to finish is from the first step); hands-on unless it is also wait. Named in the time note.
//   later: true   done later, for each box (the night before a lunch: boil the penne; on the night: crack the eggs).
//                 In neither total of the batch: the time note says it with the sheet's laterNote.
//   check: true   the "is it done?" step, which carries the doneness test itself
//   pack: true    the first step that fills the boxes
// Sheet keys for time: prepMinutes (hands-on of "Before you start", default 2 a line), prepWait (hands-off minutes
// inside "Before you start": the eggs boil 10 and cool 5), waitNote (what the waiting is), laterNote (when the
// later steps are done; required when a step is later).
export const SHEET_STEP_KEYS = ['text', 'heat', 'minutes', 'wait', 'during', 'ahead', 'later', 'check', 'pack'];

const roundMin = (x) => (x <= 15 ? Math.round(x) : 5 * Math.round(x / 5));

// Hands-on minutes = "Before you start" (2 min a line unless the sheet sets prepMinutes) + every step that is not
// hands-off; a step with no time counts 1 minute. Total (start to finish, R3-B: marinade, soak, chill and oven
// included) = prep + prepWait + every step not done during another, waits and ahead steps included. Later steps
// (per box, later in the week) are counted apart: laterHands and laterTotal.
export function minutesOf(s) {
  const m = s.method;
  const prep = s.prepMinutes ?? 2 * m.prep.length;
  let hands = prep;
  let total = prep + (s.prepWait ?? 0);
  let ahead = 0;
  let laterHands = 0;
  let laterTotal = 0;
  for (const st of m.steps) {
    const t = st.minutes ?? 1;
    const during = st.during ?? /^(Meanwhile|While)\b/.test(st.text);
    // Oven and microwave minutes are hands-off unless the sheet says otherwise.
    const wait = st.wait ?? (/^oven|^microwave$/.test(st.heat ?? '') && !!st.minutes);
    if (st.ahead && st.later) throw new Error(`${s.id}: a step cannot be both ahead and later`);
    if (st.later) {
      if (!during) laterTotal += t;
      if (!wait) laterHands += t;
      continue;
    }
    if (st.ahead) ahead += t;
    if (!during) total += t;
    if (!wait) hands += t;
  }
  if (laterTotal && !s.laterNote) throw new Error(`${s.id}: a step is later: say when in laterNote ("the night before each lunch")`);
  if (!laterTotal && s.laterNote) throw new Error(`${s.id}: laterNote but no step is later`);
  return { hands: roundMin(hands), total: roundMin(Math.max(total, hands)), ahead: roundMin(ahead), laterHands: roundMin(laterHands), laterTotal: roundMin(Math.max(laterTotal, laterHands)), prep };
}

// "1 h 25 min", "45 min", "2 h"
export const durText = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`);

// The storage truth of the standard batch, by the same rule as the app's storagePlan (app/core/mealprep.js):
// fridge life = the shortest fridge life of what is in the box on the day it is made; a box freezes when its main
// parts all freeze; the first `fridgeDays` boxes go in the fridge, the rest in the freezer. Two kinds of part do not
// set the life: `later` (cooked the night before each box is eaten: the bolognese penne) and `fresh` (made again in
// rounds within its own life, or on the night it is eaten: raita, dressed salad, the shakshuka eggs).
export function keepOf(s, r, ST) {
  const parts = r.components.map((c, i) => ({ c, sc: s.components[i] })).filter((p) => ST.has(p.c.storage));
  const isLater = (p) => !!p.sc.later;
  const isFresh = (p) => !!p.sc.fresh;
  const stored = parts.filter((p) => !isLater(p) && !isFresh(p));
  if (!stored.length) throw new Error(`${s.id}: every component is later or fresh: nothing is stored`);
  const fridgeDays = Math.min(...stored.map((p) => ST.get(p.c.storage).fridgeDays));
  const main = stored.filter((p) => !p.c.pot);
  const judged = main.length ? main : stored;
  const freezable = judged.every((p) => ST.get(p.c.storage).freezable === true);
  const fridge = freezable ? Math.min(r.boxes, fridgeDays) : r.boxes;
  const freezer = r.boxes - fridge;
  const fm = freezable ? Math.min(...judged.map((p) => ST.get(p.c.storage).freezerMonths)) : null;
  const keep = { fridgeDays, fridge, freezer, freezable, ...(fm ? { freezerMonths: fm } : {}) };
  const later = parts.filter(isLater).map((p) => {
    const l = p.sc.later;
    if (typeof l !== 'object' || !l.when || !l.job) throw new Error(`${s.id}: component ${p.c.id} later needs { when, job }`);
    return { name: p.c.label, storage: p.c.storage, fridgeDays: ST.get(p.c.storage).fridgeDays, when: l.when, job: l.job };
  });
  const fresh = parts.filter(isFresh).map((p) => ({ name: p.c.label, storage: p.c.storage, fridgeDays: ST.get(p.c.storage).fridgeDays, ...(typeof p.sc.fresh === 'object' && p.sc.fresh.again ? { again: p.sc.fresh.again } : {}) }));
  if (later.length) keep.later = later;
  if (fresh.length) keep.fresh = fresh;
  // A batch that cannot freeze and has more boxes than days of life: the sheet must say how (rounds) or it fails.
  if (!freezable && r.boxes > fridgeDays && !s.sameDayOk) throw new Error(`${s.id}: ${r.boxes} × ${r.serving} do not freeze and keep ${fridgeDays} days: make it in rounds (fewer boxes) or set sameDayOk with the reason in the boxUp`);
  return keep;
}

const WEEKDAY_FROM_SUNDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];

// The generated split sentence ({{split}} in a sheet's boxUp and storage plan).
export function splitText(keep, u, boxes, eatNow = 0) {
  const d = keep.fridgeDays;
  const range = (a, b) => (a === b ? `${cap(u.one)} ${a}` : `${cap(u.many)} ${a}–${b}`);
  const life = (it) => (d === 1 ? `eat ${it} the next day` : `eat ${it} within ${d} days (by ${WEEKDAY_FROM_SUNDAY[d]} if you make ${it} on Sunday)`);
  const noFreeze = keep.freezable ? '' : ' Do not freeze.';
  // A dinner made on the night: the first `eatNow` are eaten then, the rest follow the same rule.
  const now = eatNow ? `Eat ${range(1, eatNow).toLowerCase()} the day you make it. ` : '';
  const first = eatNow + 1;
  const inFridge = keep.fridge - eatNow;
  if (!keep.freezer) {
    if (boxes - eatNow === 1) return `${now}${eatNow ? `${range(first, first)} goes in` : 'Into'} the fridge: ${life('it')}.${noFreeze}`;
    return `${now}${boxes === 2 && !eatNow ? `Both ${u.many}` : eatNow ? range(first, boxes) : `All ${boxes} ${u.many}`} go in the fridge: ${life('them')}.${noFreeze}`;
  }
  const m = keep.freezerMonths;
  const fr = inFridge > 0 ? `${range(first, keep.fridge)} in the fridge: ${life(inFridge === 1 ? 'it' : 'them')}. ` : '';
  return `${now}${fr}${range(keep.fridge + 1, boxes)} in the freezer: eat within ${m} month${m > 1 ? 's' : ''}, and move one to the fridge the night before you eat it.`;
}

// "3 days in the fridge, 3 months frozen" (+ the sheet's keepsNote): the library page's Keeps column.
export function keepsText(keep, note) {
  const base = `${keep.fridgeDays} day${keep.fridgeDays > 1 ? 's' : ''} in the fridge, ${keep.freezable ? `${keep.freezerMonths} month${keep.freezerMonths > 1 ? 's' : ''} frozen` : 'do not freeze'}`;
  return note ? `${base}; ${note}` : base;
}

// A sheet's boxUp, storage plan and keepsNote may not write their own split: the split sentence is generated.
// Day and month counts they still name (a raita keeps 2 days) must be the life of some part of this recipe.
const SPLIT_WORDS = /\b(?:box|boxes|portion|portions|jar|jars|wedge|wedges|wrap|wraps|roll|rolls)\s+\d|\b\d\s+(?:(?:in|for|into) the (?:fridge|freezer)|frozen)\b/i;
const WORD_N = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
export function storageWordsCheck(s, field, text, allowed) {
  const bad = (why) => {
    throw new Error(`R-MP-${s.n} ${s.id}: ${field} ${why}`);
  };
  if (typeof text !== 'string') bad('is missing');
  const n = text.split('{{split}}').length - 1;
  if (!['keepsNote', 'equipment', 'reheat'].includes(field) && n !== 1) bad(`must contain {{split}} exactly once (found ${n}): the split sentence is generated`);
  const rest = text.replace('{{split}}', '');
  const m = rest.match(SPLIT_WORDS);
  if (m) bad(`states a split of its own ("${m[0]}"): leave it to {{split}}`);
  for (const x of rest.matchAll(/\b(\d+|one|two|three|four|five|six)[ -](day|month)s?\b/gi)) {
    const v = WORD_N[x[1].toLowerCase()] ?? Number(x[1]);
    const set = x[2].toLowerCase() === 'day' ? allowed.days : allowed.months;
    if (!set.has(v)) bad(`says "${x[0]}", which is not the life of any part of this recipe (${[...set].join(', ')} ${x[2]}s)`);
  }
}

// Done when, before packing: a prep with a heated step checks doneness on a step of its own, before the step that
// fills the boxes, and that step carries the test (not a pointer to the Finish screen).
export function packCheck(s, steps, doneWhen) {
  const bad = (why) => {
    throw new Error(`R-MP-${s.n} ${s.id}: method ${why}`);
  };
  const packs = steps.map((st, i) => (st.pack ? i : -1)).filter((i) => i >= 0);
  const checks = steps.map((st, i) => (st.check ? i : -1)).filter((i) => i >= 0);
  if (packs.length !== 1) bad(`needs exactly one step marked pack: true (the first step that fills the boxes); found ${packs.length}`);
  const heated = steps.some((st) => st.heat && st.heat !== 'none');
  if (s.effort === 'cook' && !doneWhen) bad('of a cook prep needs doneWhen');
  if (doneWhen && heated) {
    if (!checks.length) bad('heats food and has no step marked check: true (the doneness test, before packing)');
    if (checks[0] > packs[0]) bad(`checks doneness on step ${checks[0] + 1}, after packing on step ${packs[0] + 1}`);
  }
  for (const i of checks) if (/see "Done when"/i.test(steps[i].text)) bad(`step ${i + 1} points at "Done when" instead of saying what to check`);
  for (const st of steps) if (/see "Done when"/i.test(st.text)) bad(`a step points at "Done when" instead of saying what to check: "${st.text.slice(0, 60)}"`);
}

export const fracText = (x) => {
  const whole = Math.floor(x + 1e-9);
  const f = x - whole;
  const fr = f < 0.125 ? '' : f < 0.375 ? '¼' : f < 0.625 ? '½' : f < 0.875 ? '¾' : null;
  if (fr === null) return String(whole + 1);
  return whole ? `${whole}${fr}` : fr || '0';
};
export { NUM, WEEKDAY_FROM_SUNDAY };
