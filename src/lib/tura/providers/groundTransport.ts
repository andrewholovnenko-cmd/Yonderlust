import { ORIGIN_HUBS, type GroundHub } from '@/lib/tura/data/destinations';
import { cityName } from '@/lib/tura/providers/cities';
import type { TransportLeg } from '@/lib/tura/types';

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

/**
 * Bus/train leg between a home city and one of its known lowcost-flight
 * hubs. There's no free public API for European bus/train fares, so this
 * stays a hand-curated graph (src/lib/tura/data/destinations.ts) of real,
 * plausible route/price/duration estimates — not random-generated.
 */
export async function searchGround(
  fromCode: string,
  toCode: string,
  date: string,
): Promise<TransportLeg | null> {
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
}
