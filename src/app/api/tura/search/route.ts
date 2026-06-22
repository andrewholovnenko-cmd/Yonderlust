import { NextResponse } from 'next/server';
import { search } from '@/lib/tura/engine/search';
import { validateSearchRequest } from '@/lib/tura/validate';

/**
 * The `tura` route-finding engine, vendored into this app (see src/lib/tura)
 * so it runs in-process — no separate server to deploy or keep alive.
 * Flight/hotel prices come from Travelpayouts (see
 * src/lib/tura/providers/travelpayoutsTransport.ts) — set TRAVELPAYOUTS_TOKEN
 * to enable. Without it, providers return no results rather than fake ones.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = validateSearchRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return NextResponse.json(await search(parsed.value));
}
