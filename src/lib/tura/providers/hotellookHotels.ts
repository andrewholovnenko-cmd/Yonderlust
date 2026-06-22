import { cityName } from '@/lib/tura/providers/cities';
import type { HotelProvider } from '@/lib/tura/providers/hotels';
import type { HotelOption } from '@/lib/tura/types';

// ---------------------------------------------------------------------------
// Real hotel prices via Hotellook (part of the Travelpayouts product
// family, same account/token as travelpayoutsTransport.ts).
// Docs: https://support.travelpayouts.com/hc/en-us/articles/360010623840
// 1. lookup.json resolves a city name -> Hotellook's internal locationId.
// 2. cache.json returns the cheapest hotels Hotellook has cached for that
//    location/date range (aggregated cache, same trade-off as the flight
//    price API: real prices, not a live booking-engine query).
// Field names below are best-effort from current docs — if Hotellook
// changes its response shape, this fails closed (returns []) rather than
// throwing, so a destination just drops out of search results instead of
// breaking the whole request.
// ---------------------------------------------------------------------------

const HOTELLOOK_BASE = 'https://engine.hotellook.com/api/v2';

interface LookupResponse {
  results?: { locations?: { id: string; name: string }[] };
}

interface CacheHotel {
  hotelName?: string;
  stars?: number;
  priceFrom?: number;
  priceAvg?: number;
  rating?: number;
}

const locationIdCache = new Map<string, Promise<string | null>>();

async function locationId(city: string, token: string): Promise<string | null> {
  const cached = locationIdCache.get(city);
  if (cached) return cached;

  const promise = (async (): Promise<string | null> => {
    try {
      const url = `${HOTELLOOK_BASE}/lookup.json?${new URLSearchParams({
        query: city,
        lang: 'en',
        lookFor: 'city',
        limit: '1',
        token,
      })}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as LookupResponse;
      return data.results?.locations?.[0]?.id ?? null;
    } catch {
      return null;
    }
  })();

  locationIdCache.set(city, promise);
  return promise;
}

export const hotellookHotels: HotelProvider = {
  async search(destCode, checkIn, nights): Promise<HotelOption[]> {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token || nights <= 0) return [];

    const checkOut = new Date(checkIn + 'T00:00:00Z');
    checkOut.setUTCDate(checkOut.getUTCDate() + nights);

    const city = cityName(destCode);
    const id = await locationId(city, token);
    if (!id) return [];

    try {
      const url = `${HOTELLOOK_BASE}/cache.json?${new URLSearchParams({
        location: id,
        checkIn,
        checkOut: checkOut.toISOString().slice(0, 10),
        currency: 'eur',
        limit: '10',
        token,
      })}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as CacheHotel[];
      if (!Array.isArray(data)) return [];

      return data
        .filter((h) => typeof h.priceFrom === 'number' || typeof h.priceAvg === 'number')
        .map(
          (h): HotelOption => ({
            name: h.hotelName ?? `Hotel in ${city}`,
            pricePerNight: Math.round((h.priceFrom ?? h.priceAvg)!),
            stars: h.stars ?? 3,
            rating: h.rating ?? 0,
          }),
        );
    } catch {
      return [];
    }
  },
};
