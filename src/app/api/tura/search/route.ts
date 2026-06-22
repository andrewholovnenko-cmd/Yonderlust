import { NextResponse } from 'next/server';

// Server-only — never exposed to the browser. Defaults to the friend's
// `tura` engine running locally; override in production once it's deployed.
const TURA_API_BASE_URL = process.env.TURA_API_BASE_URL ?? 'http://localhost:3001';

/**
 * Same-origin proxy to the `tura` search engine. The engine has no CORS
 * headers of its own, so the browser can't call it directly — this route
 * runs server-side (no CORS involved) and just forwards the request body.
 */
export async function POST(req: Request) {
  const body = await req.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${TURA_API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
  } catch {
    return NextResponse.json({ error: 'tura engine is unreachable' }, { status: 502 });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
}
