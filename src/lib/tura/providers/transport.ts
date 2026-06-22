import type { TransportLeg } from '@/lib/tura/types';

/**
 * Transport data source. The engine only depends on this interface, so
 * mocks and real APIs (Kiwi for air, Distribusion for ground) are
 * interchangeable without touching the engine.
 */
export interface TransportProvider {
  /** Cheapest air leg between two airports on a date, or null if none. */
  searchAir(fromCode: string, toCode: string, date: string): Promise<TransportLeg | null>;
  /** Cheapest ground leg (bus/train), or null if there's no connection. */
  searchGround(fromCode: string, toCode: string, date: string): Promise<TransportLeg | null>;
}
