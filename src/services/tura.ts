// ── tura adapter ──────────────────────────────────────────────────────────
// `tura` is a friend's destination-picking search engine ("где дешевле" —
// direct flight vs bus-to-a-lowcost-hub combos), vendored in-process at
// src/lib/tura and called through /api/tura/search (see
// src/app/api/tura/search/route.ts). Its request/response shapes are
// completely different from ours (see src/lib/tura/types.ts), so this file
// is the translation layer: only `discoverTrips`/`getSampleIdeas` are
// tura-backed (that's its actual value — picking *where*); everything else
// (destinations list, manual stays/activities/flights, trip detail) has no
// equivalent in tura yet and falls back to the existing mock content.
import type {
  CostBreakdown,
  DiscoverQuery,
  FlightSummary,
  Money,
  StaySummary,
  TransportLegSummary,
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
  CDG: { city: 'Paris', country: 'France', region: 'Île-de-France' },
  BGY: { city: 'Milan', country: 'Italy', region: 'Lombardy' },
  VCE: { city: 'Venice', country: 'Italy', region: 'Veneto' },
  FLR: { city: 'Florence', country: 'Italy', region: 'Tuscany' },
  BLQ: { city: 'Bologna', country: 'Italy', region: 'Emilia-Romagna' },
  MAD: { city: 'Madrid', country: 'Spain', region: 'Community of Madrid' },
  SVQ: { city: 'Seville', country: 'Spain', region: 'Andalusia' },
  AGP: { city: 'Malaga', country: 'Spain', region: 'Costa del Sol' },
  BIO: { city: 'Bilbao', country: 'Spain', region: 'Basque Country' },
  AMS: { city: 'Amsterdam', country: 'Netherlands', region: 'North Holland' },
  BRU: { city: 'Brussels', country: 'Belgium', region: 'Brussels-Capital' },
  BER: { city: 'Berlin', country: 'Germany', region: 'Berlin' },
  HAM: { city: 'Hamburg', country: 'Germany', region: 'Hamburg' },
  CGN: { city: 'Cologne', country: 'Germany', region: 'North Rhine-Westphalia' },
  MUC: { city: 'Munich', country: 'Germany', region: 'Bavaria' },
  ZRH: { city: 'Zurich', country: 'Switzerland', region: 'Zurich' },
  GVA: { city: 'Geneva', country: 'Switzerland', region: 'Geneva' },
  DUB: { city: 'Dublin', country: 'Ireland', region: 'Leinster' },
  EDI: { city: 'Edinburgh', country: 'United Kingdom', region: 'Scotland' },
  LON: { city: 'London', country: 'United Kingdom', region: 'England' },
  VIE: { city: 'Vienna', country: 'Austria', region: 'Vienna' },
  ARN: { city: 'Stockholm', country: 'Sweden', region: 'Svealand' },
  CPH: { city: 'Copenhagen', country: 'Denmark', region: 'Zealand' },
  NCE: { city: 'Nice', country: 'France', region: 'French Riviera' },
  TFS: { city: 'Tenerife', country: 'Spain', region: 'Canary Islands' },
  FAO: { city: 'Faro', country: 'Portugal', region: 'Algarve' },
  DBV: { city: 'Dubrovnik', country: 'Croatia', region: 'Dalmatia' },
  ZAD: { city: 'Zadar', country: 'Croatia', region: 'Dalmatia' },
  RHO: { city: 'Rhodes', country: 'Greece', region: 'Dodecanese' },
  CFU: { city: 'Corfu', country: 'Greece', region: 'Ionian Islands' },
  HER: { city: 'Heraklion', country: 'Greece', region: 'Crete' },
  CHQ: { city: 'Chania', country: 'Greece', region: 'Crete' },
  JMK: { city: 'Mykonos', country: 'Greece', region: 'Cyclades' },
  JTR: { city: 'Santorini', country: 'Greece', region: 'Cyclades' },
  IBZ: { city: 'Ibiza', country: 'Spain', region: 'Balearic Islands' },
  ACE: { city: 'Lanzarote', country: 'Spain', region: 'Canary Islands' },
  LPA: { city: 'Gran Canaria', country: 'Spain', region: 'Canary Islands' },
  AYT: { city: 'Antalya', country: 'Turkey', region: 'Turkish Riviera' },
  PFO: { city: 'Paphos', country: 'Cyprus', region: 'Paphos District' },
  CAG: { city: 'Cagliari', country: 'Italy', region: 'Sardinia' },
  PMO: { city: 'Palermo', country: 'Italy', region: 'Sicily' },
  BRI: { city: 'Bari', country: 'Italy', region: 'Puglia' },
  OLB: { city: 'Olbia', country: 'Italy', region: 'Sardinia' },
};

