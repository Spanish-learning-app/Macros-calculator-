import * as L from './lib.mjs';
const run = await L.launch(); const p = run.page;
await L.skipOnboarding(run);
await L.openSlot(run,'Nashta');
for (const q of ['omelette','rusk','daal mash','salad','dahi','seb','whey','kela','chicken salan','aloo gobi','samosa','khajoor','rooh afza','cold drink','dhaba chai','kulfi','raita','naan','roghni','doodh','fruit chaat','pakora','paratha','fried egg','ubla anda','olive oil','skyr','manzana','plátano','galletas maria','marie']) {
  await L.search(run,q);
  console.log('##',q);
  for (const t of await L.rowTexts(run,3)) console.log('   ',t.split(' | ').filter(x=>!/^[؀-ۿ ,،]+$/.test(x)).join(' / ').slice(0,140));
}
await run.browser.close();
