import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-18T19:30:00+02:00'}); const p = run.page;
await L.skipOnboarding(run);
await p.goto(L.URL+'#/prep'); await p.waitForTimeout(400);
await p.getByTestId('new-recipe').click(); await p.getByTestId('add-ingredient').click(); await p.waitForTimeout(400);
const sh=p.locator('[data-testid=ingredient-sheet]');
for (const q of ['250 g lentils','250 g dry brown lentils','lentils','lentejas crudas','1 carrot','carrots','potatoes','2 potatoes','chorizo','150 g beef sausage','halal sausage']) {
  await p.getByTestId('ingredient-search').fill(q); await p.waitForTimeout(300);
  const t = await sh.locator('[data-testid=ingredient-row]').evaluateAll(els=>els.slice(0,5).map(e=>e.innerText.replace(/\n+/g,' / ')));
  console.log('==',q,'\n  '+t.join('\n  ')); 
  const b = await sh.locator('[data-testid=ingredient-blocked]').innerText({timeout:100}).catch(()=>null); if(b) console.log('  BLOCKED:',b);
}
await run.browser.close();
