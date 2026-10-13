#!/usr/bin/env python3
"""Dump CoFID 2021 proximates (sheet 1.3) to JSON for the Lab's lookups.

    python3 -I research/zainab/cofid-extract.py            # writes research/cache/cofid/proximates.json
    node research/zainab/cofid.mjs search samosa           # search the dump

CoFID reports carbohydrate as monosaccharide equivalents. Katori stores available carbohydrate by
weight, so cofid.mjs converts: starch/1.10 + glucose + fructose + galactose
+ (sucrose + maltose + lactose)/1.05 + oligosaccharide/1.10 when the fractions are given; otherwise
CHO/1.05 (sugars-dominant) or CHO/1.08 (mixed) — flagged in the output.
Fibre: AOAC where given, else NSP (Englyst), flagged.
"""
import json, os, sys
import openpyxl
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'cache', 'cofid')
wb = openpyxl.load_workbook(os.path.join(root, 'cofid2021.xlsx'), read_only=True)
ws = wb['1.3 Proximates']
rows = list(ws.iter_rows(values_only=True))
codes = rows[1]
out = []
for r in rows[3:]:
    if not r[0]:
        continue
    d = {'code': r[0], 'name': r[1], 'desc': r[2], 'group': r[3], 'ref': r[5]}
    for i, c in enumerate(codes):
        if c and i >= 7:
            d[c] = r[i]
    out.append(d)
sat = wb['1.8 (SFA per 100gFood)']
print(len(out), file=sys.stderr)
json.dump(out, open(os.path.join(root, 'proximates.json'), 'w'))
