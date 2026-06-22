// ── tura adapter ──────────────────────────────────────────────────────────
// `tura` is a friend's separate Next.js project: a destination-picking
// search engine ("где дешевле" — direct flight vs bus-to-a-lowcost-hub
// combos), reachable through our same-origin proxy at /api/tura/search (see
// src/app/api/tura/search/route.ts). Its request/response shapes are
// completely different from ours (see lib/types.ts in that repo), so this
// file is the translation layer: only `discoverTrips`/`getSampleIdeas` are
// tura-backed (that's its actual value — picking *where*); everything else
// (destinations list, manual stays/activities/flights, trip detail) has no
// equivalent in tura yet and falls back to the existing mock content.
import type {
  CostBreakdown,
  DiscoverQuery,
  FlightSummary,
  Money,
  StaySummary,
  TripDetail,
  TripIdea,
  TripService,
  VibeId,
} from './types';
import { mockTripService } from './tripService';
import { mockLatency, nightsBetween } from '@/lib/utils';

// ── tura's own contract (mirrored from its lib/types.ts) ───────────────────

type TuraVibe = 'beach' | 'city' | 'history' | 'nature' | 'party' | 'any';

interface TuraDateWindow {
  from: string;
  to: string;
}

interface TuraSearchRequest {
  origin: string;
  dateWindows: TuraDateWindow[];
  durationDays: number;
  vibe: TuraVibe;
  budget: number;
  groupSize: number;
}

interface TuraDestination {
  code: string;
  city: string;
  country: string;
  vibes: TuraVibe[];
}

interface TuraTransportLeg {
  mode: 'air' | 'bus' | 'train';
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  pricePerPerson: number;
  durationMin: number;
  carrier: string;
  date: string;
}

interface TuraTransportOption {
  legs: TuraTransportLeg[];
  pricePerPerson: number;
  totalDurationMin: number;
  isMultimodal: boolean;
  label: string;
}

interface TuraHotelOption {
  name: string;
  pricePerNight: number;
  stars: number;
  rating: number; // 0..10
}

interface TuraTripOption {
  destination: TuraDestination;
  startDate: string;
  endDate: string;
  nights: number;
  groupSize: number;
  rooms: number;
  outbound: TuraTransportOption;
  inbound: TuraTransportOption;
  hotel: TuraHotelOption | null;
  transportTotal: number;
  hotelTotal: number;
  total: number;
  perPerson: number;
  savings: { naiveTotal: number; optimizedTotal: number; saved: number; percent: number };
}

interface TuraSearchResponse {
  request: TuraSearchRequest;
  options: TuraTripOption[];
  generatedAt: string;
}

// ── mapping helpers ─────────────────────────────────────────────────────────

const eur = (amount: number): Money => ({ amount: Math.round(amount), currency: 'EUR' });

const img = (seed: string, w = 1280, h = 960): string =>
  `https://picsum.photos/seed/tura-${seed}/${w}/${h}`;

/** Our taste taxonomy is finer-grained than tura's 5 vibes — best-effort map. */
const VIBE_TO_TURA: Record<VibeId, TuraVibe> = {
  beach: 'beach',
  relax: 'beach',
  culture: 'history',
  food: 'city',
  nature: 'nature',
  nightlife: 'party',
  romantic: 'city',
  adventure: 'nature',
  city: 'city',
  budget: 'any',
};

function pickTuraVibe(vibes: VibeId[]): TuraVibe {
  return vibes.length > 0 ? VIBE_TO_TURA[vibes[0]] : 'any';
}

/** English display names for tura's (Russian-language) destination list —
 * keeps copy consistent with the rest of this English-language app. Falls
 * back to tura's own strings for any code not in this short, fixed list. */
