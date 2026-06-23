import type { HotelProvider } from '@/lib/tura/providers/hotels';
import type { HotelOption } from '@/lib/tura/types';

// ---------------------------------------------------------------------------
// Real hotel prices via Xotelo (data.xotelo.com) — no signup, no token, no
// approval. It aggregates live OTA rates (Booking.com, Agoda, Trip.com, ...)
// keyed by TripAdvisor location ids. We use /list, which returns each
// hotel's name, guest rating and a real "from" nightly price range — not an
// exact-date quote (that needs a per-hotel /rates call we skip to keep call
// volume low), the same real-but-aggregated trade-off already accepted for
// flight prices via Travelpayouts.
// ---------------------------------------------------------------------------

const XOTELO_BASE = 'https://data.xotelo.com/api';

// TripAdvisor geo location ids for the fixed set of destinations this app
// searches (see data/destinations.ts) — verified against live API responses.
const LOCATION_KEY: Record<string, string> = {
  BCN: 'g187497',
  LIS: 'g189158',
  ATH: 'g189400',
  FCO: 'g187791',
  PMI: 'g187463',
  SPU: 'g295370',
  BUD: 'g274887',
  PRG: 'g274707',
  NAP: 'g187785',
  VLC: 'g187529',
  OPO: 'g189180',
  CTA: 'g187888',
  KRK: 'g274772',
  TIA: 'g294446',
  SOF: 'g294452',
  TGD: 'g304088',
  CDG: 'g187147',
  BGY: 'g187849',
  VCE: 'g187870',
  FLR: 'g187895',
  BLQ: 'g187789',
  MAD: 'g187514',
  SVQ: 'g187443',
  AGP: 'g187438',
  BIO: 'g187454',
  AMS: 'g188590',
  BRU: 'g188644',
  BER: 'g187323',
  HAM: 'g187331',
  CGN: 'g187371',
  MUC: 'g187309',
  ZRH: 'g188113',
  GVA: 'g188057',
  DUB: 'g186605',
  EDI: 'g186525',
  LON: 'g186338',
  VIE: 'g190454',
  ARN: 'g189852',
  CPH: 'g189541',
  NCE: 'g187234',
  TFS: 'g187479',
  FAO: 'g189116',
  DBV: 'g295371',
  ZAD: 'g295374',
  RHO: 'g635613',
  CFU: 'g662629',
  HER: 'g189417',
  CHQ: 'g189415',
  JMK: 'g662620',
  JTR: 'g482942',
  IBZ: 'g664638',
  ACE: 'g187478',
  LPA: 'g187472',
  AYT: 'g297962',
  PFO: 'g190384',
  CAG: 'g187881',
  PMO: 'g187890',
  BRI: 'g187874',
  OLB: 'g187883',
};

interface XoteloHotel {
  name: string;
  accommodation_type?: string;
  review_summary?: { rating?: number; count?: number };
  price_ranges?: { minimum?: number; maximum?: number } | null;
}

interface XoteloListResponse {
  error: unknown;
  result?: { list?: XoteloHotel[] };
}

const cache = new Map<string, Promise<HotelOption[]>>();

async function fetchHotelList(destCode: string): Promise<HotelOption[]> {
  const code = destCode.toUpperCase();
  const locationKey = LOCATION_KEY[code];
  if (!locationKey) return [];

  const cached = cache.get(code);
  if (cached) return cached;

  const promise = (async (): Promise<HotelOption[]> => {
    try {
      const url = `${XOTELO_BASE}/list?${new URLSearchParams({
        location_key: locationKey,
        limit: '15',
      })}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as XoteloListResponse;
      const list = data.result?.list;
      if (!Array.isArray(list)) return [];

      return list
        .filter((h) => typeof h.price_ranges?.minimum === 'number')
        .map(
          (h): HotelOption => ({
            name: h.name,
            pricePerNight: Math.round(h.price_ranges!.minimum!),
            stars: 3,
            rating: Math.round((h.review_summary?.rating ?? 4) * 2 * 10) / 10,
          }),
        );
    } catch {
      return [];
    }
  })();

  cache.set(code, promise);
  return promise;
}

export const xoteloHotels: HotelProvider = {
  async search(destCode, _checkIn, nights): Promise<HotelOption[]> {
    if (nights <= 0) return [];
    return fetchHotelList(destCode);
  },
};
