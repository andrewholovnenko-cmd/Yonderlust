import { CalendarHeart, Compass, Route } from 'lucide-react';
import { Container } from '@/components/ui/Container';

const steps = [
  {
    icon: CalendarHeart,
    title: 'Tell us your when and your mood',
    body: 'Six free days and you want to swim? A long weekend with good food? Start from how you feel, not from a map.',
  },
  {
    icon: Compass,
    title: 'We look everywhere for you',
    body: 'Yonderlust weighs season, budget, flight time and vibe across dozens of destinations and ranks the best fits.',
  },
  {
    icon: Route,
    title: 'Pick one and it is built',
    body: 'Every idea comes with flights, a place to stay and a day-by-day plan — ready to save and, soon, to book.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-line/70 bg-surface-2/40 py-16 sm:py-24">
      <Container>
        <p className="text-sm font-medium uppercase tracking-wide text-accent">The idea</p>
        <h2 className="mt-2 max-w-2xl text-display-md">
          Not a planner for a place you picked. A way to pick the place.
        </h2>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title}>
                <div className="grid size-11 place-items-center rounded-full bg-accent/12 text-accent">
                  <Icon className="size-5" />
                </div>
                <div className="mt-4 text-sm text-ink-3">Step {i + 1}</div>
                <h3 className="mt-1 font-serif text-xl leading-snug">{step.title}</h3>
                <p className="mt-2 text-pretty text-ink-2">{step.body}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
