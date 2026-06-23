// Aviasales/Travelpayouts deep-link booking. Real checkout (payment,
// inventory, ticketing) happens on Aviasales — we only redirect with our
// affiliate marker so a completed booking earns commission. Set
// NEXT_PUBLIC_TRAVELPAYOUTS_MARKER (from your Travelpayouts dashboard,
// Tools -> Affiliate links) to get paid; without it the link still works,
// just unattributed.
function ddmm(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function aviasalesBookingUrl(params: {
  fromCode: string;
  toCode: string;
  startDate: string;
  endDate: string;
  travelers: number;
}): string {
  const passengers = Math.max(1, Math.min(9, Math.round(params.travelers)));
  const segment = `${params.fromCode.toUpperCase()}${ddmm(params.startDate)}${params.toCode.toUpperCase()}${ddmm(params.endDate)}${passengers}`;
  const qs = new URLSearchParams({ currency: 'eur' });
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER;
  if (marker) qs.set('marker', marker);
  return `https://www.aviasales.com/search/${segment}?${qs.toString()}`;
}