const TURA_DESTINATION_EN: Record<string, { city: string; country: string; region: string }> = {
  BCN: { city: 'Barcelona', country: 'Spain', region: 'Catalonia' },
  LIS: { city: 'Lisbon', country: 'Portugal', region: 'Atlantic coast' },
  ATH: { city: 'Athens', country: 'Greece', region: 'Attica' },
  FCO: { city: 'Rome', country: 'Italy', region: 'Lazio' },
  PMI: { city: 'Palma de Mallorca', country: 'Spain', region: 'Balearic Islands' },
  SPU: { city: 'Split', country: 'Croatia', region: 'Adriatic coast' },
  BUD: { city: 'Budapest', country: 'Hungary', region: 'Central Europe' },
  PRG: { city: 'Prague', country: 'Czechia', region: 'Central Europe' },
  NAP: { city: 'Naples', country: 'Italy', region: 'Campania' },
  VLC: { city: 'Valencia', country: 'Spain', region: 'Costa del Azahar' },
  OPO: { city: 'Porto', country: 'Portugal', region: 'Douro' },
  CTA: { city: 'Catania', country: 'Italy', region: 'Sicily' },
  KRK: { city: 'Krakow', country: 'Poland', region: 'Central Europe' },
  TIA: { city: 'Tirana', country: 'Albania', region: 'Adriatic coast' },
  SOF: { city: 'Sofia', country: 'Bulgaria', region: 'Balkans' },
  TGD: { city: 'Podgorica', country: 'Montenegro', region: 'Adriatic coast' },
};

/** Common European origin cities mapped to the airport-ish code tura expects.
 * Anything unrecognized falls back to the first 3 letters — tura's pricing is
 * a deterministic hash of the code either way, so it still produces a stable,
 * plausible result for an origin outside this list (just without the
 * bus-to-lowcost-hub multimodal trick, which only fires for known hubs). */
const ORIGIN_CODES: Record<string, string> = {
  vienna: 'VIE',
  wien: 'VIE',
  berlin: 'BER',
  warsaw: 'WAW',
  warszawa: 'WAW',
  munich: 'MUC',
  munchen: 'MUC',
  prague: 'PRG',
  praha: 'PRG',
  budapest: 'BUD',
};

function originCode(query: DiscoverQuery): string {
  if (query.originCode) return query.originCode.toUpperCase();
  const key = query.origin.trim().toLowerCase();
  return ORIGIN_CODES[key] ?? query.origin.trim().slice(0, 3).toUpperCase().padEnd(3, 'X');
}

