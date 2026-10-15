import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
export { open, shot, fullshot, txt, onboard, tab };
export async function pakistaniTimes(page){
  await tab(page,'Profile');
  await page.locator('label:has-text("Pakistani meal times")').click(); await page.waitForTimeout(300);
  await tab(page,'Day');
}
export async function setChai(page, A=()=>{}){
  await tab(page,'Prep'); A('Prep tab');
  await page.getByRole('button',{name:'Set my chai'}).click(); A('Set my chai'); await page.waitForTimeout(500);
  const d=page.locator('dialog[open]').last();
  await d.locator('label').filter({hasText:'Buffalo'}).first().click(); A('Buffalo');
  await d.locator('label').filter({hasText:/^2$/}).first().click(); A('2 tsp');
  await d.locator('label').filter({hasText:/^Cup\s*200/}).first().click(); A('Cup 200ml');
  await d.getByRole('button',{name:'Save my chai'}).click(); A('Save my chai'); await page.waitForTimeout(600);
}
export const dlg = (page) => page.locator('dialog[open]').last();
