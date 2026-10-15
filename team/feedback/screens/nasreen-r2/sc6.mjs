import { open, shot, txt, onboard, tab, pakistaniTimes, dlg } from './lib3.mjs';
const S = await open('2026-10-15T08:30:00+02:00'); const {page}=S;
await onboard(page); await pakistaniTimes(page);
await page.locator('[data-testid=slot-breakfast] .btn-add').click(); await page.waitForTimeout(400);
let nullSeen=false;
for (const q of ['chai','naan','tasting','leftover','bacha hua','thora sa','aadhi roti','dairh','chicken salan','chawal','samosay']) {
  await dlg(page).locator('input').first().fill(''); await dlg(page).locator('input').first().fill(q); await page.waitForTimeout(500);
  const t=await dlg(page).innerText();
  if (/null|undefined/.test(t)) nullSeen=true;
  const rows = [...t.split('Halal only')[1].split('\n')].filter(l=>l.trim()&&!/^(estimate|Home-made|Restaurant|Dhaba|Street stall)$/.test(l)&&!/[؀-ۿ]/.test(l)&&!/kcal/.test(l));
  console.log('== '+q+': '+rows.slice(0,8).join(' / '));
  await shot(page,'80-search-'+q.replace(/\W+/g,'-'));
}
console.log('null/undefined text seen:', nullSeen);
await S.browser.close();
