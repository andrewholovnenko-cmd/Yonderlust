import { Hero } from '@/features/landing/Hero';
import { HowItWorks } from '@/features/landing/HowItWorks';
import { SampleIdeas } from '@/features/landing/SampleIdeas';
import { CtaBand } from '@/features/landing/CtaBand';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <SampleIdeas />
      <CtaBand />
    </>
  );
}
