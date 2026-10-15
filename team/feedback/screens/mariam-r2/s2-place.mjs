// Sunday evening: place the week. Then Mon-Thu checks later.
import { start } from './lib.mjs';
const S = await start({ stateFrom: 's1-cooked' });
const { page, tap, shot, log } = S;
await S.open('2026-10-18T18:30:00+02:00');
await tap(page.getByText('Prep', { exact: true }));
const card = (n) => page.locator('[data-testid=batch-card]').nth(n);
const slotChip = (c, label) => c.getByTestId('place-slot').getByRole('button', { name: label, exact: true });
const note = (c) => c.getByTestId('batch-note').innerText().catch(() => null);

// lentil bowl x2 -> Lunch with Fill Mon-Thu
S.startCount('S2-fill-lunch-2boxes');
await card(2).scrollIntoViewIfNeeded();
await tap(slotChip(card(2), 'Lunch'));
await shot('s2-1-lentil-before-fill');
await tap(card(2).getByTestId('fill-mon-thu'));
log('lentil-fill-note', await note(card(2)));
await shot('s2-2-lentil-after-fill');
log('S2-fill-lunch-2boxes', { ...S.stopCount() });
log('lentil-card', await card(2).innerText());

// parfait x3 -> Breakfast with Fill
S.startCount('S2-fill-breakfast-3jars');
await card(1).scrollIntoViewIfNeeded();
await tap(slotChip(card(1), 'Breakfast / café'));
await tap(card(1).getByTestId('fill-mon-thu'));
log('parfait-fill-note', await note(card(1)));
log('S2-fill-breakfast-3jars', { ...S.stopCount() });
await shot('s2-3-parfait-after-fill');

// meatballs x4 -> Dinner Mon, Tue, Thu (taps on day chips)
S.startCount('S2-meatballs-Mon-Tue-Thu');
await card(0).scrollIntoViewIfNeeded();
for (const d of ['2026-10-19', '2026-10-20', '2026-10-22']) {
  await tap(card(0).locator(`[data-testid=place-day][data-date="${d}"]`));
  log('meatballs-note-' + d, await note(card(0)));
}
log('S2-meatballs', { ...S.stopCount() });
await shot('s2-4-meatballs-placed');
log('meatballs-card', await card(0).innerText());
await S.save('s2-placed');
await S.finish('s2');
