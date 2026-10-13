#!/usr/bin/env python3
"""CoFID 2021 (McCance and Widdowson's Composition of Foods Integrated Dataset, Public Health England,
Open Government Licence) proximates lookup.
  python3 -I research/javier/cofid.py <words...>   -> code | name | kcal P CHO F NSP AOACfib | description
CoFID 'Carbohydrate' is available carbohydrate (monosaccharide equivalents); fibre reported as NSP and AOAC.
Reads research/cache/cofid/cofid2021.xlsx (downloaded 2026-10-13 from gov.uk; not committed).
Owner: Javier Morales (Nutrition Lab)."""
import sys, os, pathlib, openpyxl
root = pathlib.Path(__file__).resolve().parents[2]
tsv = root / 'research/cache/cofid/proximates.tsv'
if not tsv.exists():
    wb = openpyxl.load_workbook(root / 'research/cache/cofid/cofid2021.xlsx', read_only=True)
    ws = wb['1.3 Proximates']
    with open(tsv, 'w') as out:
        for i, r in enumerate(ws.iter_rows(values_only=True)):
            if i < 3: continue
            code, name, desc = r[0], r[1], r[2]
            vals = dict(water=r[7], prot=r[9], fat=r[10], cho=r[11], kcal=r[12], sug=r[16], nsp=r[24], aoac=r[25], satfod=r[27])
            out.write('\t'.join(str(x) for x in [code, name, vals['kcal'], vals['prot'], vals['cho'], vals['fat'], vals['nsp'], vals['aoac'], vals['sug'], vals['satfod'], vals['water'], desc]) + '\n')
terms = [t.lower() for t in sys.argv[1:]]
for line in open(tsv):
    f = line.rstrip('\n').split('\t')
    if all(t in f[1].lower() for t in terms):
        print(f"{f[0]} | {f[1]} | kcal {f[2]} P {f[3]} CHO {f[4]} F {f[5]} NSP {f[6]} AOAC {f[7]} sug {f[8]} sat {f[9]} water {f[10]} | {f[11][:80]}")
