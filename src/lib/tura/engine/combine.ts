import type { TransportLeg, TransportOption } from '@/lib/tura/types';
import type { TransportProvider } from '@/lib/tura/providers/transport';
import { hubsForOrigin } from '@/lib/tura/data/destinations';

// Layover buffer (ground leg -> airport -> flight), minutes.
const LAYOVER_BUFFER_MIN = 120;

const MODE_LABEL: Record<string, string> = {
  bus: 'Автобус',
  train: 'Поезд',
  air: 'Перелёт',
};

function toOption(legs: TransportLeg[], label: string): TransportOption {
  const pricePerPerson = legs.reduce((s, l) => s + l.pricePerPerson, 0);
  const ride = legs.reduce((s, l) => s + l.durationMin, 0);
  const isMultimodal = legs.length > 1;
  return {
    legs,
    pricePerPerson,
    totalDurationMin: ride + (isMultimodal ? LAYOVER_BUFFER_MIN : 0),
    isMultimodal,
    label,
  };
}

/**
 * All one-way transport options between home and away.
 * direction "out": home -> away; "back": away -> home.
 * Multimodal routes go through ground hubs near home (lowcost bases).
 */
export async function transportOptions(
  home: string,
  away: string,
  date: string,
  provider: TransportProvider,
  direction: 'out' | 'back',
): Promise<TransportOption[]> {
  const options: TransportOption[] = [];

  const directFrom = direction === 'out' ? home : away;
  const directTo = direction === 'out' ? away : home;
  const direct = await provider.searchAir(directFrom, directTo, date);
  if (direct) options.push(toOption([direct], 'Прямой перелёт'));

  const hubResults = await Promise.all(
    hubsForOrigin(home)
      .filter((hub) => hub.code !== away.toUpperCase())
      .map(async (hub) => {
        let legs: (TransportLeg | null)[];
        if (direction === 'out') {
          legs = await Promise.all([
            provider.searchGround(home, hub.code, date),
            provider.searchAir(hub.code, away, date),
          ]);
        } else {
          legs = await Promise.all([
            provider.searchAir(away, hub.code, date),
            provider.searchGround(hub.code, home, date),
          ]);
        }
        return { hub, legs };
      }),
  );

  for (const { hub, legs } of hubResults) {
    if (legs.every((l): l is TransportLeg => l !== null)) {
      const ground = legs.find((l) => l.mode !== 'air')!;
      const label = `${MODE_LABEL[ground.mode]} до ${hub.city} + лоукост`;
      options.push(toOption(legs as TransportLeg[], label));
    }
  }

  return options.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
}

/** Cheapest transport option (may be multimodal). */
export async function cheapestTransport(
  home: string,
  away: string,
  date: string,
  provider: TransportProvider,
  direction: 'out' | 'back',
): Promise<TransportOption | null> {
  const options = await transportOptions(home, away, date, provider, direction);
  return options[0] ?? null;
}

/** Direct flight only — the baseline for computing savings ("the obvious way"). */
export async function directTransport(
  home: string,
  away: string,
  date: string,
  provider: TransportProvider,
  direction: 'out' | 'back',
): Promise<TransportOption | null> {
  const options = await transportOptions(home, away, date, provider, direction);
  return options.find((o) => !o.isMultimodal) ?? null;
}
