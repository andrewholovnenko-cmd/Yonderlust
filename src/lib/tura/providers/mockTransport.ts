import { LOWCOST_BASES, ORIGIN_HUBS, type GroundHub } from '@/lib/tura/data/destinations';
import { cityName } from '@/lib/tura/providers/cities';
import type { TransportProvider } from '@/lib/tura/providers/transport';

// Deterministic pseudo-randomness: same input -> same price. Keeps results
// stable across requests (important for testing and user trust).
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const LEGACY = ['Lufthansa', 'LOT', 'ITA Airways', 'Austrian'];
const LOWCOST = ['Ryanair', 'Wizz Air', 'easyJet', 'Vueling'];

function airPrice(from: string, to: string, date: string): number {
  const route = hash01(`${from}>${to}`);
  const day = hash01(`${from}>${to}@${date}`);
  let base = 40 + route * 170;
  base *= 1 + day * 0.6;
  if (LOWCOST_BASES.has(from.toUpperCase())) base *= 0.55;
  return Math.round(base);
}

/** Finds a ground connection between two cities in the hub graph (either direction). */
function findGround(
  a: string,
  b: string,
): { hub: GroundHub; origin: string; reversed: boolean } | null {
  const A = a.toUpperCase();
  const B = b.toUpperCase();
  for (const [origin, hubs] of Object.entries(ORIGIN_HUBS)) {
    for (const hub of hubs) {
      if (origin === A && hub.code === B) return { hub, origin, reversed: false };
      if (origin === B && hub.code === A) return { hub, origin, reversed: true };
    }
  }
  return null;
}

export const mockTransport: TransportProvider = {
  searchAir(fromCode, toCode, date) {
    const from = fromCode.toUpperCase();
    const to = toCode.toUpperCase();
    if (from === to) return null;
    const price = airPrice(from, to, date);
    const route = hash01(`${from}>${to}`);
    const lowcost = LOWCOST_BASES.has(from);
    const pool = lowcost ? LOWCOST : LEGACY;
    return {
      mode: 'air',
      fromCode: from,
      toCode: to,
      fromCity: cityName(from),
      toCity: cityName(to),
      pricePerPerson: price,
      durationMin: Math.round(90 + route * 150),
      carrier: pool[Math.floor(hash01(`${from}${to}c`) * pool.length)],
      date,
    };
  },

  searchGround(fromCode, toCode, date) {
    const found = findGround(fromCode, toCode);
    if (!found) return null;
    const { hub } = found;
    const from = fromCode.toUpperCase();
    const to = toCode.toUpperCase();
    return {
      mode: hub.mode,
      fromCode: from,
      toCode: to,
      fromCity: cityName(from),
      toCity: cityName(to),
      pricePerPerson: hub.pricePerPerson,
      durationMin: hub.durationMin,
      carrier: hub.carrier,
      date,
    };
  },
};
