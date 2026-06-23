// Travelpayouts publishes a free, no-token reference dump of every IATA
// city/airport code it knows (name, country, coordinates) — this resolves
// the codes returned by /v1/city-directions (genuinely any destination it
// has fare data for) into something display-able, without us having to
// hand-curate metadata for an open-ended set of cities.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163

const CITIES_URL = 'https://api.travelpayouts.com/data/en/cities.json';

export interface TpCity {
  code: string;
  name: string;
  country_code: string;
  coordinates?: { lat: number; lon: number };
}

let indexPromise: Promise<Map<string, TpCity>> | null = null;

async function loadIndex(): Promise<Map<string, TpCity>> {
  try {
    const res = await fetch(CITIES_URL);
    if (!res.ok) return new Map();
    const data = (await res.json()) as TpCity[];
    const map = new Map<string, TpCity>();
    for (const c of data) map.set(c.code.toUpperCase(), c);
    return map;
  } catch {
    return new Map();
  }
}

/** Resolves an IATA city/airport code to its name/country/coordinates.
 * Cached in memory for the life of the server process — ~2MB, fetched once. */
export async function resolveCity(code: string): Promise<TpCity | undefined> {
  if (!indexPromise) indexPromise = loadIndex();
  const map = await indexPromise;
  return map.get(code.toUpperCase());
}
