import type { SavedService, TripService } from './types';
import { mockTripService } from './tripService';
import { liveTripService } from './tura';
import { mockSavedService } from './savedService';

const source = process.env.NEXT_PUBLIC_DATA_SOURCE === 'live' ? 'live' : 'mock';

/** Active trip service, chosen by NEXT_PUBLIC_DATA_SOURCE (mock | live).
 * "live" routes Discover through a friend's `tura` route-finding engine
 * (see src/services/tura.ts) — manual planning and trip detail stay on
 * mock content until tura grows those features. */
export const tripService: TripService = source === 'live' ? liveTripService : mockTripService;

/** Saved trips stay local until the backend table exists. */
export const savedService: SavedService = mockSavedService;

export const dataSource = source;
