import type { Metadata } from 'next';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { SavedList } from '@/features/saved/SavedList';

export const metadata: Metadata = {
  title: 'Saved trips — Yonderlust',
};

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <SavedList />
    </ProtectedRoute>
  );
}
