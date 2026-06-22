import type { TransportProvider } from '@/lib/tura/providers/transport';
import type { HotelProvider } from '@/lib/tura/providers/hotels';
import { travelpayoutsTransport } from '@/lib/tura/providers/travelpayoutsTransport';
import { xoteloHotels } from '@/lib/tura/providers/xoteloHotels';

export interface Providers {
  transport: TransportProvider;
  hotels: HotelProvider;
}

// Real providers only — no mock fallback. Without TRAVELPAYOUTS_TOKEN set,
// searchAir just returns null and a destination quietly drops out of
// results (handled in engine/search.ts), rather than the engine ever
// inventing fake prices again. Hotel prices (Xotelo) need no token at all.
export function getProviders(): Providers {
  return { transport: travelpayoutsTransport, hotels: xoteloHotels };
}