function turaVibeToOurs(vibe: TuraVibe): VibeId[] {
  const reverse: Partial<Record<TuraVibe, VibeId>> = {
    beach: 'beach',
    city: 'city',
    history: 'culture',
    nature: 'nature',
    party: 'nightlife',
  };
  const mapped = reverse[vibe];
  return mapped ? [mapped] : [];
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toSearchRequest(query: DiscoverQuery): TuraSearchRequest {
  const nights = Math.max(1, nightsBetween(query.dates.start, query.dates.end));
  // tura derives nights as durationDays - 1, so this is the inverse.
  const durationDays = Math.min(30, nights + 1);
  // tura needs a search window at least as wide as the trip itself to find
  // any start date inside it. Fixed dates get exactly that one window
  // (a single possible start); flexible dates get a few extra weeks of
  // room so tura's date-shifting savings logic has something to work with.
  const window = query.datesFlexible
    ? { from: query.dates.start, to: addDays(query.dates.start, Math.max(nights + 28, 35)) }
    : { from: query.dates.start, to: query.dates.end };
  return {
    origin: originCode(query),
    dateWindows: [window],
    durationDays,
    vibe: pickTuraVibe(query.vibes),
    budget: Math.max(1, Math.round(query.budget.amount)),
    groupSize: Math.max(1, Math.round(query.travelers)),
  };
}

function destinationEn(d: TuraDestination) {
  const known = TURA_DESTINATION_EN[d.code];
  return {
    id: d.code.toLowerCase(),
    city: known?.city ?? d.city,
    country: known?.country ?? d.country,
    region: known?.region ?? d.country,
    blurb: `A ${d.vibes.join(', ')} pick from tura's route-finding engine.`,
    image: img(d.code.toLowerCase()),
    tags: turaVibeToOurs(d.vibes[0] ?? 'any'),
    airportCode: d.code,
  };
}

/** Multimodal legs don't fit FlightSummary's single-carrier shape — collapse
 * them into one round-trip summary spanning the first/last leg. */
function toFlightSummary(
  outbound: TuraTransportOption,
  inbound: TuraTransportOption,
  fromCity: string,
  toCity: string,
): FlightSummary {
  const firstLeg = outbound.legs[0];
  const lastLeg = outbound.legs[outbound.legs.length - 1];
  const carriers = Array.from(new Set(outbound.legs.map((l) => l.carrier)));
  return {
    fromCode: firstLeg.fromCode,
    // tura resolves city names from its own (Russian-language) lookup table —
    // use our English display names instead, so this stays in English.
    fromCity,
    toCode: lastLeg.toCode,
    toCity,
    carrier: carriers.join(' + '),
    durationMinutes: outbound.totalDurationMin,
    stops: outbound.legs.length - 1,
    price: eur(outbound.pricePerPerson + inbound.pricePerPerson),
  };
}

function toStaySummary(hotel: TuraHotelOption | null, turaCity: string, city: string): StaySummary {
  if (!hotel) {
    return {
      name: `Stay in ${city}`,
      type: 'hotel',
      area: city,
      rating: 4,
      pricePerNight: eur(0),
      image: img(`${city}-stay`),
    };
  }
  // tura names hotels "{Russian city} {suffix}" (e.g. "Прага Hostel") — swap
  // in our English city name so the suffix (Hostel/Guesthouse/Boutique...)
  // still reads naturally.
  const name = hotel.name.startsWith(turaCity) ? `${city}${hotel.name.slice(turaCity.length)}` : hotel.name;
  return {
    name,
    type: 'hotel',
    area: city,
    rating: Math.min(5, Math.round((hotel.rating / 2) * 10) / 10),
    pricePerNight: eur(hotel.pricePerNight),
    image: img(`${city}-${hotel.name}`),
  };
}

function toCostBreakdown(option: TuraTripOption): CostBreakdown {
  // tura has no separate activities/food line items — it's purely
  // transport + stay. Estimate a modest day-to-day spend on top so the cost
  // breakdown card doesn't show zeroes, scaled by party size and nights.
  const food = Math.round(option.nights * option.groupSize * 22);
  return {
    flights: eur(option.transportTotal),
    stay: eur(option.hotelTotal),
    activities: eur(0),
    food: eur(food),
    total: eur(option.transportTotal + option.hotelTotal + food),
  };
}

function toMatch(option: TuraTripOption, query: DiscoverQuery): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 55 + option.savings.percent * 0.4;

  if (option.savings.percent >= 15) {
    reasons.push(`${option.savings.percent}% cheaper than the obvious direct option`);
  }
  if (option.outbound.isMultimodal || option.inbound.isMultimodal) {
    reasons.push('Found a cheaper bus + lowcost-flight combo');
  }
  const totalForParty = option.total + Math.round(option.nights * option.groupSize * 22);
  if (query.budget.amount > 0 && totalForParty <= query.budget.amount) {
    score += 10;
    reasons.push('Comfortably within your budget');
  }
  if (reasons.length === 0) reasons.push("Tura's engine found this as a strong fit for your dates");

  return { score: Math.max(20, Math.min(99, Math.round(score))), reasons: reasons.slice(0, 3) };
}

function toTripIdea(option: TuraTripOption, query: DiscoverQuery): TripIdea {
  const dest = destinationEn(option.destination);
  const { score, reasons } = toMatch(option, query);
  const flights = toFlightSummary(option.outbound, option.inbound, query.origin.trim(), dest.city);
  const stay = toStaySummary(option.hotel, option.destination.city, dest.city);
  const id = `tura-${option.destination.code.toLowerCase()}-${option.startDate}`;

  return {
    id,
    destination: dest,
    title: `${dest.city}: ${option.savings.percent}% cheaper than the obvious route`,
    summary: `${option.nights} nights in ${dest.city}, ${flights.stops > 0 ? 'via a multimodal hack' : 'direct'} — tura's engine compared transport combos to find this price.`,
    matchScore: score,
    matchReasons: reasons,
    dates: { start: option.startDate, end: option.endDate },
    nights: option.nights,
    travelers: option.groupSize,
    flights,
    stay,
    highlights: [dest.blurb, `Saved ${option.savings.percent}% vs. the naive booking`],
    cost: toCostBreakdown(option),
    images: [dest.image],
    bestFor: dest.tags,
  };
}

