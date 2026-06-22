// ── Yonderlust API contract ────────────────────────────────────────────────
// Single source of truth shared between the frontend and the (future) backend.
// Both service implementations (mock + api) satisfy the interfaces at the bottom.
// When the backend is ready, only the `api` implementation changes — not the UI.

export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

export interface Money {
  /** Integer major units, no cents (e.g. 1240 = €1,240). */
  amount: number;
  currency: CurrencyCode;
}

export type VibeId =
  | 'beach'
  | 'relax'
  | 'culture'
  | 'food'
  | 'nature'
  | 'nightlife'
  | 'romantic'
  | 'adventure'
  | 'city'
  | 'budget';

export interface Vibe {
  id: VibeId;
  label: string;
  description: string;
}

export interface DateRange {
  /** ISO date, YYYY-MM-DD. */
  start: string;
  /** ISO date, YYYY-MM-DD. */
  end: string;
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  /** Human region label, e.g. "Adriatic coast". */
  region: string;
  blurb: string;
  image: string;
  tags: VibeId[];
  airportCode?: string;
}

export type StayType = 'hotel' | 'boutique' | 'apartment' | 'villa' | 'resort';

export interface StaySummary {
  name: string;
  type: StayType;
  area: string;
  /** 0..5. */
  rating: number;
  pricePerNight: Money;
  image: string;
}

export type TransportMode = 'flight' | 'bus' | 'train';

export interface TransportLegSummary {
  mode: TransportMode;
  fromCity: string;
  toCity: string;
  carrier: string;
  durationMinutes: number;
}

export interface FlightSummary {
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  carrier: string;
  /** One-way duration in minutes. */
  durationMinutes: number;
  stops: number;
  /** Round trip, per person. */
  price: Money;
  /** Outbound leg breakdown, e.g. [bus, flight] for a multimodal route.
   * Omitted for plain mock data, which is always a single direct flight. */
  legs?: TransportLegSummary[];
}

export interface CostBreakdown {
  /** All amounts are totals for the whole party. */
  flights: Money;
  stay: Money;
  activities: Money;
  food: Money;
  total: Money;
}

export type ActivityCategory =
  | 'sight'
  | 'food'
  | 'nature'
  | 'water'
  | 'nightlife'
  | 'wellness'
  | 'culture';

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  durationHours: number;
  /** null = free. */
  price: Money | null;
  image?: string;
}

export type ItineraryItemKind = 'flight' | 'stay' | 'activity' | 'food' | 'transport' | 'free';

export interface ItineraryItem {
  /** "09:30" */
  time?: string;
  title: string;
  description?: string;
  kind: ItineraryItemKind;
}

export interface ItineraryDay {
  /** 1-based day index. */
  day: number;
  date?: string;
  title: string;
  items: ItineraryItem[];
}

export interface WeatherSummary {
  season: string;
  avgHighC: number;
  avgLowC: number;
  note: string;
}

/** Ranked trip suggestion returned by Discover. */
export interface TripIdea {
  id: string;
  destination: Destination;
  /** Editorial headline, e.g. "Slow Adriatic days under stone roofs". */
  title: string;
  summary: string;
  /** 0..100. */
  matchScore: number;
  /** Plain-language reasons this fits the query. */
  matchReasons: string[];
  dates: DateRange;
  nights: number;
  travelers: number;
  flights: FlightSummary;
  stay: StaySummary;
  highlights: string[];
  cost: CostBreakdown;
  images: string[];
  bestFor: VibeId[];
}

/** Full detail for a single trip idea. */
export interface TripDetail extends TripIdea {
  itinerary: ItineraryDay[];
  activities: Activity[];
  weather: WeatherSummary;
  gettingAround: string;
}

// ── Inputs ─────────────────────────────────────────────────────────────────

export interface DiscoverQuery {
  /** City name or IATA, free text from the user. */
  origin: string;
  originCode?: string;
  /** Total trip budget for the whole party. */
  budget: Money;
  dates: DateRange;
  datesFlexible: boolean;
  travelers: number;
  vibes: VibeId[];
  notes?: string;
}

export interface PlanSelection {
  destinationId: string;
  dates: DateRange;
  travelers: number;
  flight: FlightSummary | null;
  stay: StaySummary | null;
  activityIds: string[];
}

// ── Saved trips ──────────────────────────────────────────────────────────────

export interface SavedTrip {
  id: string;
  /** ISO datetime. */
  savedAt: string;
  idea: TripIdea;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

// ── Service interfaces ───────────────────────────────────────────────────────

export interface TripService {
  /** AI Discover: turn constraints + taste into ranked trip ideas. */
  discoverTrips(query: DiscoverQuery): Promise<TripIdea[]>;
  /** Full detail for a single idea (itinerary, activities, weather). */
  getTripById(id: string): Promise<TripDetail | null>;
  /** Curated destinations (landing strip + manual Plan picker). */
  listDestinations(): Promise<Destination[]>;
  /** A few sample ideas for the landing page strip. */
  getSampleIdeas(): Promise<TripIdea[]>;
  /** Manual Plan building blocks for a destination. */
  getStays(destinationId: string): Promise<StaySummary[]>;
  getActivities(destinationId: string): Promise<Activity[]>;
  getFlights(origin: string, destinationId: string): Promise<FlightSummary[]>;
}

export interface SavedService {
  list(userId: string): Promise<SavedTrip[]>;
  add(userId: string, idea: TripIdea): Promise<SavedTrip>;
  remove(userId: string, savedId: string): Promise<void>;
  isSaved(userId: string, tripId: string): Promise<boolean>;
}
