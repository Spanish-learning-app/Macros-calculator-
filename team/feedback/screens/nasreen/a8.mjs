import { open, shot, txt, onboard, openAdd, search, pick, confirm } from './common.mjs';
const S = await open('2026-10-14T13:00:00+02:00');
const { page } = S;
await onboard(page);
await page.locator('button:has-text("Add")').filter({hasText:/^\s*\+?\s*Add\s*$/}).nth(1).click(); await page.waitForTimeout(300);
console.log('sheet title', (await txt(page)).includes('Add to Lunch'));
await pick(page,'daal mash','Daal mash (urad');
await page.locator('dialog[data-testid="portion-picker"] button.qty-chip:has-text("1½")').first().click();
await shot(page,'31-a8-daalmash-1half');
console.log((await txt(page)).split('Daal mash (urad, home-made)').pop().match(/= .*kcal/)?.[0]);
await confirm(page);
await pick(page,'rice','Rice, plain boiled');
console.log((await txt(page)).split('Rice, plain boiled (white basmati)').pop().slice(0,400).replace(/\n+/g,' | '));
await shot(page,'32-a8-rice-picker');
console.log('plate option?', (await page.locator('dialog[data-testid="portion-picker"] >> text=/plate/i').count()));
await page.locator('dialog[data-testid="portion-picker"] button.qty-chip:has-text("½")').first().click();
await shot(page,'33-a8-rice-half-plate');
console.log((await txt(page)).split('Rice, plain boiled (white basmati)').pop().match(/½.*kcal/)?.[0]);
await confirm(page);
// quantity box
await pick(page,'rice','Rice, plain boiled');
const qty = page.locator('[data-testid="qty-input"]').last();
for (const v of ['0.33','0','','-1','abc']) {
  await qty.fill(v); await page.waitForTimeout(250);
  const msg = (await txt(page)).split('Rice, plain boiled (white basmati)').pop().replace(/\n+/g,' | ').slice(0,300);
  console.log(JSON.stringify(v),'->',msg);
  await shot(page,'34-a8-qty-'+(v===''?'empty':v.replace('.','p').replace('-','neg')));
}
await S.browser.close();
