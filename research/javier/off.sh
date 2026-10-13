#!/usr/bin/env bash
# Open Food Facts lookups (raw JSON cached in research/cache/off/, not committed).
#   research/javier/off.sh search "<terms>" [country]   -> list code | brand | name | kcal P C F fib per 100 g | serving
#   research/javier/off.sh get <barcode>                 -> full nutriments for one product
# Owner: Javier Morales (Nutrition Lab).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
C="$ROOT/research/cache/off"; mkdir -p "$C"
UA="Katori-NutritionLab/0.1 (personal research)"
F="code,product_name,brands,nutriments,serving_size,quantity,countries_tags,nutrition_data_per,last_modified_t,ingredients_text,ingredients_text_en"
if [ "$1" = search ]; then
  q="$2"; country="${3:-}"; slug=$(echo "$q $country" | tr -c 'a-zA-Z0-9' '_')
  url="https://world.openfoodfacts.org/cgi/search.pl?search_terms=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$q")&search_simple=1&action=process&json=1&page_size=40&fields=$F"
  [ -n "$country" ] && url="$url&tagtype_0=countries&tag_contains_0=contains&tag_0=$country"
  for i in 1 2 3 4; do curl -sS -m 60 -A "$UA" "$url" -o "$C/s_$slug.json" || true; head -c 1 "$C/s_$slug.json" | grep -q '{' && break; sleep 5; done
  python3 -I - "$C/s_$slug.json" <<'PY'
import json,sys
d=json.load(open(sys.argv[1]))
print('count',d.get('count'))
for p in d.get('products',[]):
  n=p.get('nutriments',{})
  g=lambda k:n.get(k+'_100g')
  print(p.get('code'),'|',p.get('brands'),'|',p.get('product_name'),'|',g('energy-kcal'),g('proteins'),g('carbohydrates'),g('fat'),g('fiber'),'|',p.get('serving_size'),'|',','.join(p.get('countries_tags',[]))[:60])
PY
elif [ "$1" = get ]; then
  for i in 1 2 3 4; do curl -sS -m 60 -A "$UA" "https://world.openfoodfacts.org/api/v2/product/$2.json?fields=$F" -o "$C/p_$2.json" || true; head -c 1 "$C/p_$2.json" | grep -q '{' && break; sleep 5; done
  python3 -I - "$C/p_$2.json" <<'PY'
import json,sys,datetime
d=json.load(open(sys.argv[1])); p=d.get('product',{})
n=p.get('nutriments',{})
print('code',p.get('code'),'| brand',p.get('brands'),'| name',p.get('product_name'),'| qty',p.get('quantity'),'| serving',p.get('serving_size'),'| per',p.get('nutrition_data_per'))
print('last_modified', datetime.datetime.fromtimestamp(p.get("last_modified_t",0), datetime.UTC).date() if p.get('last_modified_t') else None)
print('countries', p.get('countries_tags'))
print({k:v for k,v in n.items() if k.endswith('_100g') or k.endswith('_serving')})
print('ingredients:', (p.get('ingredients_text_en') or p.get('ingredients_text') or '')[:400])
PY
fi
