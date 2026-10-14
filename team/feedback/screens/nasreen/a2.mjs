import { open, shot, txt, onboard, openAdd, search } from './common.mjs';
const S = await open('2026-10-14T08:30:00+02:00');
const { page } = S;
await onboard(page); await openAdd(page);
const top = async n => page.locator('dialog[data-testid="add-sheet"] .food-name').evaluateAll((els,n)=>els.slice(0,n).map(e=>e.textContent.trim()), n);
const qs = ['roti','chapati','phulka','Roti',' roti ','tandoori roti','naan','dal','daal','dhal','دال','daal mash','anda','anday','egg','chawal','chaawal','rice','chai','doodh patti','samosay','pakoray','karhai','kela','seb','khajoor','lentejas','tortilla','chaye','saalan','chapatti','nan','omlet','dahee','murgh salan'];
for (const q of qs) { await search(page,q); console.log(JSON.stringify(q), '=>', (await top(4)).join(' || ')); }
await S.browser.close();
