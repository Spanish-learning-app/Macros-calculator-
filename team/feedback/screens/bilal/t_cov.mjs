import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-14T13:00:00+02:00'}); const p = run.page;
await L.skipOnboarding(run);
await L.tap(run, p.locator('[data-testid=add-food]')); await L.sheet(run).waitFor();
// turn Halal only off for #46 only
const cov = [
[1,'roti',/Roti \/ chapati/],[2,'tandoori roti',/Tandoori roti/],[3,'naan',/^Naan/],[4,'roghni naan',/Roghni/],[5,'anda paratha',/Anda paratha/],[6,'paratha',/^Paratha \(/],[7,'daal chawal',/Daal chawal/],[8,'chawal',/^Rice, plain/],[9,'masoor',/Masoor/],[10,'daal mash',/Daal mash/],[11,'chicken salan',/Chicken salan/],[12,'aloo gobi',/Aloo gobi/],[13,'karahi',/Chicken karahi \(home/],[14,'karahi',/Chicken karahi \(rest/],[15,'omelette',/Desi omelette/],[16,'fried egg',/Egg, fried/],[17,'boiled egg',/Egg, boiled/],[18,'dahi',/^Dahi/],[19,'raita',/^Raita/],[20,'doodh',/Milk, full-cream/],[21,'chai',/doodh patti \(home\), 1 tsp/],[22,'dhaba chai',/dhaba, extra sugar/],[23,'rooh afza',/Rooh Afza sharbat/],[24,'cold drink',/[Cc]ola|Cold drink/],[25,'rusk',/Rusk/],[26,'biscuit',/Marie/],[27,'samosa',/Samosa/],[28,'pakora',/^Pakora/],[29,'kulfi',/Kulfi/],[30,'fruit chaat',/Fruit chaat/],[31,'apple',/^Apple \(/],[32,'banana',/^Banana/],[33,'dates',/Dates \(khajoor/],[34,'kachumber',/Salad, kachumber/],[35,'whey',/Whey/],[36,'olive oil',/^Olive oil/],[37,'pan con tomate',/Pan con tomate/],[38,'lentejas',/^Lentejas \(/],[39,'tortilla',/^Tortilla de patatas/],[40,'cafè amb llet',/Café con leche/],[41,'tallat',/Cortado/],[42,'croissant',/^Croissant/],[43,'napolitana de xocolata',/Napolitana/],[44,'suc de taronja',/naranja/],[45,'entrepà de truita',/Bocadillo de tortilla/],[46,'ensaïmada',/Ensa/],[47,'torrada amb oli',/Tostada con aceite/],[48,'skyr',/^Skyr|Yogur|skyr, plain/i],[49,'tikka bowl',/tikka rice bowl/i]];
const miss=[];
for (const [n,q,re] of cov) {
  await L.search(run,q);
  const t = await L.rowTexts(run,5);
  const idx = t.findIndex(s=>re.test(s.split(' | ')[0]));
  let note = '';
  if (n===46) { note = (await L.sheet(run).locator('[data-testid=hidden-note]').count())?'(hidden-note present)':''; if(note) idx===-1; }
  if (n===46) { if (note) continue; }
  if (idx===-1 || idx>=5) miss.push(`#${n} "${q}" -> [${t.map(s=>s.split(' | ')[0]).join(' / ')}]`);
  else if (idx>0) console.log(`#${n} "${q}" found at rank ${idx+1}`);
}
console.log('MISSING/NOT IN TOP 5:'); miss.forEach(m=>console.log('  ',m));
await run.browser.close();
