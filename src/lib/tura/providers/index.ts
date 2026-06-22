import type { TransportProvider } from '@/lib/tura/providers/transport';
import type { HotelProvider } from '@/lib/tura/providers/hotels';
import { mockTransport } from '@/lib/tura/providers/mockTransport';
import { mockHotels } from '@/lib/tura/providers/mockHotels';
import { kiwiTransport } from '@/lib/tura/providers/kiwiTransport';

export interface Providers {
  transport: TransportProvider;
  hotels: HotelProvider;
}

// Picks the data source from env. "real" wires in actual APIs where
// implemented, falling back to mocks for the rest (a hybrid).
export function getProviders(): Providers {
  const source = (process.env.DATA_SOURCE ?? 'mock').toLowerCase();

  if (source === 'real') {
    return {
      // Real flight provider if a Kiwi key is set; mock otherwise.
      transport: kiwiTransport.isConfigured() ? kiwiTransport : mockTransport,
      // No real hotel API wired in yet — mock.
      hotels: mockHotels,
    };
  }

  return { transport: mockTransport, hotels: mockHotels };
}
