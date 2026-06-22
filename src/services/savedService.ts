import type { SavedService, SavedTrip, TripIdea } from './types';
import { delay } from '@/lib/utils';

// Mock saved-trips store backed by localStorage, keyed per user.
// Swap for the backend implementation when the saved-trips table exists;
// the SavedService interface stays the same.

const storageKey = (userId: string) => `yl:saved:${userId}`;

function read(userId: string): SavedTrip[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as SavedTrip[]) : [];
  } catch {
    return [];
  }
}

function write(userId: string, list: SavedTrip[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export const mockSavedService: SavedService = {
  async list(userId) {
    await delay(150);
    return read(userId);
  },

  async add(userId, idea: TripIdea) {
    await delay(150);
    const list = read(userId);
    const existing = list.find((s) => s.idea.id === idea.id);
    if (existing) return existing;
    const entry: SavedTrip = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      idea,
    };
    write(userId, [entry, ...list]);
    return entry;
  },

  async remove(userId, savedId) {
    await delay(150);
    write(
      userId,
      read(userId).filter((s) => s.id !== savedId),
    );
  },

  async isSaved(userId, tripId) {
    return read(userId).some((s) => s.idea.id === tripId);
  },
};
