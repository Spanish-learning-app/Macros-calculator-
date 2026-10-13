#!/usr/bin/env bash
# BEDCA (Base de Datos Española de Composición de Alimentos, www.bedca.net) lookups via its public XML endpoint.
#   research/javier/bedca.sh search <spanish name fragment>   -> f_id | Spanish name | English name
#   research/javier/bedca.sh get <f_id>                        -> energy, protein, fat, carbohydrate, fibre, sugars, satfat, sodium per 100 g edible portion
# Raw XML responses cached in research/cache/bedca/ (not committed). Attribution: BEDCA, AESAN / Ministerio de Ciencia e Innovación.
# Owner: Javier Morales (Nutrition Lab).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; C="$ROOT/research/cache/bedca"; mkdir -p "$C"
URL="https://www.bedca.net/bdpub/procquery.php"
if [ "$1" = search ]; then
  q="$2"; slug=$(echo "$q" | tr -c 'a-zA-Z0-9' '_')
  body="<?xml version=\"1.0\" encoding=\"utf-8\"?><foodquery><type level=\"1\"/><selection><atribute name=\"f_id\"/><atribute name=\"f_ori_name\"/><atribute name=\"langual\"/><atribute name=\"f_eng_name\"/><atribute name=\"f_origen\"/><atribute name=\"edible_portion\"/></selection><condition><cond1><atribute1 name=\"f_ori_name\"/></cond1><relation type=\"LIKE\"/><cond3>$q</cond3></condition><condition><cond1><atribute1 name=\"f_origen\"/></cond1><relation type=\"EQUAL\"/><cond3>BEDCA</cond3></condition><order ordtype=\"ASC\"><atribute3 name=\"f_ori_name\"/></order></foodquery>"
  curl -sS -m 60 -X POST -H "Content-Type: text/xml" --data "$body" "$URL" -o "$C/s_$slug.xml"
  python3 -I - "$C/s_$slug.xml" <<'PY'
import sys,xml.etree.ElementTree as ET
t=ET.parse(sys.argv[1]).getroot()
for f in t.iter('food'):
  g=lambda k:(f.findtext(k) or '').strip()
  print(g('f_id'),'|',g('f_ori_name'),'|',g('f_eng_name'),'| edible',g('edible_portion'))
PY
elif [ "$1" = get ]; then
  id="$2"
  sel=""; for a in f_id f_ori_name f_eng_name sci_name langual foodexcode mainlevelcode codlevel1 namelevel1 codsublevel codlevel2 namelevel2 f_des_esp f_des_ing photo edible_portion f_origen c_id c_ori_name c_eng_name eur_name componentgroup_id glos_esp glos_ing cg_descripcion cg_description best_location v_unit moex stdv min max v_n u_id u_descripcion u_description value_type vt_descripcion vt_description mu_id mu_descripcion mu_description ref_id citation at_descripcion at_description pt_descripcion pt_description method_id mt_descripcion mt_description m_descripcion m_description m_nom_esp m_nom_ing mhd_descripcion mhd_description; do sel="$sel<atribute name=\"$a\"/>"; done
  body="<?xml version=\"1.0\" encoding=\"utf-8\"?><foodquery><type level=\"2\"/><selection>$sel</selection><condition><cond1><atribute1 name=\"f_id\"/></cond1><relation type=\"EQUAL\"/><cond3>$id</cond3></condition><condition><cond1><atribute1 name=\"publico\"/></cond1><relation type=\"EQUAL\"/><cond3>1</cond3></condition><order ordtype=\"ASC\"><atribute3 name=\"componentgroup_id\"/></order></foodquery>"
  curl -sS -m 60 -X POST -H "Content-Type: text/xml" --data "$body" "$URL" -o "$C/f_$id.xml"
  python3 -I - "$C/f_$id.xml" <<'PY'
import sys,xml.etree.ElementTree as ET
t=ET.parse(sys.argv[1]).getroot()
foods=list(t.iter('food'))
if not foods: print('no data'); sys.exit()
f=foods[0]
print('f_id',f.findtext('f_id'),'|',f.findtext('f_ori_name'),'|',f.findtext('f_eng_name'),'| edible portion',f.findtext('edible_portion'))
want={'energía, total','proteina, total','grasa, total (lipidos totales)','carbohidratos','fibra, dietetica total','azúcares, totales','ácidos grasos saturados totales','sodio','agua (humedad)','alcohol (etanol)'}
for c in f.iter('foodvalue'):
  n=(c.findtext('c_ori_name') or '').strip()
  if n.lower() in want:
    v=(c.findtext('best_location') or '').strip(); u=(c.findtext('v_unit') or '').strip()
    extra=f" (= {float(v)/4.184:.1f} kcal)" if u=='kJ' and v else ''
    print(f"  {n}: {v} {u}{extra}  [{(c.findtext('vt_descripcion') or '').strip()}; ref {(c.findtext('citation') or '').strip()[:70]}]")
PY
fi