// ── in-memory cache ──────────────────────────────────────────────────────────
// tura's results are generated fresh per search, not persisted with stable
// IDs — this cache lets `getTripById` resolve an idea clicked into from a
// Discover result within the same server lifetime. It's intentionally
// ephemeral (resets on redeploy/restart); a real persistence layer would
// replace this once trips need to survive longer than a session.
const tripCache = new Map<string, TripIdea>();

function rememberAll(ideas: TripIdea[]): TripIdea[] {
  for (const idea of ideas) tripCache.set(idea.id, idea);
  return ideas;
}

/** Fills in the detail-page-only fields tura has no concept of (itinerary,
 * activities, weather) with a generic but reasonable template derived from
 * the idea's vibe and length, rather than leaving the page broken. */
function genericDetail(idea: TripIdea): TripDetail {
  const totalDays = idea.nights + 1;
  const middleTitles = ['Explore the old town', 'A slower day', 'One more highlight', 'Local markets & cafes', 'Off the beaten path'];
  const dayTitle = (i: number): string => {
    if (i === 0) return 'Arrive & settle in';
    if (i === totalDays - 1) return 'Last walk & departure';
    return middleTitles[(i - 1) % middleTitles.length];
  };
  const itinerary: TripDetail['itinerary'] = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    title: dayTitle(i),
    items: [
      { time: '10:00', title: i === 0 ? 'Arrival & check-in' : 'Morning out and about', kind: 'activity' },
      { time: '19:30', title: 'Dinner nearby', kind: 'food' },
    ],
  }));

  return {
    ...idea,
    itinerary,
    activities: [],
    weather: {
      season: 'Check seasonal norms',
      avgHighC: 26,
      avgLowC: 18,
      note: 'Generated estimate — tura does not yet model weather.',
    },
    gettingAround: `Getting around ${idea.destination.city} — details coming once tura adds local transit data.`,
  };
}

async function callTura(request: TuraSearchRequest): Promise<TuraSearchResponse> {
  const res = await fetch('/api/tura/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw new Error(`tura search failed with ${res.status}`);
  }
  return res.json();
}

const DEFAULT_SAMPLE_QUERY: DiscoverQuery = {
  origin: 'Vienna',
  originCode: 'VIE',
  budget: { amount: 900, currency: 'EUR' },
  // A realistic short trip, 2 weeks out — `datesFlexible: true` then lets
  // toSearchRequest widen the actual search window so tura has room to
  // pick the cheapest dates, without making the sample trip itself long.
  dates: { start: addDays(new Date().toISOString().slice(0, 10), 14), end: addDays(new Date().toISOString().slice(0, 10), 20) },
  datesFlexible: true,
  travelers: 2,
  vibes: ['budget'],
};

export const liveTripService: TripService = {
  async discoverTrips(query) {
    try {
      const response = await callTura(toSearchRequest(query));
      return rememberAll(response.options.map((o) => toTripIdea(o, query)));
    } catch {
      // tura unreachable (not running, network hiccup, etc.) — degrade to
      // mock results instead of breaking the Discover page.
      return mockTripService.discoverTrips(query);
    }
  },

  async getSampleIdeas() {
    try {
      const response = await callTura(toSearchRequest(DEFAULT_SAMPLE_QUERY));
      return rememberAll(response.options.slice(0, 6).map((o) => toTripIdea(o, DEFAULT_SAMPLE_QUERY)));
    } catch {
      return mockTripService.getSampleIdeas();
    }
  },

  async getTripById(id) {
    const cached = tripCache.get(id);
    if (cached) {
      await mockLatency(150, 350);
      return genericDetail(cached);
    }
    return mockTripService.getTripById(id);
  },

  // Manual planning has no tura equivalent yet (no stays/activities catalog,
  // no static destination list) — these stay on curated mock content.
  listDestinations: mockTripService.listDestinations,
  getStays: mockTripService.getStays,
  getActivities: mockTripService.getActivities,
  getFlights: mockTripService.getFlights,
};
