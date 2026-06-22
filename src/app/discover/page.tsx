import type { Metadata } from 'next';
import { DiscoverExperience } from '@/features/planner/DiscoverExperience';

export const metadata: Metadata = {
  title: 'Discover trips — Yonderlust',
};

export default function DiscoverPage() {
  return <DiscoverExperience />;
}
