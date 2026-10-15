import { open, shot, txt, onboard, tab, pakistaniTimes, dlg } from './lib3.mjs';
const S = await open('2026-10-15T20:30:00+02:00'); const {page}=S;
let n=0; const A=(m)=>{n++; console.log('action',n,m)};
await onboard(page); await pakistaniTimes(page);
await page.locator('[data-testid=slot-dinner] .btn-add').click(); A('Add Dinner'); await page.waitForTimeout(400);
await page.keyboard.type('daal'); A('type daal'); await page.waitForTimeout(500);
await dlg(page).locator('.food-name',{hasText:'Masoor daal (home-made)'}).first().click(); A('tap daal'); await page.waitForTimeout(400);
await shot(page,'81-daal-picker');
console.log((await dlg(page).innerText()).slice(0,600));
await page.locator('[data-testid=taste-chip]').click(); A('Thora sa'); await page.waitForTimeout(300);
await shot(page,'82-thora-sa');
console.log((await dlg(page).innerText()).split('Quantity')[1]);
await page.locator('[data-testid=portion-picker] button[type=submit]').click(); A('Add'); await page.waitForTimeout(400);
await shot(page,'83-after-thora-sa');
// quick add
await dlg(page).getByText('Quick add').click(); A('Quick add'); await page.waitForTimeout(400);
await shot(page,'84-quick-add');
console.log('=== QUICK\n'+(await dlg(page).innerText()));
await S.browser.close();
