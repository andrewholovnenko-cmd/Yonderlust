import type { Destination } from '@/lib/tura/types';
import { DESTINATIONS } from '@/lib/tura/data/destinations';
import { resolveCity } from '@/lib/tura/data/citiesIndex';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Genuinely open-ended destination discovery: /v1/city-directions asks
// Travelpayouts for every destination it currently has a cheap cached fare
// for *from this exact origin* — not filtered down to a fixed candidate
// list. Newly-seen (non-curated) destinations get written to Supabase so
// the next search (any user, any origin) and the homepage globe see them
// too, instead of rediscovering the same handful every time.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
// ---------------------------------------------------------------------------

interface CityDirectionEntry {
  origin: string;
  destination: string;
  price: number;
}

interface CityDirectionsResponse {
  data?: Record<string, CityDirectionEntry>;
}

const CURATED_CODES = new Set(DESTINATIONS.map((d) => d.code));

// Cache by origin so the engine's per-vibe-call pattern doesn't re-hit the
// API for the same origin within one request lifecycle.
const cache = new Map<string, Promise<Destination[]>>();

function countryNameFromCode(countryCode: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode.toUpperCase()) ?? countryCode;
  } catch {
    return countryCode;
  }
}

export async function discoverDestinations(origin: string, budget: number): Promise<Destination[]> {
  const key = origin.toUpperCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = (async (): Promise<Destination[]> => {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) return [];

    try {
      const url = `https://api.travelpayouts.com/v1/city-directions?${new URLSearchParams({
        origin: key,
        currency: 'eur',
        token,
      })}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as CityDirectionsResponse;
      const entries = Object.values(data.data ?? {});

      const fresh: Destination[] = [];
      for (const entry of entries) {
        const code = entry.destination.toUpperCase();
        if (code === key || CURATED_CODES.has(code)) continue;
        // city-directions' price is the cheapest round trip Travelpayouts has
        // cached — a real (if imprecise) signal of whether this destination
        // is even worth fetching a full quote for under this budget.
        if (entry.price > budget) continue;
        const city = await resolveCity(code);
        if (!city?.coordinates) continue;
        fresh.push({ code, city: city.name, country: countryNameFromCode(city.country_code), vibes: ['city'] });
      }

      if (fresh.length) void persistDiscovered(fresh, key, entries);
      return fresh;
    } catch {
      return [];
    }
  })();

  cache.set(key, promise);
  return promise;
}

async function persistDiscovered(destinations: Destination[], origin: string, entries: CityDirectionEntry[]) {
  const admin = supabaseAdmin();
  if (!admin) return;

  const priceByCode = new Map(entries.map((e) => [e.destination.toUpperCase(), e.price]));
  const rows = await Promise.all(
    destinations.map(async (d) => {
      const city = await resolveCity(d.code);
      return {
        code: d.code,
        city: d.city,
        country: d.country,
        country_code: city?.country_code ?? null,
        lat: city?.coordinates?.lat ?? null,
        lon: city?.coordinates?.lon ?? null,
        cheapest_price: priceByCode.get(d.code) ?? null,
        cheapest_origin: origin,
        curated: false,
      };
    }),
  );

  try {
    await admin.from('discovered_destinations').upsert(rows, { onConflict: 'code' });
  } catch {
    // Best-effort cache: a failed write just means this destination isn't
    // remembered for next time — never blocks or fails the current search.
  }
}
