// Core types for the `tura` route-finding engine (vendored from a friend's
// project — see src/services/tura.ts for the adapter that maps this onto our
// own TripService contract). All money in EUR.

export type Vibe = 'beach' | 'city' | 'history' | 'nature' | 'party' | 'any';

export const VIBES: Exclude<Vibe, 'any'>[] = ['beach', 'city', 'history', 'nature', 'party'];

/** Inclusive ISO date range, YYYY-MM-DD. */
export interface DateWindow {
  from: string;
  to: string;
}

/** User's request. Direction is not specified here — it's the result. */
export interface SearchRequest {
  origin: string; // departure city/airport code, e.g. "BER"
  dateWindows: DateWindow[];
  durationDays: number;
  vibe: Vibe;
  budget: number; // for the whole group
  groupSize: number;
}

export interface Destination {
  code: string; // "BCN"
  city: string;
  country: string;
  vibes: Vibe[];
}

export type TransportMode = 'air' | 'bus' | 'train';

export interface TransportLeg {
  mode: TransportMode;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  pricePerPerson: number;
  durationMin: number;
  carrier: string;
  date: string;
}

/** One-way transport: 1 leg = direct, 2 legs = multimodal. */
export interface TransportOption {
  legs: TransportLeg[];
  pricePerPerson: number;
  totalDurationMin: number;
  isMultimodal: boolean;
  label: string;
}

export interface HotelOption {
  name: string;
  pricePerNight: number; // per double room, per night
  stars: number;
  rating: number; // 0..10
}

export interface Savings {
  naiveTotal: number;
  optimizedTotal: number;
  saved: number;
  percent: number;
}

export interface TripOption {
  destination: Destination;
  startDate: string;
  endDate: string;
  nights: number;
  groupSize: number;
  rooms: number;

  outbound: TransportOption;
  inbound: TransportOption;
  hotel: HotelOption | null; // null = day trip, no stay

  transportTotal: number;
  hotelTotal: number;
  total: number;
  perPerson: number;

  savings: Savings;
}

export interface SearchResponse {
  request: SearchRequest;
  options: TripOption[];
  generatedAt: string;
}
