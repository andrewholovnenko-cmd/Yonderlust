'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import createGlobe from 'cobe';
import { X } from 'lucide-react';
import { Photo } from '@/components/ui/Photo';
import { cn, formatMoney } from '@/lib/utils';

interface GlobePoint {
  id: string;
  city: string;
  country: string;
  price: number | null;
  image: string;
  location: [number, number]; // [lat, lng]
}

// Real destinations (curated + whatever users have discovered via search so
// far), fetched from /api/destinations/globe — see that route and
// src/lib/tura/discovery.ts. Replaces the old hardcoded mock points, which
// pointed at trip ids ('kotor', 'naxos', ...) that never existed in the
// actual search engine.
const FALLBACK_POINTS: GlobePoint[] = [];

const INLINE_MAX_PX = 720; // 1.5x the previous 480px inline cap
// 1.3x the previous focused box — markers that sit close together on the
// sphere end up farther apart in screen pixels, so the smaller one behind
// is still individually clickable instead of being swallowed by its neighbor.
const FOCUSED_VW = 1.0;
const FOCUSED_VH = 0.91; // also cap by viewport height so it never overflows on short screens
const FOCUSED_MAX_PX = 1404; // 1.3x the previous 1080px focused cap
const FOCUSED_SIZE_CSS = `min(${FOCUSED_VW * 100}vw, ${FOCUSED_VH * 100}vh, ${FOCUSED_MAX_PX}px)`;
const ROTATE_PAUSE_MS = 10_000;
// Initial tilt, and what it resets to when leaving focused mode. While
// focused, vertical drag adjusts this live (see `thetaRef`).
const BASE_THETA = 0.25;
const THETA_MIN = -1.3;
const THETA_MAX = 1.3;
// Matches cobe's own marker radius (its internal 0.8 surface constant plus
// the default 0.05 markerElevation), so our DOM pins land exactly on the
// surface the WebGL globe renders, not floating above/below it.
const MARKER_RADIUS = 0.85;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function focusedSizeNow(): number {
  if (typeof window === 'undefined') return FOCUSED_MAX_PX;
  return Math.min(window.innerWidth * FOCUSED_VW, window.innerHeight * FOCUSED_VH, FOCUSED_MAX_PX);
}

/** Re-implements cobe's own lat/lng -> rotated screen-space projection (read
 * out of its source) so the HTML marker pins line up with where the WebGL
 * globe is actually rendering each point, frame by frame. Assumes a square
 * canvas, camera scale 1, and no offset — all true here. */
function projectMarker(lat: number, lng: number, phi: number, theta: number) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);
  const x = -cosLat * Math.cos(lngRad) * MARKER_RADIUS;
  const y = Math.sin(latRad) * MARKER_RADIUS;
  const z = cosLat * Math.sin(lngRad) * MARKER_RADIUS;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const c = cosP * x + sinP * z;
  const s = sinP * sinT * x + cosT * y - cosP * sinT * z;
  // How far toward the viewer this point sits (same quantity used for the
  // front/back visibility test). When two pins land close together on
  // screen, the one with the larger depth is physically nearer the camera
  // and should win clicks/hover, instead of whichever happens to be later
  // in the marker list.
  const depth = -sinP * cosT * x + sinT * y + cosP * cosT * z;
  return { nx: (c + 1) / 2, ny: (-s + 1) / 2, front: depth >= 0, depth };
}

// Minimum on-screen gap (px) kept between two pin centers. Two destinations
// that sit close together on the actual sphere can land within a few pixels
// of each other on screen — small enough that one pin's hit area completely
// swallows the other's, making it physically impossible to click. Nudging
// overlapping pairs apart (a few quick relaxation passes, like force-directed
// label placement) keeps every pin individually clickable without otherwise
// touching pins that already have room.
const MIN_PIN_GAP = 26;

function declutterPins(pos: { x: number; y: number; front: boolean }[]) {
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < pos.length; i++) {
      if (!pos[i].front) continue;
      for (let j = i + 1; j < pos.length; j++) {
        if (!pos[j].front) continue;
        const a = pos[i];
        const b = pos[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist >= MIN_PIN_GAP) continue;
        if (dist < 0.001) {
          // Exactly coincident — nudge along a deterministic direction based
          // on index so they don't fight over the same spot every frame.
          const angle = (i * 47 + j * 19) % 360;
          dx = Math.cos((angle * Math.PI) / 180);
          dy = Math.sin((angle * Math.PI) / 180);
          dist = 1;
        }
        const push = (MIN_PIN_GAP - dist) / 2;
        const ux = (dx / dist) * push;
        const uy = (dy / dist) * push;
        a.x -= ux;
        a.y -= uy;
        b.x += ux;
        b.y += uy;
      }
    }
  }
  return pos;
}

