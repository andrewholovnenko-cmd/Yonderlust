import type { SavedService, TripService } from './types';
import { apiTripService, mockTripService } from './tripService';
import { mockSavedService } from './savedService';

const source = process.env.NEXT_PUBLIC_DATA_SOURCE === 'live' ? 'live' : 'mock';

/** Active trip service, chosen by NEXT_PUBLIC_DATA_SOURCE (mock | live). */
export const tripService: TripService = source === 'live' ? apiTripService : mockTripService;

/** Saved trips stay local until the backend table exists. */
export const savedService: SavedService = mockSavedService;

export const dataSource = source;