/** English city names for every code that can show up in a leg (destinations,
 * ground hubs, common origins) — tura's own cityName() is Russian-language. */
const CITY_EN: Record<string, string> = {
  BCN: 'Barcelona',
  LIS: 'Lisbon',
  ATH: 'Athens',
  FCO: 'Rome',
  PMI: 'Palma de Mallorca',
  SPU: 'Split',
  BUD: 'Budapest',
  PRG: 'Prague',
  NAP: 'Naples',
  VLC: 'Valencia',
  OPO: 'Porto',
  CTA: 'Catania',
  KRK: 'Krakow',
  TIA: 'Tirana',
  SOF: 'Sofia',
  TGD: 'Podgorica',
  BER: 'Berlin',
  WAW: 'Warsaw',
  VIE: 'Vienna',
  MUC: 'Munich',
  BTS: 'Bratislava',
  WRO: 'Wroclaw',
  KTW: 'Katowice',
  POZ: 'Poznan',
  BGY: 'Bergamo',
};

function cityEn(code: string, fallback: string): string {
  return CITY_EN[code.toUpperCase()] ?? fallback;
}

/** Wikipedia article titles for a representative, vibe-matching landmark per
 * destination — used to pull a real photo instead of a random placeholder
 * (e.g. culture in Rome -> the Colosseum, beach in Mallorca -> Platja de Palma). */
