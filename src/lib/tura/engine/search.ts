import type { SearchRequest, SearchResponse, TripOption, HotelOption } from '@/lib/tura/types';
import { DESTINATIONS } from '@/lib/tura/data/destinations';
import { getProviders } from '@/lib/tura/providers';
import { cheapestTransport, directTransport } from '@/lib/tura/engine/combine';
import { computeSavings } from '@/lib/tura/engine/savings';

const MAX_RESULTS = 8;
const DATE_STEP_DAYS = 3;
const MAX_STARTS = 12;
const MIN_GOOD_RATING = 7.5;

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function tripNights(durationDays: number): number {
  return Math.max(0, Math.round(durationDays) - 1);
}

/** Possible start dates inside the windows for the given duration. */
function startDates(req: SearchRequest): string[] {
  const nights = tripNights(req.durationDays);
  const starts: string[] = [];
  for (const w of req.dateWindows) {
    let cur = w.from;
    while (addDays(cur, nights) <= w.to && starts.length < MAX_STARTS) {
      starts.push(cur);
      cur = addDays(cur, DATE_STEP_DAYS);
    }
  }
  if (starts.length === 0 && req.dateWindows[0]) starts.push(req.dateWindows[0].from);
  return starts;
}

function pickOptimizedHotel(hotels: HotelOption[]): HotelOption | null {
  const good = hotels.filter((h) => h.rating >= MIN_GOOD_RATING);
  const pool = good.length ? good : hotels;
  return pool.reduce<HotelOption | null>(
    (best, h) => (best === null || h.pricePerNight < best.pricePerNight ? h : best),
    null,
  );
}

/** The "typical" hotel a person would pick without optimizing (3*, else mid-range). */
function pickNaiveHotel(hotels: HotelOption[]): HotelOption | null {
  if (hotels.length === 0) return null;
  return hotels.find((h) => h.stars === 3) ?? hotels[Math.min(2, hotels.length - 1)];
}

/** Best (cheapest) trip to a specific destination across all candidate dates. */
async function bestForDestination(
  req: SearchRequest,
  destCode: string,
  starts: string[],
): Promise<TripOption | null> {
  const { transport, hotels } = getProviders();
  const nights = tripNights(req.durationDays);
  const rooms = Math.max(1, Math.ceil(req.groupSize / 2));
  const dest = DESTINATIONS.find((d) => d.code === destCode)!;
  const dayTrip = nights === 0;

  const perStart = await Promise.all(
    starts.map(async (start): Promise<TripOption | null> => {
      const end = addDays(start, nights);

      const [outbound, inbound] = await Promise.all([
        cheapestTransport(req.origin, destCode, start, transport, 'out'),
        cheapestTransport(req.origin, destCode, end, transport, 'back'),
      ]);
      if (!outbound || !inbound) return null;

      const hotelList = dayTrip ? [] : await hotels.search(destCode, start, nights);
      const hotel = dayTrip ? null : pickOptimizedHotel(hotelList);
      if (!dayTrip && !hotel) return null;

      const transportTotal = (outbound.pricePerPerson + inbound.pricePerPerson) * req.groupSize;
      const hotelTotal = hotel ? hotel.pricePerNight * rooms * nights : 0;
      const total = transportTotal + hotelTotal;

      const [directOut, directIn] = await Promise.all([
        directTransport(req.origin, destCode, start, transport, 'out'),
        directTransport(req.origin, destCode, end, transport, 'back'),
      ]);
      const naiveHotel = dayTrip ? null : pickNaiveHotel(hotelList) ?? hotel;
      const naiveTotal =
        ((directOut ?? outbound).pricePerPerson + (directIn ?? inbound).pricePerPerson) *
          req.groupSize +
        (naiveHotel ? naiveHotel.pricePerNight * rooms * nights : 0);

      return {
        destination: dest,
        startDate: start,
        endDate: end,
        nights,
        groupSize: req.groupSize,
        rooms: dayTrip ? 0 : rooms,
        outbound,
        inbound,
        hotel,
        transportTotal,
        hotelTotal,
        total,
        perPerson: Math.round(total / req.groupSize),
        savings: computeSavings(naiveTotal, total),
      };
    }),
  );

  return perStart.reduce<TripOption | null>(
    (best, o) => (o && (best === null || o.total < best.total) ? o : best),
    null,
  );
}

/** Main entry point: request -> ranked "where to go" options. */
export async function search(req: SearchRequest): Promise<SearchResponse> {
  const origin = req.origin.toUpperCase();
  const starts = startDates(req);

  const candidates = DESTINATIONS.filter(
    (d) => d.code !== origin && (req.vibe === 'any' || d.vibes.includes(req.vibe)),
  );

  const results = await Promise.all(
    candidates.map((dest) => bestForDestination({ ...req, origin }, dest.code, starts)),
  );
  const all = results.filter((o): o is TripOption => o !== null);

  all.sort((a, b) => a.total - b.total);

  const within = all.filter((o) => o.total <= req.budget);
  const ranked = (within.length ? within : all).slice(0, MAX_RESULTS);

  return {
    request: { ...req, origin },
    options: ranked,
    generatedAt: new Date().toISOString(),
  };
}
