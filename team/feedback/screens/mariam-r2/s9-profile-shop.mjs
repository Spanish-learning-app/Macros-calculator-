import { start } from './lib.mjs';
const S = await start({ stateFrom: 's5-thu-morning' });
const { page, tap, type, shot, log, ctx } = S;
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
await S.open('2026-10-22T18:00:00+02:00');
await tap(page.getByText('Profile', { exact: true }));
await shot('s9-1-profile-top');
log('profile-text', (await page.evaluate(() => document.querySelector('#app').innerText)).replace(/\n+/g, ' | ').slice(0, 2500));
await shot('s9-2-profile-full', { fullPage: true });
// shopping list salmon: a no-cook batch, and doubling
await tap(page.getByText('Prep', { exact: true }));
const card = page.locator('[data-testid=batch-card]').first();
await card.scrollIntoViewIfNeeded();
await tap(card.getByTestId('shopping-open'));
log('salmon-shop-2', await S.text('[data-testid=shopping-list]'));
await tap(page.getByTestId('shop-more')); await tap(page.getByTestId('shop-more')); await tap(page.getByTestId('shop-more')); await tap(page.getByTestId('shop-more')); await tap(page.getByTestId('shop-more')); await tap(page.getByTestId('shop-more'));
log('salmon-shop-8', await S.text('[data-testid=shopping-list]'));
await shot('s9-3-shop-8');
await S.finish('s9');