const LANDMARK_TOPICS: Record<string, Partial<Record<Exclude<TuraVibe, 'any'>, string>>> = {
  BCN: { history: 'Sagrada Família', city: 'Barcelona', beach: 'Barceloneta Beach', party: 'La Rambla' },
  LIS: { history: 'Belém Tower', city: 'Lisbon', beach: 'Cascais' },
  ATH: { history: 'Acropolis of Athens', city: 'Athens', beach: 'Glyfada' },
  FCO: { history: 'Colosseum', city: 'Rome' },
  PMI: { history: 'Palma Cathedral', beach: 'Platja de Palma', party: 'Magaluf', city: 'Palma de Mallorca' },
  SPU: { history: "Diocletian's Palace", beach: 'Bačvice Beach', nature: 'Marjan', city: 'Split, Croatia' },
  BUD: { history: 'Hungarian Parliament Building', city: 'Budapest', party: 'Szimpla Kert' },
  PRG: { history: 'Charles Bridge', city: 'Prague Castle' },
  NAP: { history: 'Pompeii', nature: 'Mount Vesuvius', beach: 'Posillipo', city: 'Naples' },
  VLC: { city: 'City of Arts and Sciences', beach: 'Malvarrosa Beach' },
  OPO: { history: 'Ribeira (Porto)', city: 'Porto' },
  CTA: { nature: 'Mount Etna', history: 'Catania Cathedral', city: 'Catania', beach: 'Catania' },
  KRK: { history: 'Wawel Castle', city: 'Main Square, Kraków' },
  TIA: { city: 'Tirana', nature: 'Dajti Mountain' },
  SOF: { history: 'Alexander Nevsky Cathedral, Sofia', nature: 'Vitosha', city: 'Sofia' },
  TGD: { nature: 'Lake Skadar', beach: 'Budva', city: 'Podgorica' },
  CDG: { history: 'Eiffel Tower', city: 'Paris' },
  BGY: { history: 'Milan Cathedral', city: 'Milan' },
  VCE: { history: "St Mark's Basilica", city: 'Venice' },
  FLR: { history: 'Florence Cathedral', city: 'Florence' },
  BLQ: { history: 'Two Towers, Bologna', city: 'Bologna' },
  MAD: { history: 'Royal Palace of Madrid', city: 'Madrid' },
  SVQ: { history: 'Seville Cathedral', city: 'Seville' },
  AGP: { history: 'Alcazaba of Málaga', city: 'Málaga', beach: 'Málaga' },
  BIO: { history: 'Guggenheim Museum Bilbao', city: 'Bilbao' },
  AMS: { history: 'Anne Frank House', city: 'Amsterdam' },
  BRU: { history: 'Grand Place, Brussels', city: 'Brussels' },
  BER: { history: 'Brandenburg Gate', city: 'Berlin' },
  HAM: { city: 'Elbphilharmonie', party: 'Hamburg' },
  CGN: { history: 'Cologne Cathedral', city: 'Cologne' },
  MUC: { city: 'Marienplatz', party: 'Munich' },
  ZRH: { nature: 'Lake Zurich', city: 'Zurich' },
  GVA: { nature: "Jet d'Eau", city: 'Geneva' },
  DUB: { history: 'Trinity College Dublin', city: 'Dublin' },
  EDI: { history: 'Edinburgh Castle', city: 'Edinburgh' },
  LON: { history: 'Tower of London', city: 'London' },
  VIE: { history: 'Schönbrunn Palace', city: 'Vienna' },
  ARN: { history: 'Vasa Museum', city: 'Stockholm' },
  CPH: { history: 'Nyhavn', city: 'Copenhagen' },
  NCE: { beach: 'Promenade des Anglais', city: 'Nice' },
  TFS: { nature: 'Mount Teide', beach: 'Tenerife' },
  FAO: { beach: 'Faro, Portugal' },
  DBV: { history: 'Dubrovnik', beach: 'Dubrovnik' },
  ZAD: { beach: 'Zadar' },
  RHO: { history: 'Rhodes (city)', beach: 'Rhodes (city)' },
  CFU: { history: 'Corfu (city)', beach: 'Corfu (city)' },
  HER: { beach: 'Heraklion' },
  CHQ: { beach: 'Chania' },
  JMK: { beach: 'Mykonos', party: 'Mykonos' },
  JTR: { beach: 'Fira', nature: 'Fira' },
  IBZ: { beach: 'Ibiza Town', party: 'Ibiza Town' },
  ACE: { beach: 'Arrecife', nature: 'Arrecife' },
  LPA: { beach: 'Las Palmas de Gran Canaria' },
  AYT: { beach: 'Antalya' },
  PFO: { history: 'Paphos', beach: 'Paphos' },
  CAG: { beach: 'Cagliari' },
  PMO: { history: 'Palermo', beach: 'Palermo' },
  BRI: { beach: 'Bari' },
  OLB: { beach: 'Olbia, Sardinia' },
};

function landmarkTopic(code: string, primary: TuraVibe, destVibes: TuraVibe[]): string | undefined {
  const topics = LANDMARK_TOPICS[code];
  if (!topics) return undefined;
  for (const v of [primary, ...destVibes, 'history', 'city'] as TuraVibe[]) {
    if (v !== 'any' && topics[v]) return topics[v];
  }
  return Object.values(topics)[0];
}

const wikiImageCache = new Map<string, string>();

/** Looks up a real photo for a landmark via Wikipedia's summary API (no key
 * needed, CORS-open). Falls back to null on any miss so callers can use a
 * placeholder instead of breaking. */
async function wikiImage(topic: string): Promise<string | null> {
  if (wikiImageCache.has(topic)) return wikiImageCache.get(topic)!;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail?: { source: string }; originalimage?: { source: string } };
    const src = data.originalimage?.source ?? data.thumbnail?.source;
    if (!src) return null;
    const big = src.replace(/\/\d+px-/, '/1280px-');
    wikiImageCache.set(topic, big);
    return big;
  } catch {
    return null;
  }
}

async function destinationImage(
  code: string,
  primary: TuraVibe,
  destVibes: TuraVibe[],
  cityNameEn?: string,
): Promise<string> {
  const topic = landmarkTopic(code, primary, destVibes);
  const found = topic ? await wikiImage(topic) : null;
  if (found) return found;
  // No curated landmark for this destination (e.g. a freshly-discovered one
  // outside the hand-tagged list) — most cities still have their own
  // Wikipedia article, so try that before giving up to a generic photo.
  const cityFallback = cityNameEn ? await wikiImage(cityNameEn) : null;
  return cityFallback ?? img(code.toLowerCase());
}

