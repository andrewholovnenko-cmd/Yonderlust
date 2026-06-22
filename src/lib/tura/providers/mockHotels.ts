import type { HotelOption } from '@/lib/tura/types';
import { cityName } from '@/lib/tura/providers/cities';
import type { HotelProvider } from '@/lib/tura/providers/hotels';

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Hotel templates, budget to mid-range. Price is per double room, per night.
const TEMPLATES = [
  { suffix: 'Hostel', stars: 1, ratingBase: 7.4, priceMul: 0.55 },
  { suffix: 'Guesthouse', stars: 2, ratingBase: 7.9, priceMul: 0.8 },
  { suffix: 'City Hotel', stars: 3, ratingBase: 8.3, priceMul: 1.0 },
  { suffix: 'Boutique', stars: 4, ratingBase: 8.8, priceMul: 1.5 },
];

export const mockHotels: HotelProvider = {
  search(destCode, checkIn, _nights) {
    const code = destCode.toUpperCase();
    const city = cityName(code);
    const cityFactor = 0.7 + hash01(`${code}-hotel`) * 1.2;
    const dateFactor = 0.9 + hash01(`${code}-${checkIn}`) * 0.3;
    const baseNight = 45 * cityFactor * dateFactor;

    return TEMPLATES.map((t, i) => {
      const jitter = 0.92 + hash01(`${code}-${i}-${checkIn}`) * 0.16;
      return {
        name: `${city} ${t.suffix}`,
        pricePerNight: Math.round(baseNight * t.priceMul * jitter),
        stars: t.stars,
        rating: Math.round((t.ratingBase + hash01(`${code}${i}r`) * 0.6) * 10) / 10,
      } satisfies HotelOption;
    });
  },
};
