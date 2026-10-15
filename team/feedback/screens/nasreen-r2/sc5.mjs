import { open, shot, txt, onboard, tab, pakistaniTimes, dlg } from './lib3.mjs';
const S = await open('2026-10-15T13:30:00+02:00'); const {page}=S;
await onboard(page); await pakistaniTimes(page);
const search=async(q,tag)=>{ await page.locator('[data-testid=slot-lunch] .btn-add').click(); await page.waitForTimeout(400);
  await page.keyboard.type(q); await page.waitForTimeout(500); await shot(page,tag);
  console.log('== '+q+' ('+tag+')\n'+(await dlg(page).innerText()).split('Halal only')[1].slice(0,700));
  await dlg(page).getByRole('button',{name:'Done'}).click(); await page.waitForTimeout(300); };
await search('prawn','70-prawn-all-seafood');
await search('machli','71-machli-all-seafood');
// tap Check chip in Prep
await tab(page,'Prep');
const chk = page.locator('[data-testid=library-row]:has-text("Check")').first();
await chk.locator('button, [role=button], .chip').last().click().catch(e=>console.log('chip not tappable'));
await page.waitForTimeout(300); await shot(page,'72-check-chip-tapped');
console.log('dialogs',await page.locator('dialog[open]').count(), (await chk.innerText()).replace(/\n/g,' | '));
// change seafood
await tab(page,'Profile');
await page.locator('label:has-text("Fish only")').click(); await page.waitForTimeout(300);
await page.locator('label:has-text("Fish only")').scrollIntoViewIfNeeded(); await shot(page,'73-profile-fish-only');
await tab(page,'Day');
await search('prawn','74-prawn-fish-only');
await search('machli','75-machli-fish-only');
await tab(page,'Prep'); await shot(page,'76-prep-fish-only');
console.log('library rows', await page.locator('[data-testid=library-row]').count(), 'with Check', await page.locator('[data-testid=library-row]:has-text("Check")').count());
await S.browser.close();
