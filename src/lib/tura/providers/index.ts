import type { TransportProvider } from '@/lib/tura/providers/transport';
import type { HotelProvider } from '@/lib/tura/providers/hotels';
import { travelpayoutsTransport } from '@/lib/tura/providers/travelpayoutsTransport';
import { hotellookHotels } from '@/lib/tura/providers/hotellookHotels';

export interface Providers {
  transport: TransportProvider;
  hotels: HotelProvider;
}

// Real providers only — no mock fallback. Without TRAVELPAYOUTS_TOKEN set,
// searchAir/hotel search just return null/[] and a destination quietly
// drops out of results (handled in engine/search.ts), rather than the
// engine ever inventing fake prices again.
export function getProviders(): Providers {
  return { transport: travelpayoutsTransport, hotels: hotellookHotels };
}
