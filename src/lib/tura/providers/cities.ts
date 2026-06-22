import { DESTINATIONS, ORIGIN_HUBS } from '@/lib/tura/data/destinations';

// Code -> city name lookup, built from destinations, hubs, and a few common
// departure cities. Unknown codes fall back to the code itself.
const CITY_NAMES: Record<string, string> = {
  BER: 'Берлин',
  WAW: 'Варшава',
  VIE: 'Вена',
  MUC: 'Мюнхен',
};

for (const d of DESTINATIONS) CITY_NAMES[d.code] = d.city;
for (const hubs of Object.values(ORIGIN_HUBS)) {
  for (const h of hubs) CITY_NAMES[h.code] = h.city;
}

export function cityName(code: string): string {
  return CITY_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}
