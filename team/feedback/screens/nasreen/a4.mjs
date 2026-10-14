import { open, shot, fullshot, txt, onboard, search, sheetRow } from './common.mjs';
const S = await open('2026-10-14T21:30:00+02:00');
const { page } = S;
await onboard(page);
let actions = 0;
const addBtns = page.locator('button:has-text("Add")').filter({hasText:/^\s*\+?\s*Add\s*$/});
const t0 = Date.now();
const qtyChip = async v => { await page.locator('dialog[data-testid="portion-picker"] button.qty-chip', {hasText: new RegExp('^'+v+'$')}).first().click(); actions++; };
async function log(slotIdx, q, name, opts={}) {
  await page.locator('section.slot, [data-slot]').nth(slotIdx).locator('button:has-text("Add")').first().click().catch(async()=>{ await addBtns.nth(slotIdx).click(); }); actions++;
  await page.locator('input[type=search],input[type=text]').first().fill(q); actions++;
  await page.waitForTimeout(150);
  await sheetRow(page, name).click(); actions++;
  await page.waitForTimeout(200);
  if (opts.serving) { await page.locator('dialog[data-testid="portion-picker"] label', {hasText: opts.serving}).first().click(); actions++; }
  if (opts.qty) await qtyChip(opts.qty);
  await page.getByRole('button',{name:/^Add to /}).last().click(); actions++;
  await page.waitForTimeout(250);
  await page.getByRole('button',{name:'Done'}).click(); actions++;
  await page.waitForTimeout(250);
}
console.log('slots', await page.locator('section.slot, [data-slot]').count());
await log(0,'anda paratha','Anda paratha');
await log(0,'chai','Chai, doodh patti (home), 1 tsp sugar');
await log(1,'daal chawal','Daal chawal');
await log(2,'chai','Chai, doodh patti (home), 1 tsp sugar');
await log(2,'biscuit','Marie biscuit',{qty:'2'});
await log(3,'karahi','Chicken karahi (home-made)');
await log(3,'roti','Roti / chapati (home, no ghee)',{qty:'2'});
console.log('actions', actions, 'ms', Date.now()-t0);
await shot(page,'35-d0-logged');
await fullshot(page,'35-d0-logged-full');
console.log((await txt(page)).slice(0,1400));
await S.browser.close();
