import type { HotelOption } from '@/lib/tura/types';

/**
 * Hotel data source. A real implementation would be a Booking/Hotelbeds
 * affiliate API. Returns several options; the engine picks the cheapest
 * "good" one itself.
 */
export interface HotelProvider {
  search(destCode: string, checkIn: string, nights: number): HotelOption[];
}
