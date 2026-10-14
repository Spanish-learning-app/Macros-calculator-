import * as L from './lib.mjs';
const run = await L.launch(); const p = run.page;
await L.onboardP1(run);
await L.openSlot(run,'Nashta');
const box = L.sheet(run).locator('input.search-input');
const expect = {roti:/Roti \/ chapati/, chapati:/Roti \/ chapati/, phulka:/Roti \/ chapati/, Roti:/Roti \/ chapati/, ' roti ':/Roti \/ chapati/, 'tandoori roti':/^Tandoori/, naan:/^Naan/};
for (const [q,re] of Object.entries(expect)) {
  await box.fill('');
  await p.waitForTimeout(300);
  await box.pressSequentially(q,{delay:40});
  const t=Date.now();
  let ms=null;
  while(Date.now()-t<3000){
    const first = (await L.rows(run).first().innerText().catch(()=>''));
    if(re.test(first)){ms=Date.now()-t;break;}
    await p.waitForTimeout(10);
  }
  const tx = await L.rowTexts(run,3);
  console.log(JSON.stringify(q),'first-row-correct after',ms,'ms; top3:',tx.map(s=>s.split(' | ')[0]).join(' / '));
}
await box.fill('kela'); await p.waitForTimeout(400); await L.shot(run,'a3-kela');
await box.fill('daal'); await p.waitForTimeout(400); await L.shot(run,'a3-daal');
console.log('searchbutton?', await L.sheet(run).getByRole('button',{name:/search/i}).count());
await run.browser.close();
