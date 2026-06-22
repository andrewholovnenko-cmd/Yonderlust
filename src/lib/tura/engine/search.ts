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
function bestForDestination(req: SearchRequest, destCode: string, starts: string[]): TripOption | null {
  const { transport, hotels } = getProviders();
  const nights = tripNights(req.durationDays);
  const rooms = Math.max(1, Math.ceil(req.groupSize / 2));
  const dest = DESTINATIONS.find((d) => d.code === destCode)!;

  let best: TripOption | null = null;

  for (const start of starts) {
    const end = addDays(start, nights);

    const outbound = cheapestTransport(req.origin, destCode, start, transport, 'out');
    const inbound = cheapestTransport(req.origin, destCode, end, transport, 'back');
    if (!outbound || !inbound) continue;

    const dayTrip = nights === 0;
    const hotelList = dayTrip ? [] : hotels.search(destCode, start, nights);
    const hotel = dayTrip ? null : pickOptimizedHotel(hotelList);
    if (!dayTrip && !hotel) continue;

    const transportTotal = (outbound.pricePerPerson + inbound.pricePerPerson) * req.groupSize;
    const hotelTotal = hotel ? hotel.pricePerNight * rooms * nights : 0;
    const total = transportTotal + hotelTotal;

    const directOut = directTransport(req.origin, destCode, start, transport, 'out') ?? outbound;
    const directIn = directTransport(req.origin, destCode, end, transport, 'back') ?? inbound;
    const naiveHotel = dayTrip ? null : pickNaiveHotel(hotelList) ?? hotel;
    const naiveTotal =
      (directOut.pricePerPerson + directIn.pricePerPerson) * req.groupSize +
      (naiveHotel ? naiveHotel.pricePerNight * rooms * nights : 0);

    const option: TripOption = {
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

    if (best === null || option.total < best.total) best = option;
  }

  return best;
}

/** Main entry point: request -> ranked "where to go" options. */
export function search(req: SearchRequest): SearchResponse {
  const origin = req.origin.toUpperCase();
  const starts = startDates(req);

  const candidates = DESTINATIONS.filter(
    (d) => d.code !== origin && (req.vibe === 'any' || d.vibes.includes(req.vibe)),
  );

  const all: TripOption[] = [];
  for (const dest of candidates) {
    const best = bestForDestination({ ...req, origin }, dest.code, starts);
    if (best) all.push(best);
  }

  all.sort((a, b) => a.total - b.total);

  const within = all.filter((o) => o.total <= req.budget);
  const ranked = (within.length ? within : all).slice(0, MAX_RESULTS);

  return {
    request: { ...req, origin },
    options: ranked,
    generatedAt: new Date().toISOString(),
  };
}
