import { OrbitLoader } from '@/components/loaders/OrbitLoader';

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <OrbitLoader size={96} label="Loading" />
    </div>
  );
}
