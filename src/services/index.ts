import type { SavedService, TripService } from './types';
import { liveTripService } from './tura';
import { mockSavedService } from './savedService';

/** Discover is routed through a friend's `tura` route-finding engine (see
 * src/services/tura.ts) for real flight/destination data — there is no mock
 * implementation left to fall back to. */
export const tripService: TripService = liveTripService;

/** Saved trips stay local until the backend table exists. */
export const savedService: SavedService = mockSavedService;
