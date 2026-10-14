import * as L from './lib.mjs';
const run = await L.launch();
const p = run.page;
await L.onboardP1(run);
await L.openSlot(run, 'Nashta');
const qs = ['roti','chapati','phulka','Roti',' roti ','tandoori roti','naan','dal','daal','dhal','دال','daal mash','anda','anday','egg','chawal','chaawal','rice','chai','doodh patti','samosay','pakoray','karhai','karahi','kela','seb','khajoor','lentejas','tortilla','truita','chaye','chapatti','croissant','pa amb tomàquet','pan con tomate','ensaïmada','ensaimada','napolitana','tikka bowl','cafe amb llet','tallat','suc de taronja','entrepà de truita','torrada amb oli'];
for (const q of qs) {
  await L.search(run, q);
  console.log('\n## "'+q+'"');
  for (const t of await L.rowTexts(run, 5)) console.log('  ', t.slice(0,150));
  const hn = p.locator('[data-testid=hidden-note]');
  if (await hn.count()) console.log('   HIDDEN NOTE:', (await hn.innerText()).replace(/\n+/g,' | '));
  if (!(await L.rows(run).count())) console.log('   NO ROWS:', (await L.sheet(run).locator('.sheet-results').innerText()).replace(/\n+/g,' | ').slice(0,200));
}
console.log(run.errors);
await run.browser.close();