/** City name -> IATA (city) code, for the origin field. Real flight prices
 * come from Travelpayouts, which needs a real code — guessing the first 3
 * letters of the city name (the old fallback) is wrong for most cities
 * (e.g. "Barcelona" -> "BAR" instead of "BCN") and silently returns zero
 * flight results, so anything a user is likely to type as a departure city
 * needs to be listed here explicitly. */
const ORIGIN_CODES: Record<string, string> = {
  vienna: 'VIE',
  wien: 'VIE',
  berlin: 'BER',
  warsaw: 'WAW',
  warszawa: 'WAW',
  munich: 'MUC',
  munchen: 'MUC',
  münchen: 'MUC',
  prague: 'PRG',
  praha: 'PRG',
  budapest: 'BUD',
  barcelona: 'BCN',
  lisbon: 'LIS',
  lisboa: 'LIS',
  athens: 'ATH',
  rome: 'ROM',
  roma: 'ROM',
  palma: 'PMI',
  'palma de mallorca': 'PMI',
  split: 'SPU',
  naples: 'NAP',
  napoli: 'NAP',
  valencia: 'VLC',
  porto: 'OPO',
  catania: 'CTA',
  krakow: 'KRK',
  kraków: 'KRK',
  cracow: 'KRK',
  tirana: 'TIA',
  sofia: 'SOF',
  podgorica: 'TGD',
  paris: 'PAR',
  madrid: 'MAD',
  milan: 'MIL',
  milano: 'MIL',
  london: 'LON',
  amsterdam: 'AMS',
  brussels: 'BRU',
  bruxelles: 'BRU',
  zurich: 'ZRH',
  zürich: 'ZRH',
  geneva: 'GVA',
  dublin: 'DUB',
  stockholm: 'STO',
  copenhagen: 'CPH',
  oslo: 'OSL',
  helsinki: 'HEL',
  bratislava: 'BTS',
  wroclaw: 'WRO',
  wrocław: 'WRO',
  katowice: 'KTW',
  poznan: 'POZ',
  poznań: 'POZ',
  bergamo: 'BGY',
  milanbergamo: 'BGY',
  hamburg: 'HAM',
  cologne: 'CGN',
  köln: 'CGN',
  frankfurt: 'FRA',
  stuttgart: 'STR',
  düsseldorf: 'DUS',
  dusseldorf: 'DUS',
  venice: 'VCE',
  venezia: 'VCE',
  bologna: 'BLQ',
  florence: 'FLR',
  firenze: 'FLR',
  malpensa: 'MXP',
  bilbao: 'BIO',
  seville: 'SVQ',
  sevilla: 'SVQ',
  malaga: 'AGP',
  málaga: 'AGP',
  ibiza: 'IBZ',
  malta: 'MLA',
  valletta: 'MLA',
  larnaca: 'LCA',
  bucharest: 'BUH',
  belgrade: 'BEG',
  zagreb: 'ZAG',
  ljubljana: 'LJU',
  vilnius: 'VNO',
  riga: 'RIX',
  tallinn: 'TLL',
  kyiv: 'IEV',
  kiev: 'IEV',
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

async function destinationEn(d: TuraDestination, primaryVibe: TuraVibe) {
  const known = TURA_DESTINATION_EN[d.code];
  return {
    id: d.code.toLowerCase(),
    city: known?.city ?? d.city,
    country: known?.country ?? d.country,
    region: known?.region ?? d.country,
    blurb: `A ${d.vibes.join(', ')} pick from tura's route-finding engine.`,
    image: await destinationImage(d.code, primaryVibe, d.vibes, known?.city ?? d.city),
    tags: turaVibeToOurs(d.vibes[0] ?? 'any'),
    airportCode: d.code,
  };
}

function toLegSummaries(legs: TuraTransportLeg[]): TransportLegSummary[] {
  return legs.map((l) => ({
    mode: l.mode === 'air' ? 'flight' : l.mode,
    fromCity: cityEn(l.fromCode, l.fromCity),
    toCity: cityEn(l.toCode, l.toCity),
    carrier: l.carrier,
    durationMinutes: l.durationMin,
  }));
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
    legs: toLegSummaries(outbound.legs),
  };
}

