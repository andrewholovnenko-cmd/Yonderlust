import type { Metadata } from 'next';
import { TripDetailView } from '@/features/trip/TripDetailView';

export const metadata: Metadata = {
  title: 'Trip — Yonderlust',
};

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripDetailView id={id} />;
}
