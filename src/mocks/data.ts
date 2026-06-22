import type {
  Activity,
  CostBreakdown,
  Destination,
  FlightSummary,
  Money,
  StaySummary,
  TripDetail,
  TripIdea,
  WeatherSummary,
} from '@/services/types';

// ── helpers ──────────────────────────────────────────────────────────────────

const eur = (amount: number): Money => ({ amount, currency: 'EUR' });

/** Stable placeholder photography (swap for curated destination imagery later). */
const img = (seed: string, w = 1280, h = 960): string =>
  `https://picsum.photos/seed/yl-${seed}/${w}/${h}`;

function buildCost(flights: number, stay: number, activities: number, food: number): CostBreakdown {
  return {
    flights: eur(flights),
    stay: eur(stay),
    activities: eur(activities),
    food: eur(food),
    total: eur(flights + stay + activities + food),
  };
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const START = '2026-07-04';
const dates = (nights: number) => ({ start: START, end: addDays(START, nights) });

const flight = (
  toCode: string,
  toCity: string,
  carrier: string,
  durationMinutes: number,
  stops: number,
  price: number,
): FlightSummary => ({
  fromCode: 'VIE',
  fromCity: 'Vienna',
  toCode,
  toCity,
  carrier,
  durationMinutes,
  stops,
  price: eur(price),
});

// ── destinations ─────────────────────────────────────────────────────────────

export const destinations: Destination[] = [
  {
    id: 'kotor',
    city: 'Kotor',
    country: 'Montenegro',
    region: 'Bay of Kotor, Adriatic',
    blurb: 'A walled old town under grey mountains, wrapped around a fjord-like bay.',
    image: img('kotor'),
    tags: ['beach', 'nature', 'romantic', 'budget'],
    airportCode: 'TIV',
  },
  {
    id: 'naxos',
    city: 'Naxos',
    country: 'Greece',
    region: 'Cyclades',
    blurb: 'The greenest Cycladic island: long sandy beaches, mountain villages, no rush.',
    image: img('naxos'),
    tags: ['beach', 'relax', 'food'],
    airportCode: 'JNX',
  },
  {
    id: 'athens',
    city: 'Athens',
    country: 'Greece',
    region: 'Attica',
    blurb: 'Ancient stone and a loud, warm modern city — with beaches a tram ride away.',
    image: img('athens'),
    tags: ['culture', 'city', 'food', 'nightlife'],
    airportCode: 'ATH',
  },
  {
    id: 'valletta',
    city: 'Valletta',
    country: 'Malta',
    region: 'Maltese islands',
    blurb: 'A honey-coloured baroque capital on a peninsula, sea on both sides.',
    image: img('valletta'),
    tags: ['culture', 'beach', 'city', 'food'],
    airportCode: 'MLA',
  },
  {
    id: 'funchal',
    city: 'Funchal',
    country: 'Madeira, Portugal',
    region: 'Atlantic',
    blurb: 'A subtropical island of cliffs, levada trails and natural ocean pools.',
    image: img('funchal'),
    tags: ['nature', 'adventure', 'relax'],
    airportCode: 'FNC',
  },
  {
    id: 'lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    region: 'Atlantic coast',
    blurb: 'Hills, tiles and trams, long lunches, and surf beaches half an hour out.',
    image: img('lisbon'),
    tags: ['city', 'food', 'culture', 'nightlife'],
    airportCode: 'LIS',
  },
  {
    id: 'split',
    city: 'Split',
    country: 'Croatia',
    region: 'Dalmatian coast',
    blurb: 'Life inside a Roman palace, with island ferries leaving from the door.',
    image: img('split'),
    tags: ['beach', 'culture', 'nightlife', 'adventure'],
    airportCode: 'SPU',
  },
  {
    id: 'tirana',
    city: 'Tirana',
    country: 'Albania',
    region: 'Western Balkans',
    blurb: 'Bright, cheap and fast-changing, with the Albanian Riviera within reach.',
    image: img('tirana'),
    tags: ['budget', 'culture', 'food', 'city'],
    airportCode: 'TIA',
  },
];

const destById = Object.fromEntries(destinations.map((d) => [d.id, d])) as Record<
  string,
  Destination
>;

// ── primary flights & stays ──────────────────────────────────────────────────

const primaryFlights: Record<string, FlightSummary> = {
  kotor: flight('TIV', 'Tivat', 'Austrian Airlines', 95, 0, 180),
  naxos: flight('JNX', 'Naxos', 'Aegean Airlines', 160, 1, 240),
  athens: flight('ATH', 'Athens', 'Austrian Airlines', 130, 0, 160),
  valletta: flight('MLA', 'Malta', 'Ryanair', 150, 0, 120),
  funchal: flight('FNC', 'Funchal', 'TAP Air Portugal', 320, 1, 260),
  lisbon: flight('LIS', 'Lisbon', 'Austrian Airlines', 200, 0, 170),
  split: flight('SPU', 'Split', 'Croatia Airlines', 75, 0, 140),
  tirana: flight('TIA', 'Tirana', 'Wizz Air', 105, 0, 90),
};

const primaryStays: Record<string, StaySummary> = {
  kotor: { name: 'Hotel Hippocampus', type: 'boutique', area: 'Old Town', rating: 4.6, pricePerNight: eur(90), image: img('kotor-stay') },
  naxos: { name: 'Naxian Riviera', type: 'hotel', area: 'Agios Prokopios', rating: 4.7, pricePerNight: eur(110), image: img('naxos-stay') },
  athens: { name: 'Coco-Mat Athens BC', type: 'hotel', area: 'Kolonaki', rating: 4.5, pricePerNight: eur(120), image: img('athens-stay') },
  valletta: { name: 'The Saint John', type: 'boutique', area: 'Valletta', rating: 4.6, pricePerNight: eur(90), image: img('valletta-stay') },
  funchal: { name: 'Quinta da Casa Branca', type: 'hotel', area: 'Funchal', rating: 4.8, pricePerNight: eur(100), image: img('funchal-stay') },
  lisbon: { name: 'Memmo Alfama', type: 'boutique', area: 'Alfama', rating: 4.7, pricePerNight: eur(130), image: img('lisbon-stay') },
  split: { name: 'Marvie Hotel', type: 'hotel', area: 'Znjan', rating: 4.5, pricePerNight: eur(100), image: img('split-stay') },
  tirana: { name: 'Rogner Hotel', type: 'hotel', area: 'Blloku', rating: 4.4, pricePerNight: eur(70), image: img('tirana-stay') },
};

// ── trip ideas (Discover results) ────────────────────────────────────────────

interface IdeaSeed {
  id: string;
  title: string;
  summary: string;
  matchScore: number;
  nights: number;
  matchReasons: string[];
  highlights: string[];
  cost: CostBreakdown;
}

const ideaSeeds: IdeaSeed[] = [
  {
    id: 'kotor',
    title: 'Slow Adriatic days under grey mountains',
    summary: 'Swim in the calmest stretch of the Adriatic, then walk a medieval town that fits in an afternoon.',
    matchScore: 96,
    nights: 6,
    matchReasons: [
      'Warm, swimmable bay all week',
      'Short direct hop from Vienna',
      'Stays well inside a mid-range budget',
    ],
    highlights: ['Swim in the Bay of Kotor', 'Climb the fortress walls at dusk', 'Boat to Our Lady of the Rocks', 'Day trip to Sveti Stefan'],
    cost: buildCost(360, 540, 180, 300),
  },
  {
    id: 'naxos',
    title: 'Long sandy beaches, no rush',
    summary: 'The Cyclades without the crowds: kilometre-long beaches by day, tavernas in mountain villages by night.',
    matchScore: 92,
    nights: 6,
    matchReasons: ['Some of the best sand in Greece', 'Relaxed, low-key pace', 'Strong local food scene'],
    highlights: ['Plaka and Agios Prokopios beaches', 'Sunset at the Portara', 'Halki village and a distillery', 'Fresh fish in Naxos Town'],
    cost: buildCost(480, 660, 160, 320),
  },
  {
    id: 'athens',
    title: 'Ancient stone, then a swim',
    summary: 'Big history in the morning, a loud dinner at night, and the Athens Riviera when you want the sea.',
    matchScore: 89,
    nights: 5,
    matchReasons: ['Culture and city energy in one', 'Beaches reachable by tram', 'Direct flights, easy logistics'],
    highlights: ['The Acropolis at opening time', 'Plaka and Anafiotika lanes', 'Rooftop dinner over the ruins', 'Swim at Vouliagmeni'],
    cost: buildCost(320, 600, 220, 340),
  },
  {
    id: 'valletta',
    title: 'Baroque streets between two seas',
    summary: 'A tiny golden capital you can cross on foot, with swimming spots and island hops on the doorstep.',
    matchScore: 90,
    nights: 6,
    matchReasons: ['Walkable, sea on both sides', 'Reliable July sunshine', 'Cheap, fast flights'],
    highlights: ['St John’s Co-Cathedral', 'Swim off Sliema rocks', 'Ferry to Gozo', 'Boat into the Blue Lagoon'],
    cost: buildCost(240, 540, 200, 300),
  },
  {
    id: 'funchal',
    title: 'An Atlantic island that never gets cold',
    summary: 'Cliffs, levada trails and natural lava pools, with mild ocean swims and a green, dramatic interior.',
    matchScore: 88,
    nights: 7,
    matchReasons: ['Nature and gentle adventure', 'Comfortable, not-too-hot climate', 'Great for a longer week'],
    highlights: ['Levada walk to a waterfall', 'Lava pools at Porto Moniz', 'Cable car to Monte', 'Seafront seafood in the old town'],
    cost: buildCost(520, 700, 260, 360),
  },
  {
    id: 'lisbon',
    title: 'Tiles, trams and surf at the edge',
    summary: 'A hilly, photogenic city with serious food and Atlantic surf beaches a short train ride away.',
    matchScore: 86,
    nights: 5,
    matchReasons: ['City break with beach option', 'Excellent food for the price', 'Lively nights in Bairro Alto'],
    highlights: ['Tram 28 across the hills', 'Pastéis in Belém', 'Day at Cascais beaches', 'Fado dinner in Alfama'],
    cost: buildCost(340, 650, 200, 360),
  },
  {
    id: 'split',
    title: 'Live inside a Roman palace',
    summary: 'Sleep beside a 1,700-year-old palace, swim off pebble coves, and ferry to a different island each day.',
    matchScore: 91,
    nights: 6,
    matchReasons: ['Beach, culture and nightlife together', 'Very short flight from Vienna', 'Island day-trips from the centre'],
    highlights: ['Diocletian’s Palace at night', 'Swim at Bacvice', 'Ferry to Hvar', 'Marjan hill at sunset'],
    cost: buildCost(280, 600, 220, 320),
  },
  {
    id: 'tirana',
    title: 'The Balkans, bright and cheap',
    summary: 'A fast-changing, colourful capital with great cheap food — and the wild Albanian Riviera within reach.',
    matchScore: 84,
    nights: 6,
    matchReasons: ['Lowest total cost of the set', 'Up-and-coming, few crowds', 'Big food scene for little money'],
    highlights: ['Bunk’Art museum', 'Coffee in the Blloku', 'Day trip to Berat', 'Drive to the Riviera beaches'],
    cost: buildCost(180, 420, 160, 260),
  },
];

export const tripIdeas: TripIdea[] = ideaSeeds.map((seed) => ({
  id: seed.id,
  destination: destById[seed.id],
  title: seed.title,
  summary: seed.summary,
  matchScore: seed.matchScore,
  matchReasons: seed.matchReasons,
  dates: dates(seed.nights),
  nights: seed.nights,
  travelers: 2,
  flights: primaryFlights[seed.id],
  stay: primaryStays[seed.id],
  highlights: seed.highlights,
  cost: seed.cost,
  images: [img(seed.id), img(`${seed.id}-2`), img(`${seed.id}-3`)],
  bestFor: destById[seed.id].tags,
}));

const ideaById = Object.fromEntries(tripIdeas.map((i) => [i.id, i])) as Record<string, TripIdea>;

// ── detail extras (itinerary, activities, weather) ────────────────────────────

interface DetailExtra {
  weather: WeatherSummary;
  gettingAround: string;
  activities: Activity[];
  itinerary: TripDetail['itinerary'];
}

const act = (
  id: string,
  title: string,
  description: string,
  category: Activity['category'],
  durationHours: number,
  price: number | null,
): Activity => ({
  id,
  title,
  description,
  category,
  durationHours,
  price: price === null ? null : eur(price),
  image: img(`act-${id}`),
});

const detailExtras: Record<string, DetailExtra> = {
  kotor: {
    weather: { season: 'High summer', avgHighC: 29, avgLowC: 22, note: 'Hot days, warm sheltered sea, little rain' },
    gettingAround: 'The old town is car-free and walkable. Use taxis or local boats for beaches and the bay.',
    activities: [
      act('kotor-walls', 'Fortress walls at golden hour', 'Climb the 1,350 steps above the old town for the classic bay view.', 'sight', 2.5, null),
      act('kotor-boat', 'Bay boat to Perast', 'Wooden-boat trip to Perast and the island church of Our Lady of the Rocks.', 'water', 4, 35),
      act('kotor-beach', 'Swim day near Tivat', 'Beach club afternoon on the cleaner outer-bay beaches.', 'water', 5, 20),
      act('kotor-food', 'Konoba dinner', 'Adriatic seafood and Montenegrin wine in a family konoba.', 'food', 2, 30),
    ],
    itinerary: [
      { day: 1, title: 'Arrive and settle in', items: [
        { time: '13:00', title: 'Land at Tivat, transfer to Kotor', kind: 'flight' },
        { time: '18:00', title: 'First walk through the old town', description: 'Find your bearings on the marble lanes before dinner.', kind: 'free' },
      ] },
      { day: 2, title: 'Walls and water', items: [
        { time: '08:30', title: 'Fortress walls before the heat', kind: 'activity' },
        { time: '13:00', title: 'Swim and lunch by the bay', kind: 'activity' },
      ] },
      { day: 3, title: 'Out on the bay', items: [
        { time: '10:00', title: 'Boat to Perast and the islands', kind: 'activity' },
        { time: '20:00', title: 'Seafood konoba dinner', kind: 'food' },
      ] },
      { day: 4, title: 'Beyond Kotor', items: [
        { time: '09:30', title: 'Day trip to Sveti Stefan', kind: 'transport' },
        { time: '19:00', title: 'Sunset drinks above the bay', kind: 'free' },
      ] },
    ],
  },
  naxos: {
    weather: { season: 'High summer', avgHighC: 28, avgLowC: 23, note: 'Warm and breezy, the Cycladic meltemi keeps it comfortable' },
    gettingAround: 'Rent a small car for two or three days to reach the mountain villages and quieter beaches.',
    activities: [
      act('naxos-plaka', 'Plaka beach day', 'Kilometres of soft sand and shallow water — claim a sunbed and stay.', 'water', 6, 15),
      act('naxos-portara', 'Sunset at the Portara', 'The marble temple gate framing the sunset over the water.', 'sight', 1.5, null),
      act('naxos-villages', 'Mountain village drive', 'Halki, Apeiranthos and a citron distillery in the green interior.', 'culture', 5, 25),
      act('naxos-fish', 'Harbour fish dinner', 'Just-caught fish on the old harbour front.', 'food', 2, 35),
    ],
    itinerary: [
      { day: 1, title: 'Arrive on the island', items: [
        { time: '15:00', title: 'Land at Naxos, check in near the beach', kind: 'flight' },
        { time: '20:00', title: 'Portara at sunset', kind: 'activity' },
      ] },
      { day: 2, title: 'Beach reset', items: [
        { time: '10:00', title: 'Plaka beach all day', kind: 'activity' },
        { time: '21:00', title: 'Dinner in Naxos Town', kind: 'food' },
      ] },
      { day: 3, title: 'Into the mountains', items: [
        { time: '09:30', title: 'Village drive and distillery', kind: 'activity' },
        { time: '18:00', title: 'Swim back at the coast', kind: 'free' },
      ] },
      { day: 4, title: 'Slow day', items: [
        { time: '11:00', title: 'Quiet southern beach', kind: 'activity' },
        { time: '20:30', title: 'Harbour fish dinner', kind: 'food' },
      ] },
    ],
  },
  athens: {
    weather: { season: 'High summer', avgHighC: 33, avgLowC: 24, note: 'Hot and dry — start sightseeing early, swim in the afternoon' },
    gettingAround: 'Walk the historic centre; use the metro and the coastal tram to reach the Riviera beaches.',
    activities: [
      act('athens-acropolis', 'Acropolis at opening', 'Beat the heat and the crowds at the gate when it opens.', 'sight', 3, 20),
      act('athens-plaka', 'Plaka and Anafiotika', 'Wander the oldest lanes under the rock, coffee stops included.', 'culture', 2.5, null),
      act('athens-rooftop', 'Rooftop dinner over the ruins', 'Dinner with the lit Acropolis in view.', 'food', 2.5, 45),
      act('athens-swim', 'Vouliagmeni swim', 'Tram and a dip at the Riviera beaches.', 'water', 5, 15),
    ],
    itinerary: [
      { day: 1, title: 'Land and look up', items: [
        { time: '12:00', title: 'Arrive, drop bags in Kolonaki', kind: 'flight' },
        { time: '19:00', title: 'Sunset on Lycabettus hill', kind: 'free' },
      ] },
      { day: 2, title: 'The big sights', items: [
        { time: '08:00', title: 'Acropolis and the museum', kind: 'activity' },
        { time: '21:00', title: 'Rooftop dinner over the ruins', kind: 'food' },
      ] },
      { day: 3, title: 'City and sea', items: [
        { time: '10:00', title: 'Plaka, markets and Anafiotika', kind: 'activity' },
        { time: '15:00', title: 'Tram to Vouliagmeni for a swim', kind: 'activity' },
      ] },
      { day: 4, title: 'Loose ends', items: [
        { time: '10:00', title: 'Coffee and the flea market', kind: 'free' },
        { time: '20:00', title: 'Last dinner in Psyri', kind: 'food' },
      ] },
    ],
  },
  valletta: {
    weather: { season: 'High summer', avgHighC: 31, avgLowC: 23, note: 'Hot, sunny and dry with a warm, clear sea' },
    gettingAround: 'Valletta is walkable; ferries and buses link Sliema, the Three Cities and Gozo.',
    activities: [
      act('valletta-cathedral', 'St John’s Co-Cathedral', 'Caravaggio and a baroque interior unlike anything its size.', 'culture', 1.5, 15),
      act('valletta-swim', 'Sliema rock swim', 'Flat rocks and ladders into deep, clear water.', 'water', 4, null),
      act('valletta-gozo', 'Ferry to Gozo', 'Quieter island of cliffs, salt pans and the inland sea.', 'nature', 7, 30),
      act('valletta-lagoon', 'Blue Lagoon boat', 'Boat to Comino’s turquoise lagoon for a swim.', 'water', 5, 35),
    ],
    itinerary: [
      { day: 1, title: 'Into the golden city', items: [
        { time: '14:00', title: 'Arrive, settle in Valletta', kind: 'flight' },
        { time: '18:30', title: 'Upper Barrakka Gardens at dusk', kind: 'free' },
      ] },
      { day: 2, title: 'City and a swim', items: [
        { time: '09:30', title: 'St John’s and the old streets', kind: 'activity' },
        { time: '15:00', title: 'Ferry to Sliema, rock swim', kind: 'activity' },
      ] },
      { day: 3, title: 'Island day', items: [
        { time: '09:00', title: 'Ferry to Gozo', kind: 'activity' },
        { time: '20:00', title: 'Seafood back in Valletta', kind: 'food' },
      ] },
      { day: 4, title: 'Blue water', items: [
        { time: '10:00', title: 'Boat into the Blue Lagoon', kind: 'activity' },
        { time: '19:30', title: 'Sunset aperitivo', kind: 'free' },
      ] },
    ],
  },
  funchal: {
    weather: { season: 'Mild Atlantic summer', avgHighC: 25, avgLowC: 20, note: 'Spring-like all year; warmer, calmer swimming on the south coast' },
    gettingAround: 'A rental car opens up the island; taxis and the cable car cover Funchal itself.',
    activities: [
      act('funchal-levada', 'Levada walk to a waterfall', 'Gentle water-channel trail through laurel forest.', 'nature', 4, 25),
      act('funchal-pools', 'Porto Moniz lava pools', 'Natural volcanic-rock pools fed by the Atlantic.', 'water', 5, 5),
      act('funchal-monte', 'Cable car to Monte', 'Ride up for gardens and the view over the bay.', 'sight', 3, 18),
      act('funchal-market', 'Old town and market', 'Tropical fruit, espadarte and poncha in the historic quarter.', 'food', 2.5, null),
    ],
    itinerary: [
      { day: 1, title: 'Arrive on the island', items: [
        { time: '16:00', title: 'Land at Funchal, check in', kind: 'flight' },
        { time: '20:00', title: 'Dinner in the old town', kind: 'food' },
      ] },
      { day: 2, title: 'Green interior', items: [
        { time: '09:00', title: 'Levada walk to a waterfall', kind: 'activity' },
        { time: '17:00', title: 'Poncha on the seafront', kind: 'free' },
      ] },
      { day: 3, title: 'North coast', items: [
        { time: '09:30', title: 'Drive to Porto Moniz lava pools', kind: 'activity' },
        { time: '19:00', title: 'Sunset at Cabo Girão skywalk', kind: 'activity' },
      ] },
      { day: 4, title: 'Funchal day', items: [
        { time: '10:00', title: 'Cable car to Monte gardens', kind: 'activity' },
        { time: '13:00', title: 'Market lunch', kind: 'food' },
      ] },
    ],
  },
  lisbon: {
    weather: { season: 'High summer', avgHighC: 28, avgLowC: 18, note: 'Warm and sunny in town, cooler and breezier on the Atlantic beaches' },
    gettingAround: 'Trams, the metro and your feet in town; trains to Cascais and Sintra in under an hour.',
    activities: [
      act('lisbon-tram', 'Tram 28 and the hills', 'Ride the classic line through Graça, Alfama and Estrela.', 'sight', 2, 4),
      act('lisbon-belem', 'Belém and pastéis', 'Monastery, tower and the original custard tarts.', 'culture', 3, 12),
      act('lisbon-cascais', 'Cascais beach day', 'Train down the coast for sand and seafood.', 'water', 6, 8),
      act('lisbon-fado', 'Fado dinner in Alfama', 'Dinner with live fado in a small tavern.', 'nightlife', 2.5, 40),
    ],
    itinerary: [
      { day: 1, title: 'Settle into the hills', items: [
        { time: '13:00', title: 'Arrive, check in around Alfama', kind: 'flight' },
        { time: '19:00', title: 'Miradouro sunset and dinner', kind: 'free' },
      ] },
      { day: 2, title: 'Classic Lisbon', items: [
        { time: '09:30', title: 'Tram 28 and the old quarters', kind: 'activity' },
        { time: '21:00', title: 'Fado dinner in Alfama', kind: 'activity' },
      ] },
      { day: 3, title: 'West to the water', items: [
        { time: '10:00', title: 'Belém, then train to Cascais', kind: 'activity' },
        { time: '20:00', title: 'Seafood back in town', kind: 'food' },
      ] },
      { day: 4, title: 'Loose day', items: [
        { time: '10:00', title: 'LX Factory and time-out market', kind: 'free' },
        { time: '19:00', title: 'Rooftop drinks', kind: 'activity' },
      ] },
    ],
  },
  split: {
    weather: { season: 'High summer', avgHighC: 30, avgLowC: 23, note: 'Hot and sunny with a warm, clear Adriatic' },
    gettingAround: 'Walk the centre; catch catamarans and car ferries to the islands from the city port.',
    activities: [
      act('split-palace', 'Diocletian’s Palace at night', 'Wander the lamplit cellars and squares after the day-trippers leave.', 'culture', 2, null),
      act('split-bacvice', 'Bacvice swim', 'Sandy city beach famous for the local game of picigin.', 'water', 4, null),
      act('split-hvar', 'Ferry to Hvar', 'Day on the chic island of lavender fields and clear coves.', 'water', 8, 25),
      act('split-marjan', 'Marjan hill sunset', 'Pine-covered peninsula above the city for the best light.', 'nature', 2.5, null),
    ],
    itinerary: [
      { day: 1, title: 'Into the palace', items: [
        { time: '12:30', title: 'Short flight in, check in near the centre', kind: 'flight' },
        { time: '20:00', title: 'Dinner inside the palace walls', kind: 'food' },
      ] },
      { day: 2, title: 'City and sea', items: [
        { time: '09:00', title: 'Palace and Riva by morning', kind: 'activity' },
        { time: '14:00', title: 'Swim at Bacvice', kind: 'activity' },
      ] },
      { day: 3, title: 'Island day', items: [
        { time: '08:30', title: 'Ferry to Hvar', kind: 'activity' },
        { time: '21:00', title: 'Drinks back on the Riva', kind: 'activity' },
      ] },
      { day: 4, title: 'High views', items: [
        { time: '10:00', title: 'Marjan hill walk', kind: 'activity' },
        { time: '19:30', title: 'Sunset and seafood', kind: 'food' },
      ] },
    ],
  },
  tirana: {
    weather: { season: 'High summer', avgHighC: 31, avgLowC: 18, note: 'Hot inland in the city; the Riviera coast is warm and swimmable' },
    gettingAround: 'Tirana is walkable and cheap by taxi; rent a car for Berat and the coast.',
    activities: [
      act('tirana-bunkart', 'Bunk’Art museum', 'A vast cold-war bunker turned history and art space.', 'culture', 2.5, 8),
      act('tirana-blloku', 'Blloku cafes', 'Coffee and people-watching in the buzzing former party quarter.', 'food', 2, null),
      act('tirana-berat', 'Day trip to Berat', 'The white-stone “town of a thousand windows”.', 'culture', 8, 30),
      act('tirana-riviera', 'Drive to the Riviera', 'Long drive to the turquoise beaches of the south coast.', 'water', 9, 40),
    ],
    itinerary: [
      { day: 1, title: 'Arrive in the capital', items: [
        { time: '13:30', title: 'Land, check in near Blloku', kind: 'flight' },
        { time: '19:00', title: 'Skanderbeg Square and dinner', kind: 'free' },
      ] },
      { day: 2, title: 'City and history', items: [
        { time: '10:00', title: 'Bunk’Art and the Pyramid', kind: 'activity' },
        { time: '16:00', title: 'Cable car up Dajti mountain', kind: 'activity' },
      ] },
      { day: 3, title: 'Old stone', items: [
        { time: '08:30', title: 'Day trip to Berat', kind: 'activity' },
        { time: '21:00', title: 'Late dinner back in town', kind: 'food' },
      ] },
      { day: 4, title: 'To the sea', items: [
        { time: '08:00', title: 'Drive toward the Riviera', kind: 'activity' },
        { time: '20:00', title: 'Beach dinner', kind: 'food' },
      ] },
    ],
  },
};

// ── derived collections for the manual Plan mode ──────────────────────────────

function flightAlts(primary: FlightSummary): FlightSummary[] {
  return [
    primary,
    {
      ...primary,
      carrier: 'Wizz Air',
      price: eur(Math.max(40, primary.price.amount - 30)),
      durationMinutes: primary.durationMinutes + 25,
    },
    {
      ...primary,
      carrier: 'Lufthansa',
      stops: primary.stops + 1,
      price: eur(primary.price.amount + 50),
      durationMinutes: primary.durationMinutes + 95,
    },
  ];
}

function stayAlts(primary: StaySummary, destId: string): StaySummary[] {
  return [
    primary,
    {
      ...primary,
      name: 'Seafront Apartments',
      type: 'apartment',
      rating: 4.3,
      pricePerNight: eur(Math.round(primary.pricePerNight.amount * 0.7)),
      image: img(`${destId}-stay2`),
    },
    {
      ...primary,
      name: 'Harbour Villa',
      type: 'villa',
      rating: 4.8,
      pricePerNight: eur(Math.round(primary.pricePerNight.amount * 1.6)),
      image: img(`${destId}-stay3`),
    },
  ];
}

export const flightsByDestination: Record<string, FlightSummary[]> = Object.fromEntries(
  destinations.map((d) => [d.id, flightAlts(primaryFlights[d.id])]),
);

export const staysByDestination: Record<string, StaySummary[]> = Object.fromEntries(
  destinations.map((d) => [d.id, stayAlts(primaryStays[d.id], d.id)]),
);

export const activitiesByDestination: Record<string, Activity[]> = Object.fromEntries(
  destinations.map((d) => [d.id, detailExtras[d.id].activities]),
);

// ── full trip details ─────────────────────────────────────────────────────────

export const tripDetailsById: Record<string, TripDetail> = Object.fromEntries(
  tripIdeas.map((idea) => {
    const extra = detailExtras[idea.id];
    const detail: TripDetail = {
      ...idea,
      itinerary: extra.itinerary,
      activities: extra.activities,
      weather: extra.weather,
      gettingAround: extra.gettingAround,
    };
    return [idea.id, detail];
  }),
);

export { ideaById };
