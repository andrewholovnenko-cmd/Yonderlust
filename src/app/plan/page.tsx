import type { Metadata } from 'next';
import { ManualPlanner } from '@/features/manual/ManualPlanner';

export const metadata: Metadata = {
  title: 'Plan a trip — Yonderlust',
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  return <ManualPlanner initialDestinationId={destination ?? null} />;
}
