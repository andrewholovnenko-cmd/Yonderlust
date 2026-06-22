import type { TransportLeg } from '@/lib/tura/types';
import { cityName } from '@/lib/tura/providers/cities';
import type { TransportProvider } from '@/lib/tura/providers/transport';

// ---------------------------------------------------------------------------
// STUB for the real Kiwi Tequila flight provider.
// Sign up: https://tequila.kiwi.com/  ->  get an API key  ->  KIWI_API_KEY.
// Docs: https://tequila.kiwi.com/portal/docs/tequila_api/search_api
//
// To enable: set DATA_SOURCE=real and KIWI_API_KEY in env, then implement
// the /v2/search request below.
// ---------------------------------------------------------------------------

interface KiwiProvider extends TransportProvider {
  isConfigured(): boolean;
}

const KIWI_BASE = 'https://api.tequila.kiwi.com';

export const kiwiTransport: KiwiProvider = {
  isConfigured() {
    return Boolean(process.env.KIWI_API_KEY);
  },

  searchAir(_fromCode, _toCode, _date): TransportLeg | null {
    // TODO: real request to Kiwi Tequila /v2/search.
    //
    // const res = await fetch(`${KIWI_BASE}/v2/search?` + new URLSearchParams({
    //   fly_from: fromCode, fly_to: toCode,
    //   date_from: toKiwiDate(date), date_to: toKiwiDate(date),
    //   curr: "EUR", limit: "1", sort: "price",
    // }), { headers: { apikey: process.env.KIWI_API_KEY! } });
    // const data = await res.json();
    // -> parse data.data[0] into a TransportLeg.
    //
    // Note: the interface is synchronous for the MVP mocks; once the real
    // API is wired in, make TransportProvider async (Promise<TransportLeg | null>)
    // and update the engine to await — that's the only engine change needed.
    void KIWI_BASE;
    void cityName;
    return null;
  },

  searchGround(_fromCode, _toCode, _date): TransportLeg | null {
    // Ground transit (bus/train) comes from Distribusion/Lyko, not Kiwi.
    // Implement as a separate provider following the same pattern.
    return null;
  },
};
