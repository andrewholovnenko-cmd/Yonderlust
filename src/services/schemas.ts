import { z } from 'zod';

// Runtime validation schemas mirroring services/types.ts.
// The `api` service implementation parses backend responses through these so a
// contract mismatch fails loudly at the boundary instead of corrupting the UI.

export const currencySchema = z.enum(['EUR', 'USD', 'GBP']);

export const moneySchema = z.object({
  amount: z.number(),
  currency: currencySchema,
});

export const vibeIdSchema = z.enum([
  'beach',
  'relax',
  'culture',
  'food',
  'nature',
  'nightlife',
  'romantic',
  'adventure',
  'city',
  'budget',
]);

export const dateRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const destinationSchema = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  region: z.string(),
  blurb: z.string(),
  image: z.string(),
  tags: z.array(vibeIdSchema),
  airportCode: z.string().optional(),
});

export const stayTypeSchema = z.enum(['hotel', 'boutique', 'apartment', 'villa', 'resort']);

export const staySummarySchema = z.object({
  name: z.string(),
  type: stayTypeSchema,
  area: z.string(),
  rating: z.number(),
  pricePerNight: moneySchema,
  image: z.string(),
});

export const flightSummarySchema = z.object({
  fromCode: z.string(),
  toCode: z.string(),
  fromCity: z.string(),
  toCity: z.string(),
  carrier: z.string(),
  durationMinutes: z.number(),
  stops: z.number(),
  price: moneySchema,
});

export const costBreakdownSchema = z.object({
  flights: moneySchema,
  stay: moneySchema,
  activities: moneySchema,
  food: moneySchema,
  total: moneySchema,
});

export const activityCategorySchema = z.enum([
  'sight',
  'food',
  'nature',
  'water',
  'nightlife',
  'wellness',
  'culture',
]);

export const activitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: activityCategorySchema,
  durationHours: z.number(),
  price: moneySchema.nullable(),
  image: z.string().optional(),
});

export const itineraryItemKindSchema = z.enum([
  'flight',
  'stay',
  'activity',
  'food',
  'transport',
  'free',
]);

export const itineraryItemSchema = z.object({
  time: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  kind: itineraryItemKindSchema,
});

export const itineraryDaySchema = z.object({
  day: z.number(),
  date: z.string().optional(),
  title: z.string(),
  items: z.array(itineraryItemSchema),
});

export const weatherSummarySchema = z.object({
  season: z.string(),
  avgHighC: z.number(),
  avgLowC: z.number(),
  note: z.string(),
});

export const tripIdeaSchema = z.object({
  id: z.string(),
  destination: destinationSchema,
  title: z.string(),
  summary: z.string(),
  matchScore: z.number(),
  matchReasons: z.array(z.string()),
  dates: dateRangeSchema,
  nights: z.number(),
  travelers: z.number(),
  flights: flightSummarySchema,
  stay: staySummarySchema,
  highlights: z.array(z.string()),
  cost: costBreakdownSchema,
  images: z.array(z.string()),
  bestFor: z.array(vibeIdSchema),
});

export const tripDetailSchema = tripIdeaSchema.extend({
  itinerary: z.array(itineraryDaySchema),
  activities: z.array(activitySchema),
  weather: weatherSummarySchema,
  gettingAround: z.string(),
});

export const tripIdeaListSchema = z.array(tripIdeaSchema);
export const destinationListSchema = z.array(destinationSchema);
export const staySummaryListSchema = z.array(staySummarySchema);
export const activityListSchema = z.array(activitySchema);
export const flightSummaryListSchema = z.array(flightSummarySchema);