// Small, muted dots for the rest of the globe; the active destination gets a
// noticeably bigger, brighter marker so the highlight reads clearly at a glance.
function markersFor(active: number, points: GlobePoint[]) {
  return points.map((p, i) => {
    const isActive = i === active;
    return {
      location: p.location,
      size: isActive ? 0.085 : 0.028,
      color: (isActive ? [0.66, 0.98, 0.9] : [0.3, 0.58, 0.53]) as [number, number, number],
    };
  });
}

interface CobeGlobeProps {
  points: GlobePoint[];
  activeIndex: number;
  interactive: boolean;
  /** CSS px the canvas is currently displayed at — only changes at discrete
   * moments (focus toggle settled, real viewport resize), never per animation
   * frame, so the WebGL backing buffer isn't reallocated while the globe is
   * mid-transition. That per-frame reallocation was the source of the lag. */
  bufferSize: number;
  /** Navigate away from the globe — wired to the marker pins, only relevant
   * once focused (the pins don't render in inline mode). */
  onSelect: () => void;
}

/** A self-contained spinning cobe planet. A single instance is reused for both
 * the inline and focused layouts — Framer Motion's layout animation handles
 * the smooth move-and-grow between them while this canvas just visually
 * scales via CSS during the transition. */
function CobeGlobe({ points, activeIndex, interactive, bufferSize, onSelect }: CobeGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(BASE_THETA);
  const sizeRef = useRef(bufferSize); // settled layout size (CSS px)
  const draggingRef = useRef<{ x: number; y: number } | null>(null);
  const pauseUntilRef = useRef(0); // epoch ms; auto-rotate paused until this time (focused mode only)
  const activeRef = useRef(activeIndex);
  const interactiveRef = useRef(interactive);
  const pointsRef = useRef(points);
  const cursorRef = useRef<HTMLCanvasElement | null>(null);
  const markerWrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markerDotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);
  useEffect(() => {
    sizeRef.current = bufferSize;
  }, [bufferSize]);
  useEffect(() => {
    interactiveRef.current = interactive;
    if (!interactive) {
      // Leaving focused mode: reset tilt and any pending rotate-pause so the
      // small inline globe always spins freely, unaffected by prior dragging.
      thetaRef.current = BASE_THETA;
      pauseUntilRef.current = 0;
    }
    if (cursorRef.current) {
      cursorRef.current.style.cursor = interactive ? 'grab' : 'pointer';
    }
  }, [interactive]);

  // cobe mutates the DOM on mount — it inserts its own wrapper <div> around
  // the canvas and moves the canvas inside it, and never undoes that on
  // destroy(). If React tracked the <canvas> as a JSX child, its later
  // removeChild call (StrictMode's dev double-invoke, or a real unmount)
  // throws because the canvas's actual parent silently changed underneath
  // it. So the canvas is created and torn down imperatively here, fully
  // outside React's reconciliation — cleanup uses `canvas.remove()`, which
  // removes it from whatever its real parent is, instead of a `removeChild`
  // call that assumes a parent React no longer controls.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'size-full opacity-0 transition-opacity duration-500';
    canvas.style.cursor = interactiveRef.current ? 'grab' : 'pointer';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);
    cursorRef.current = canvas;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: sizeRef.current * dpr,
      height: sizeRef.current * dpr,
      phi: 0,
      theta: BASE_THETA,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 14000,
      mapBrightness: 4.2,
      baseColor: [0.09, 0.2, 0.18],
      markerColor: [0.36, 0.85, 0.75],
      glowColor: [0.12, 0.32, 0.3],
      markers: markersFor(activeRef.current, pointsRef.current),
      scale: 1,
    });

    let raf = 0;
    const tick = () => {
      const now = Date.now();
      const shouldSpin = draggingRef.current === null && (!interactiveRef.current || now >= pauseUntilRef.current);
      if (shouldSpin) phiRef.current += 0.004;

      const size = sizeRef.current;

      globe.update({
        phi: phiRef.current,
        theta: thetaRef.current,
        width: size * dpr,
        height: size * dpr,
        scale: 1,
        // While focused, the WebGL dots are hidden in favour of the
        // hoverable/clickable DOM pins positioned below; inline mode keeps
        // the small cycling-highlight dots as before.
        markers: interactiveRef.current ? [] : markersFor(activeRef.current, pointsRef.current),
      });

      if (interactiveRef.current) {
        const projected = pointsRef.current.map((p) => {
          const { nx, ny, front, depth } = projectMarker(p.location[0], p.location[1], phiRef.current, thetaRef.current);
          return { x: nx * size, y: ny * size, front, depth };
        });
        declutterPins(projected);
        projected.forEach(({ x, y, front, depth }, i) => {
          const wrap = markerWrapRefs.current[i];
          if (!wrap) return;
          wrap.style.transform = `translate(${x}px, ${y}px)`;
          wrap.style.opacity = front ? '1' : '0';
          wrap.style.pointerEvents = front ? 'auto' : 'none';
          // When two pins still overlap after decluttering, the one
          // physically nearer the camera should receive the click — not
          // whichever happens to be later in the DOM.
          wrap.style.zIndex = String(Math.round(depth * 1000));
        });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const reveal = window.setTimeout(() => {
      canvas.style.opacity = '1';
    }, 120);

    // Pointer capture keeps drag events routed to the canvas even once the
    // cursor leaves its bounds, so spinning past the planet's edge doesn't
    // drop the drag (and doesn't let a stray "click" reach anything behind
    // it). Native listeners (rather than JSX props) since the canvas itself
    // is created imperatively above.
    const onPointerDown = (e: PointerEvent) => {
      if (!interactiveRef.current) return;
      draggingRef.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!interactiveRef.current) return;
      draggingRef.current = null;
      // Stay paused for at least 10s after the user lets go of a manual spin.
      pauseUntilRef.current = Date.now() + ROTATE_PAUSE_MS;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      canvas.style.cursor = 'grab';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!interactiveRef.current || draggingRef.current === null) return;
      const dx = e.clientX - draggingRef.current.x;
      const dy = e.clientY - draggingRef.current.y;
      draggingRef.current = { x: e.clientX, y: e.clientY };
      phiRef.current += dx * 0.005;
      thetaRef.current = clamp(thetaRef.current + dy * 0.005, THETA_MIN, THETA_MAX);
    };
    const onClickCapture = (e: MouseEvent) => {
      // Swallow any trailing click after a drag so it can't trigger handlers
      // on elements layered behind/around the canvas.
      if (interactiveRef.current) e.stopPropagation();
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('click', onClickCapture, { capture: true });

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.clearTimeout(reveal);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('click', onClickCapture, { capture: true });
      canvas.remove();
      cursorRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="relative size-full" style={{ contain: 'layout paint size' }}>
      {interactive && (
        <div className="pointer-events-none absolute inset-0">
          {points.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => {
                markerWrapRefs.current[i] = el;
              }}
              className="absolute left-0 top-0"
            >
              {/* Position (translate) is driven imperatively every frame above;
                  this inner element only handles the static centering offset
                  so it doesn't fight the per-frame transform. */}
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="group block p-0.5"
                  aria-label={`${p.city}, ${p.country}${p.price ? ` — from ${formatMoney(p.price)}` : ''}`}
                >
                  <span
                    ref={(el) => {
                      markerDotRefs.current[i] = el;
                    }}
                    className="block size-2.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(255,255,255,0.3)] transition-shadow group-hover:shadow-[0_0_0_4px_rgba(255,255,255,0.5)]"
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-40 -translate-x-1/2 scale-90 rounded-xl border border-line bg-surface/95 p-2 text-left opacity-0 shadow-lift backdrop-blur transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                    <Photo src={p.image} alt={p.city} className="aspect-[4/3] w-full rounded-lg" sizes="160px" />
                    <p className="mt-1.5 font-serif text-sm leading-tight text-ink">{p.city}</p>
                    <p className="text-[11px] text-ink-3">{p.country}</p>
                    {p.price != null && (
                      <p className="text-xs font-medium text-accent">from {formatMoney(p.price)}</p>
                    )}
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroGlobe() {
  const router = useRouter();
  const [points, setPoints] = useState<GlobePoint[]>(FALLBACK_POINTS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [bufferSize, setBufferSize] = useState(INLINE_MAX_PX);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/destinations/globe')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { points?: GlobePoint[] } | null) => {
        if (!cancelled && data?.points?.length) setPoints(data.points);
      })
      .catch(() => {
        // Stay on FALLBACK_POINTS (empty) — the globe just renders bare,
        // never fabricated destinations.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track the inline placeholder's real rendered size. This element never
  // resizes during the focus transition (it's a static layout placeholder),
  // so this only fires on genuine responsive breakpoint changes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      if (!focusedRef.current) setBufferSize(el.getBoundingClientRect().width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!focusedRef.current && points.length) setActiveIndex((a) => (a + 1) % points.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [points.length]);

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused]);

  // There's no standalone page for a single destination outside of an actual
  // search result (tura's trip ids are generated per-search, e.g.
  // 'tura-bcn-2026-08-01' — not a fixed per-city id) so a globe pin opens the
  // "where should I go" planner rather than a dead /trip/<city-code> link.
  const go = useCallback(() => {
    setFocused(false);
    router.push('/discover');
  }, [router]);

  // Bump the WebGL buffer resolution only once the move/grow (or shrink)
  // animation has actually settled — never mid-flight. During the transition
  // the canvas just scales visually via CSS, which is cheap; this is what
  // eliminates the lag that used to come from resizing the buffer every frame.
  const onLayoutAnimationComplete = useCallback(() => {
    if (focusedRef.current) {
      setBufferSize(focusedSizeNow());
    } else {
      const el = containerRef.current;
      if (el) setBufferSize(el.getBoundingClientRect().width);
    }
  }, []);

  const active = points[activeIndex] ?? null;

  return (
    // Fixed-size placeholder so the page layout never jumps: the globe itself
    // escapes to `position: fixed` when focused, but this box keeps reserving
    // its inline footprint in the hero grid.
    <div ref={containerRef} className="relative mx-auto aspect-square w-full max-w-[720px]">
      <AnimatePresence>
        {focused && (
          <motion.div
            className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setFocused(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        onLayoutAnimationComplete={onLayoutAnimationComplete}
        transition={{ type: 'spring', stiffness: 210, damping: 24, mass: 0.8 }}
        onClick={() => {
          if (!focused) setFocused(true);
        }}
        className={cn(focused ? 'fixed z-50 cursor-default' : 'absolute inset-0 z-40 cursor-pointer')}
        // Centering via calc(), not a translate utility: Framer's `layout`
        // prop owns the `transform` property for the FLIP animation, so any
        // transform-based centering trick here would fight it and the globe
        // would never visually land in the middle of the screen.
        style={
          focused
            ? {
                width: FOCUSED_SIZE_CSS,
                height: FOCUSED_SIZE_CSS,
                left: `calc(50% - (${FOCUSED_SIZE_CSS} / 2))`,
                top: `calc(50vh - (${FOCUSED_SIZE_CSS} / 2))`,
              }
            : undefined
        }
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10 scale-90 rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle at center, rgb(var(--color-accent)/0.18), transparent 62%)',
          }}
        />
        <CobeGlobe points={points} activeIndex={activeIndex} interactive={focused} bufferSize={bufferSize} onSelect={go} />

        {/* cycling destination card — only while inline; the focused chip menu replaces it */}
        <AnimatePresence mode="wait">
          {!focused && active && (
            <motion.button
              key={active.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go();
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-2 left-0 flex items-center gap-3 rounded-2xl border border-line bg-surface/90 p-2 pr-4 text-left shadow-lift backdrop-blur"
            >
              <Photo src={active.image} alt={active.city} className="size-12 shrink-0 rounded-xl" sizes="48px" />
              <span>
                <span className="block font-serif text-base leading-tight text-ink">{active.city}</span>
                <span className="block text-xs text-ink-3">{active.country}</span>
                {active.price != null && (
                  <span className="mt-0.5 block text-sm font-medium text-accent">
                    from {formatMoney(active.price)}
                  </span>
                )}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {!focused && (
        <span className="pointer-events-none absolute -bottom-2 right-0 text-xs text-ink-3">
          Tap the globe to explore
        </span>
      )}

      {/* destination picker — appears once the globe has settled in the centre */}
      <AnimatePresence>
        {focused && (
          <motion.div
            className="fixed inset-x-6 bottom-10 z-50 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            {points.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go()}
                className="inline-flex items-center gap-2 rounded-full border border-bg/20 bg-bg/10 py-1.5 pl-1.5 pr-4 text-bg backdrop-blur transition-colors hover:bg-bg/20"
              >
                <Photo src={p.image} alt={p.city} className="size-7 shrink-0 rounded-full" sizes="28px" />
                <span className="text-sm font-medium">{p.city}</span>
                {p.price != null && <span className="text-sm text-bg/70">{formatMoney(p.price)}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {focused && (
          <motion.p
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 text-sm text-bg/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Drag to spin, up/down to tilt · hover a pin for details
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {focused && (
          <motion.button
            type="button"
            onClick={() => setFocused(false)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            className="fixed right-6 top-6 z-50 grid size-10 place-items-center rounded-full bg-surface/90 text-ink shadow-soft backdrop-blur transition-colors hover:bg-surface"
            aria-label="Close"
          >
            <X className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
