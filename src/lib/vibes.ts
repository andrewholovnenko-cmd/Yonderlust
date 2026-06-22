import type { Vibe, VibeId } from '@/services/types';

/** Canonical vibe taxonomy used by the Discover planner and trip cards. */
export const VIBES: Vibe[] = [
  { id: 'beach', label: 'Beach & swim', description: 'Warm sea, sand, lazy shorelines' },
  { id: 'relax', label: 'Slow & restful', description: 'Spa days, quiet, nowhere to be' },
  { id: 'culture', label: 'Culture & history', description: 'Old towns, museums, ruins' },
  { id: 'food', label: 'Food & wine', description: 'Markets, long lunches, local tables' },
  { id: 'nature', label: 'Nature & hikes', description: 'Trails, mountains, big views' },
  { id: 'nightlife', label: 'Nightlife', description: 'Bars, music, late nights' },
  { id: 'romantic', label: 'Romantic', description: 'For two, easy on the eyes' },
  { id: 'adventure', label: 'Adventure', description: 'Diving, kayaking, something new' },
  { id: 'city', label: 'City break', description: 'Walkable streets, cafes, design' },
  { id: 'budget', label: 'Easy on budget', description: 'Stretch every euro further' },
];

export const VIBE_BY_ID: Record<VibeId, Vibe> = Object.fromEntries(
  VIBES.map((v) => [v.id, v]),
) as Record<VibeId, Vibe>;

export function vibeLabel(id: VibeId): string {
  return VIBE_BY_ID[id]?.label ?? id;
}
