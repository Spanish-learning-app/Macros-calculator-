// Nutrition Lab review ledger (NUTRITION.md §9). Owner: Dr. Ayesha Siddiqui.
//
// Records Ayesha has checked against their sources and passed (or fixed and re-checked). Every build
// script (research/javier, research/zainab, research/yusuf) calls stampReview() on each record, which
// sets source.reviewer = 'ayesha' and source.date = the review date. A record that is not listed here
// keeps its researcher as reviewer (data gate G19 counts them). A record whose numbers change after
// review must be taken out of this list until it is re-checked.
//
// The verdicts and reasons are in research/review/sprint1.md (and javier-sprint1.md).

export const REVIEWS = {
  // id: 'YYYY-MM-DD' (date of the pass)
};

export function stampReview(rec) {
  const date = REVIEWS[rec.id];
  if (!date) return rec;
  return { ...rec, source: { ...rec.source, reviewer: 'ayesha', date } };
}