function toStaySummary(
  hotel: TuraHotelOption | null,
  turaCity: string,
  city: string,
  nights: number,
): StaySummary {
  if (!hotel) {
    return {
      // nights === 0 is a genuine day trip (no stay needed); nights > 0
      // with no hotel means we just don't have verified hotel data for this
      // destination yet (e.g. a freshly-discovered one) — say so rather
      // than implying a free/zero-cost stay.
      name: nights === 0 ? `Day trip to ${city}` : `Hotel pricing not yet available for ${city}`,
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

async function toTripIdea(option: TuraTripOption, query: DiscoverQuery): Promise<TripIdea> {
  const primaryVibe = pickTuraVibe(query.vibes);
  const dest = await destinationEn(option.destination, primaryVibe);
  const { score, reasons } = toMatch(option, query);
  const flights = toFlightSummary(option.outbound, option.inbound, query.origin.trim(), dest.city);
  const stay = toStaySummary(option.hotel, option.destination.city, dest.city, option.nights);
  const id = `tura-${option.destination.code.toLowerCase()}-${option.startDate}`;
  const nightWord = option.nights === 1 ? 'day' : 'days';

  return {
    id,
    destination: dest,
    title: dest.city,
    summary: `Spend ${option.nights} unforgettable ${nightWord} in ${dest.city}, ${dest.country}.`,
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

// "A few ideas to start" doesn't lock to one trip length — it tries a
// spread of nights per destination and, for each, keeps the longest stay
// that still fits the budget (falling back to the cheapest option if none
// fit at all). Picking the *cheapest* nights outright degenerates to always
// picking the shortest candidate, since hotel cost scales with nights while
// flight cost (Travelpayouts' /v1/prices/cheap is month-granularity, not
// exact-date) stays flat across nearby dates — so "longest that fits
// budget" is what actually rewards a destination having unusually cheap
// flights this month. Genuine date-level fare arbitrage (a specific day
// being cheaper to fly) would need Travelpayouts' calendar endpoint instead.
const SAMPLE_NIGHTS_CANDIDATES = [3, 4, 5, 6, 7, 9];

async function bestPerDestination(
  base: DiscoverQuery,
  nightsCandidates: number[],
): Promise<TuraTripOption[]> {
  const baseRequest = toSearchRequest(base);
  const responses = await Promise.all(
    nightsCandidates.map((nights) => callTura({ ...baseRequest, durationDays: nights + 1 })),
  );

  const byDestination = new Map<string, TuraTripOption[]>();
  for (const response of responses) {
    for (const option of response.options) {
      const list = byDestination.get(option.destination.code);
      if (list) list.push(option);
      else byDestination.set(option.destination.code, [option]);
    }
  }

  const best: TuraTripOption[] = [];
  for (const candidates of byDestination.values()) {
    const withinBudget = candidates.filter((o) => o.total <= base.budget.amount);
    const pool = withinBudget.length ? withinBudget : candidates;
    best.push(
      pool.reduce((longest, o) =>
        o.nights > longest.nights || (o.nights === longest.nights && o.total < longest.total)
          ? o
          : longest,
      ),
    );
  }
  return best;
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
    const response = await callTura(toSearchRequest(query));
    const ideas = await Promise.all(response.options.map((o) => toTripIdea(o, query)));
    return rememberAll(ideas);
  },

  async getSampleIdeas() {
    const options = await bestPerDestination(DEFAULT_SAMPLE_QUERY, SAMPLE_NIGHTS_CANDIDATES);
    const withinBudget = options.filter((o) => o.total <= DEFAULT_SAMPLE_QUERY.budget.amount);
    const ranked = (withinBudget.length ? withinBudget : options)
      .sort((a, b) => a.total - b.total)
      .slice(0, 6);
    const ideas = await Promise.all(ranked.map((o) => toTripIdea(o, DEFAULT_SAMPLE_QUERY)));
    return rememberAll(ideas);
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
