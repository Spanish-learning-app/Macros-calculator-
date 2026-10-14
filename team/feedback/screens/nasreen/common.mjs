import { open, shot, fullshot, txt } from './lib.mjs';
export async function onboard(page) {
  await page.getByRole('button',{name:'Start'}).click();
  await page.locator('input[value=female]').click();
  await page.locator('input[type=text]').nth(0).fill('42');
  await page.locator('input[type=radio]').nth(3).click();
  const ins = page.locator('input[inputmode=decimal]');
  await ins.nth(1).fill('5'); await ins.nth(2).fill('3'); await ins.nth(3).fill('70');
  await page.locator('input[value=lose]').click();
  await page.getByRole('button',{name:'See my targets'}).click();
  await page.getByRole('button',{name:'Start logging'}).click();
  await page.waitForTimeout(500);
}
export { open, shot, fullshot, txt };
export async function openAdd(page, slotText) {
  const loc = slotText
    ? page.locator('section, article, div').filter({hasText: slotText}).locator('button:has-text("Add")').first()
    : page.locator('button:has-text("Add")').filter({hasText:/^\s*\+?\s*Add\s*$/}).first();
  await loc.click(); await page.waitForTimeout(300);
}
export async function search(page, q) {
  const box = page.locator('input[type=search],input[type=text]').first();
  await box.fill(q); await page.waitForTimeout(450);
}
export async function results(page) {
  return await page.evaluate(() => [...document.querySelectorAll('[class*="result"], [class*="food-row"], li')].map(e=>e.innerText.replace(/\n+/g,' | ')).slice(0,12));
}
export const sheetRow = (page, name) => page.locator('dialog[data-testid="add-sheet"] .food-name', { hasText: name }).first();
export async function pick(page, q, name) {
  await search(page, q);
  await sheetRow(page, name).click();
  await page.waitForTimeout(350);
}
export async function confirm(page) {
  await page.getByRole('button',{name:/^Add to /}).last().click();
  await page.waitForTimeout(450);
}
