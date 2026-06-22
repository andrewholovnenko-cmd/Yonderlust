import { NextResponse } from 'next/server';
import { search } from '@/lib/tura/engine/search';
import { validateSearchRequest } from '@/lib/tura/validate';

/**
 * The `tura` route-finding engine, vendored into this app (see src/lib/tura)
 * so it runs in-process — no separate server to deploy or keep alive.
 * Defaults to mock data; set DATA_SOURCE=real + KIWI_API_KEY once a real
 * flights key is available (see src/lib/tura/providers/kiwiTransport.ts).
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

  return NextResponse.json(search(parsed.value));
}
