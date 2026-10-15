import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
const S = await open('2026-10-15T08:30:00+02:00'); const {page}=S;
await onboard(page); await tab(page,'Prep');
await page.getByRole('button',{name:/New recipe/}).click(); await page.waitForTimeout(500);
await page.locator('dialog input').first().fill('Chicken salan pot');
await page.getByRole('button',{name:/Add ingredients/}).click(); await page.waitForTimeout(500);
for (const q of ['1 kg chicken','3 onions','3 tomatoes']) {
  await page.keyboard.press('Control+A'); await page.keyboard.type(q); await page.waitForTimeout(500);
  console.log('=== '+q+'\n'+(await page.locator('dialog[open]').last().innerText()).slice(120,900));
  await shot(page,'12-ing-'+q.replace(/\W+/g,'-'));
}
await S.browser.close();
