import { start } from './lib.mjs';
const S = await start({ stateFrom: 's4-wed-after-move' });
const { page, tap, shot, log } = S;
await S.open('2026-10-22T08:05:00+02:00');
await tap(page.getByText('Prep', { exact: true }));
const c = page.locator('[data-testid=batch-card]').nth(1);
await c.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, -60));
await shot('s4-thu-4-meatballs-past-use-by');
const throwBtn = page.getByRole('button', { name: 'Throw away' });
log('throw-away-count', await throwBtn.count());
// Thursday day view: dinner entry note; and wed->thu freezer note if not moved
await page.getByText('Day', { exact: true }).click(); await page.waitForTimeout(300);
await page.locator('[data-testid=entry]', { hasText: 'Mandonguilles' }).scrollIntoViewIfNeeded();
await shot('s4-thu-5-day-dinner-last-day');
// what if I had NOT moved it: state before move
await S.finish('s4b');
