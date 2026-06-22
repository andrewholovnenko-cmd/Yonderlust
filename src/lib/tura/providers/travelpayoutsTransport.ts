import { cityName } from '@/lib/tura/providers/cities';
import { searchGround } from '@/lib/tura/providers/groundTransport';
import type { TransportProvider } from '@/lib/tura/providers/transport';
import type { TransportLeg } from '@/lib/tura/types';

// ---------------------------------------------------------------------------
// Real flight prices via the Travelpayouts Data API (api.travelpayouts.com).
// Sign up at https://www.travelpayouts.com/ -> Tools -> Data API to get a
// free token instantly (no approval/traffic requirement, unlike Kiwi).
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
//
// /v1/prices/cheap returns the cheapest *cached* fares Travelpayouts has
// seen recently for a route (aggregated across travelers' searches), not a
// live GDS query — so results are real market prices, just not always for
// the exact requested date. That's a deliberate, acceptable trade-off here:
// the engine compares routes against each other, and this still reflects
// real economics (so it stops inventing nonsense detours, unlike the old
// random-price mock).
// ---------------------------------------------------------------------------

const TRAVELPAYOUTS_BASE = 'https://api.travelpayouts.com';

interface CheapPriceEntry {
  price: number;
  airline: string;
  flight_number?: number;
  departure_at?: string;
}

interface CheapPriceResponse {
  success: boolean;
  data?: Record<string, Record<string, CheapPriceEntry>>;
}

// Airport coordinates for the fixed set of codes this app ever searches
// (destinations + ground hubs + origin cities) — used only to estimate
// flight duration for display, since the price API doesn't return one.
const AIRPORT_COORDS: Record<string, [lat: number, lon: number]> = {
  BCN: [41.2974, 2.0833],
  LIS: [38.7813, -9.1359],
  ATH: [37.9364, 23.9445],
  FCO: [41.8003, 12.2389],
  PMI: [39.5517, 2.7388],
  SPU: [43.5389, 16.2981],
  BUD: [47.4298, 19.2611],
  PRG: [50.1008, 14.26],
  NAP: [40.8847, 14.2908],
  VLC: [39.4893, -0.4816],
  OPO: [41.2481, -8.6814],
  CTA: [37.4668, 15.0664],
  KRK: [50.0777, 19.7848],
  TIA: [41.4147, 19.7206],
  SOF: [42.6952, 23.4064],
  TGD: [42.3594, 19.2519],
  BER: [52.3667, 13.5033],
  WAW: [52.1657, 20.9671],
  VIE: [48.1103, 16.5697],
  MUC: [48.3538, 11.7861],
  BTS: [48.1702, 17.2127],
  WRO: [51.1027, 16.8858],
  KTW: [50.4743, 19.08],
  POZ: [52.4211, 16.8264],
  BGY: [45.6739, 9.7042],
};

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Great-circle distance / ~750km/h cruise speed + 30min taxi/climb/descent. */
function estimateFlightMinutes(fromCode: string, toCode: string): number {
  const a = AIRPORT_COORDS[fromCode.toUpperCase()];
  const b = AIRPORT_COORDS[toCode.toUpperCase()];
  if (!a || !b) return 120;
  const km = haversineKm(a, b);
  return Math.round(30 + (km / 750) * 60);
}

const AIRLINE_NAMES: Record<string, string> = {
  FR: 'Ryanair',
  W6: 'Wizz Air',
  U2: 'easyJet',
  VY: 'Vueling',
  LH: 'Lufthansa',
  OS: 'Austrian',
  LO: 'LOT',
  AZ: 'ITA Airways',
  A3: 'Aegean',
  TP: 'TAP Portugal',
  WZZ: 'Wizz Air',
};

function airlineName(code: string): string {
  return AIRLINE_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

function cheapestEntry(byStops: Record<string, CheapPriceEntry>): CheapPriceEntry | null {
  const entries = Object.values(byStops);
  if (entries.length === 0) return null;
  return entries.reduce((best, e) => (e.price < best.price ? e : best));
}

// Cache by route + month (Travelpayouts pricing isn't exact-date anyway) so
// the engine's per-start-date loop doesn't re-fetch the same route N times.
const cache = new Map<string, Promise<TransportLeg | null>>();

async function fetchCheapestAir(
  fromCode: string,
  toCode: string,
  date: string,
): Promise<TransportLeg | null> {
  const from = fromCode.toUpperCase();
  const to = toCode.toUpperCase();
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token || from === to) return null;

  const month = date.slice(0, 7);
  const key = `${from}>${to}@${month}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = (async (): Promise<TransportLeg | null> => {
    try {
      const url = `${TRAVELPAYOUTS_BASE}/v1/prices/cheap?${new URLSearchParams({
        origin: from,
        destination: to,
        currency: 'eur',
        depart_date: month,
        token,
      })}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as CheapPriceResponse;
      const byStops = data.data?.[to];
      const best = byStops ? cheapestEntry(byStops) : null;
      if (!best) return null;

      return {
        mode: 'air',
        fromCode: from,
        toCode: to,
        fromCity: cityName(from),
        toCity: cityName(to),
        pricePerPerson: Math.round(best.price),
        durationMin: estimateFlightMinutes(from, to),
        carrier: airlineName(best.airline),
        date,
      };
    } catch {
      return null;
    }
  })();

  cache.set(key, promise);
  return promise;
}

export const travelpayoutsTransport: TransportProvider = {
  searchAir: fetchCheapestAir,
  searchGround,
};
