import { NextResponse } from 'next/server';
import { DESTINATIONS } from '@/lib/tura/data/destinations';
import { resolveCity } from '@/lib/tura/data/citiesIndex';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface GlobePoint {
  id: string;
  city: string;
  country: string;
  price: number | null;
  image: string;
  location: [number, number];
}

const placeholderImage = (seed: string) => `https://picsum.photos/seed/yl-${seed}/240/240`;

async function wikiImage(topic: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail?: { source: string }; originalimage?: { source: string } };
    const src = data.originalimage?.source ?? data.thumbnail?.source;
    return src ? src.replace(/\/\d+px-/, '/1280px-') : null;
  } catch {
    return null;
  }
}

async function imageFor(code: string, city: string): Promise<string> {
  return (await wikiImage(city)) ?? placeholderImage(code.toLowerCase());
}

/**
 * Feeds the homepage globe (src/components/HeroGlobe.tsx) with real
 * destinations instead of the old hardcoded mock points: the curated list
 * (resolved to real coordinates via Travelpayouts' cities.json) plus every
 * destination users have actually discovered via search so far (persisted
 * in Supabase by src/lib/tura/discovery.ts) — so the globe grows on its own
 * as people search, with no manual point-list maintenance.
 */
export async function GET() {
  const curated = await Promise.all(
    DESTINATIONS.map(async (d): Promise<GlobePoint | null> => {
      const city = await resolveCity(d.code);
      if (!city?.coordinates) return null;
      return {
        id: d.code,
        city: d.city,
        country: d.country,
        price: null,
        image: await imageFor(d.code, d.city),
        location: [city.coordinates.lat, city.coordinates.lon],
      };
    }),
  );

  let discovered: GlobePoint[] = [];
  const admin = supabaseAdmin();
  if (admin) {
    const { data } = await admin
      .from('discovered_destinations')
      .select('code, city, country, lat, lon, cheapest_price')
      .not('lat', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);
    discovered = await Promise.all(
      (data ?? []).map(async (row) => ({
        id: row.code as string,
        city: row.city as string,
        country: row.country as string,
        price: (row.cheapest_price as number | null) ?? null,
        image: await imageFor(row.code as string, row.city as string),
        location: [row.lat as number, row.lon as number] as [number, number],
      })),
    );
  }

  const points = [...curated.filter((p): p is GlobePoint => p !== null), ...discovered];
  return NextResponse.json({ points });
}
