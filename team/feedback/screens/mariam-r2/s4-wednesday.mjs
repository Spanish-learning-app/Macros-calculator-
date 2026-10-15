// Wednesday 21 Oct: the evening, "Move to fridge" prompt, last-day and past-use-by notes.
import { start } from './lib.mjs';
const S = await start({ stateFrom: 's3-tue-done' });
const { page, tap, type, shot, log } = S;
const tickEntry = async (frag) => { const l = page.locator('[data-testid=entry]', { hasText: frag }).locator('.entry-status'); await l.scrollIntoViewIfNeeded(); await tap(l); };
const entryTexts = () => page.evaluate(() => [...document.querySelectorAll('[data-testid=entry]')].map(e => e.innerText.replace(/\n+/g, ' | ')));
const cards = () => page.evaluate(() => [...document.querySelectorAll('[data-testid=batch-card]')].map(c => c.innerText.replace(/\n+/g, ' | ')));

await S.open('2026-10-21T08:05:00+02:00');
log('wed-0805-entries', await entryTexts());
await shot('s4-wed-1-morning');
await tickEntry('parfait');
await S.open('2026-10-21T13:25:00+02:00');
log('wed-1325-entries', await entryTexts());
await tickEntry('Salmon');

// Wed evening 19:30, open the Day view
await S.open('2026-10-21T19:30:00+02:00');
await shot('s4-wed-2-evening-top');
log('wed-1930-top', (await page.evaluate(() => document.querySelector('#app').innerText)).split('\n').slice(0, 26).join(' / '));
log('tonight-card', await S.text('[data-testid=move-tonight]'));
const mv = page.getByTestId('move-to-fridge');
log('tonight-visible-count', await mv.count());
const b = await mv.first().boundingBox().catch(() => null);
log('move-btn-box', b);
log('wed-1930-entries', await entryTexts());
await shot('s4-wed-3-evening-full', { fullPage: true });
// Prep tab batch cards before the move
await tap(page.getByText('Prep', { exact: true }));
await shot('s4-wed-4-prep-top');
log('prep-tonight-card', await S.text('[data-testid=move-tonight]'));
log('prep-cards-before', await cards());
await page.getByText('Day', { exact: true }).click();
await page.waitForTimeout(300);
S.startCount('Wed-1930-move-to-fridge');
await tap(page.getByTestId('move-to-fridge').first());
log('Wed-1930-move-to-fridge', { ...S.stopCount() });
await shot('s4-wed-5-after-move');
log('tonight-card-after', await S.text('[data-testid=move-tonight]'));
await S.save('s4-wed-after-move');
// Thursday morning: Day view and batch cards
await S.open('2026-10-22T08:05:00+02:00');
await shot('s4-thu-1-morning-top');
log('thu-0805-entries', await entryTexts());
await tap(page.getByText('Prep', { exact: true }));
log('thu-prep-cards', await cards());
await shot('s4-thu-2-prep-top');
await shot('s4-thu-3-prep-full', { fullPage: true });
await S.finish('s4-wed');
