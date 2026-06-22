import type {
  CostBreakdown,
  DiscoverQuery,
  Money,
  TripIdea,
  TripService,
} from './types';
import {
  activityListSchema,
  destinationListSchema,
  flightSummaryListSchema,
  staySummaryListSchema,
  tripDetailSchema,
  tripIdeaListSchema,
} from './schemas';
import {
  activitiesByDestination,
  destinations,
  flightsByDestination,
  staysByDestination,
  tripDetailsById,
  tripIdeas,
} from '@/mocks/data';
import { mockLatency, nightsBetween } from '@/lib/utils';
import { vibeLabel } from '@/lib/vibes';

// ── mock implementation ──────────────────────────────────────────────────────

const eur = (amount: number): Money => ({ amount, currency: 'EUR' });

/** Roughly scale a 2-person plan to the requested party size. */
function scaleCostToTravelers(idea: TripIdea, travelers: number): CostBreakdown {
  const base = idea.travelers || 2;
  const ratio = travelers / base;
  const flights = Math.round(idea.cost.flights.amount * ratio);
  const food = Math.round(idea.cost.food.amount * ratio);
  const stay = idea.cost.stay.amount; // same room
  const activities = Math.round(idea.cost.activities.amount * (0.6 + 0.4 * ratio));
  return {
    flights: eur(flights),
    stay: eur(stay),
    activities: eur(activities),
    food: eur(food),
    total: eur(flights + stay + activities + food),
  };
}

/** Heuristic ranking so Discover results reflect the user's query. */
function scoreIdea(
  idea: TripIdea,
  query: DiscoverQuery,
  scaledTotal: number,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 55;

  const overlap = idea.bestFor.filter((v) => query.vibes.includes(v));
  score += overlap.length * 11;
  if (overlap.length > 0) {
    const list = overlap.map(vibeLabel).join(', ').toLowerCase();
    reasons.push(`Fits your taste for ${list}`);
  }

  if (query.budget.amount > 0) {
    if (scaledTotal <= query.budget.amount) {
      score += 16;
      reasons.push('Comfortably within your budget');
    } else if (scaledTotal <= query.budget.amount * 1.15) {
      score += 6;
      reasons.push('Right around your budget');
    } else {
      score -= 14;
      reasons.push('A stretch on your budget');
    }
  }

  const windowNights = nightsBetween(query.dates.start, query.dates.end);
  if (windowNights > 0 && idea.nights <= windowNights) {
    score += 8;
  }

  if (idea.flights.durationMinutes <= 130 && idea.flights.stops === 0) {
    score += 5;
    reasons.push('Short, direct flight');
  }

  score = Math.max(20, Math.min(99, score));
  if (reasons.length === 0) {
    reasons.push('A solid all-round option for your dates');
  }
  return { score, reasons: reasons.slice(0, 3) };
}

export const mockTripService: TripService = {
  async discoverTrips(query) {
    await mockLatency();
    const windowNights = nightsBetween(query.dates.start, query.dates.end);

    let pool = tripIdeas;
    if (!query.datesFlexible && windowNights > 0) {
      const fits = pool.filter((i) => i.nights <= windowNights);
      pool = fits.length > 0 ? fits : pool; // never return an empty board
    }

    const scored = pool.map((idea) => {
      const cost = scaleCostToTravelers(idea, query.travelers);
      const { score, reasons } = scoreIdea(idea, query, cost.total.amount);
      return {
        ...idea,
        travelers: query.travelers,
        matchScore: score,
        matchReasons: reasons,
        cost,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
  },

  async getTripById(id) {
    await mockLatency(400, 800);
    return tripDetailsById[id] ?? null;
  },

  async listDestinations() {
    await mockLatency(300, 600);
    return destinations;
  },

  async getSampleIdeas() {
    await mockLatency(300, 700);
    return tripIdeas.slice(0, 6);
  },

  async getStays(destinationId) {
    await mockLatency(400, 800);
    return staysByDestination[destinationId] ?? [];
  },

  async getActivities(destinationId) {
    await mockLatency(400, 800);
    return activitiesByDestination[destinationId] ?? [];
  },

  async getFlights(_origin, destinationId) {
    await mockLatency(400, 800);
    return flightsByDestination[destinationId] ?? [];
  },
};

// ── api implementation (env-gated, used when NEXT_PUBLIC_DATA_SOURCE=live) ─────

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function getJSON<T>(
  path: string,
  schema: { parse: (data: unknown) => T },
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with ${res.status}`);
  }
  return schema.parse(await res.json());
}

export const apiTripService: TripService = {
  discoverTrips: (query) =>
    getJSON('/discover', tripIdeaListSchema, {
      method: 'POST',
      body: JSON.stringify(query),
    }),
  getTripById: async (id) => {
    try {
      return await getJSON(`/trips/${id}`, tripDetailSchema);
    } catch {
      return null;
    }
  },
  listDestinations: () => getJSON('/destinations', destinationListSchema),
  getSampleIdeas: () => getJSON('/ideas/sample', tripIdeaListSchema),
  getStays: (destinationId) =>
    getJSON(`/destinations/${destinationId}/stays`, staySummaryListSchema),
  getActivities: (destinationId) =>
    getJSON(`/destinations/${destinationId}/activities`, activityListSchema),
  getFlights: (origin, destinationId) =>
    getJSON(
      `/destinations/${destinationId}/flights?origin=${encodeURIComponent(origin)}`,
      flightSummaryListSchema,
    ),
};
