// Scenario 1: Sunday 18 Oct 2026, cook the low-cook week's Sunday batch in the app, copy shopping lists.
import { start } from './lib.mjs';
import fs from 'node:fs';
const S = await start({ stateFrom: 's0' });
const { page, tap, type, shot, log, ctx } = S;
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
await S.open('2026-10-18T17:30:00+02:00');
await tap(page.getByText('Prep', { exact: true }));
const row = (id) => page.locator(`[data-testid=library-row][data-food-id="${id}"]`);
const info = (sel) => page.evaluate((s) => document.querySelector(s)?.innerText, sel);
const clip = () => page.evaluate(() => navigator.clipboard.readText());
const lists = {};
const cook = async (id, key) => {
  S.startCount('S1-cook-' + key);
  await row(id).scrollIntoViewIfNeeded();
  await tap(row(id).getByTestId('library-cook'));
  await shot(`s1-cook-${key}-dialog`);
  log(`cook-${key}-dialog-note`, (await info('[data-testid=cook-dialog]')).split('\n').filter(l => /Keeps|freeze|Doesn/.test(l)).join(' '));
  await tap(page.getByTestId('cook-save'));
  await page.waitForTimeout(300);
  log(`S1-cook-${key}`, { ...S.stopCount() });
};
const lastBatch = () => page.locator('[data-testid=batch-card]').first();
const batchCard = (n) => page.locator('[data-testid=batch-card]').nth(n);

// cook in the plan's order: meatballs, parfait, lentil bowl
await cook('es-mandonguilles-pesols-portion', 'meatballs');
await cook('es-queso-batido-parfait-jar', 'parfait');
await cook('med-lentil-rice-burgos-bowl-box', 'lentil');
await page.evaluate(() => window.scrollTo(0, 0));
await shot('s1-batches-top', { fullPage: false });
await shot('s1-batches-full', { fullPage: true });
const cards = await page.locator('[data-testid=batch-card]').count();
log('batches', cards);
for (let i = 0; i < cards; i++) log('card-' + i, await batchCard(i).innerText());

// shopping lists, one per batch
for (let i = 0; i < cards; i++) {
  const name = (await batchCard(i).locator('h3, .batch-name, header').first().innerText()).split('\n')[0];
  S.startCount('S1-shop-' + i);
  await batchCard(i).scrollIntoViewIfNeeded();
  await tap(batchCard(i).getByTestId('shopping-open'));
  await page.waitForTimeout(200);
  await shot(`s1-shop-${i}-top`);
  await tap(page.getByTestId('shopping-copy'));
  await page.waitForTimeout(300);
  lists[name] = await clip();
  log('S1-shop-' + i, { ...S.stopCount() });
  await shot(`s1-shop-${i}-copied`);
  await page.getByRole('button', { name: /close|×/i }).first().click().catch(async () => { await page.keyboard.press('Escape'); });
  await page.waitForTimeout(250);
}
fs.writeFileSync('s1-shopping-lists.txt', Object.entries(lists).map(([k, v]) => `##### ${k}\n${v}\n`).join('\n'));
await S.save('s1-cooked');
await S.finish('s1');
