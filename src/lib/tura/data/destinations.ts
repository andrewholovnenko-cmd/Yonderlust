import type { Destination, TransportMode } from '@/lib/tura/types';

// Candidate destinations — short hand-picked MVP list of popular budget
// European spots. The engine picks "where" from this list by vibe + price.
export const DESTINATIONS: Destination[] = [
  { code: 'BCN', city: 'Барселона', country: 'Испания', vibes: ['beach', 'city', 'party'] },
  { code: 'LIS', city: 'Лиссабон', country: 'Португалия', vibes: ['beach', 'city', 'history'] },
  { code: 'ATH', city: 'Афины', country: 'Греция', vibes: ['history', 'city', 'beach'] },
  { code: 'FCO', city: 'Рим', country: 'Италия', vibes: ['history', 'city'] },
  { code: 'PMI', city: 'Пальма-де-Майорка', country: 'Испания', vibes: ['beach', 'party'] },
  { code: 'SPU', city: 'Сплит', country: 'Хорватия', vibes: ['beach', 'nature', 'history'] },
  { code: 'BUD', city: 'Будапешт', country: 'Венгрия', vibes: ['city', 'party', 'history'] },
  { code: 'PRG', city: 'Прага', country: 'Чехия', vibes: ['city', 'history', 'party'] },
  { code: 'NAP', city: 'Неаполь', country: 'Италия', vibes: ['history', 'beach', 'city'] },
  { code: 'VLC', city: 'Валенсия', country: 'Испания', vibes: ['beach', 'city'] },
  { code: 'OPO', city: 'Порту', country: 'Португалия', vibes: ['city', 'history'] },
  { code: 'CTA', city: 'Катания', country: 'Италия', vibes: ['beach', 'nature', 'history'] },
  { code: 'KRK', city: 'Краков', country: 'Польша', vibes: ['history', 'city', 'party'] },
  { code: 'TIA', city: 'Тирана', country: 'Албания', vibes: ['beach', 'nature'] },
  { code: 'SOF', city: 'София', country: 'Болгария', vibes: ['city', 'history', 'nature'] },
  { code: 'TGD', city: 'Подгорица', country: 'Черногория', vibes: ['beach', 'nature'] },

  // ── expanded pool (added after the original 16 proved too small to ever
  // surprise a search — same few cities kept winning regardless of input) ──
  { code: 'CDG', city: 'Париж', country: 'Франция', vibes: ['city', 'history'] },
  { code: 'BGY', city: 'Милан', country: 'Италия', vibes: ['city', 'history'] },
  { code: 'VCE', city: 'Венеция', country: 'Италия', vibes: ['history', 'city'] },
  { code: 'FLR', city: 'Флоренция', country: 'Италия', vibes: ['history', 'city'] },
  { code: 'BLQ', city: 'Болонья', country: 'Италия', vibes: ['history', 'city'] },
  { code: 'MAD', city: 'Мадрид', country: 'Испания', vibes: ['city', 'history'] },
  { code: 'SVQ', city: 'Севилья', country: 'Испания', vibes: ['history', 'city'] },
  { code: 'AGP', city: 'Малага', country: 'Испания', vibes: ['beach', 'city'] },
  { code: 'BIO', city: 'Бильбао', country: 'Испания', vibes: ['city', 'history'] },
  { code: 'AMS', city: 'Амстердам', country: 'Нидерланды', vibes: ['city', 'history'] },
  { code: 'BRU', city: 'Брюссель', country: 'Бельгия', vibes: ['city', 'history'] },
  { code: 'BER', city: 'Берлин', country: 'Германия', vibes: ['city', 'history'] },
  { code: 'HAM', city: 'Гамбург', country: 'Германия', vibes: ['city', 'party'] },
  { code: 'CGN', city: 'Кёльн', country: 'Германия', vibes: ['city', 'history'] },
  { code: 'MUC', city: 'Мюнхен', country: 'Германия', vibes: ['city', 'party'] },
  { code: 'ZRH', city: 'Цюрих', country: 'Швейцария', vibes: ['city', 'nature'] },
  { code: 'GVA', city: 'Женева', country: 'Швейцария', vibes: ['city', 'nature'] },
  { code: 'DUB', city: 'Дублин', country: 'Ирландия', vibes: ['city', 'history'] },
  { code: 'EDI', city: 'Эдинбург', country: 'Великобритания', vibes: ['history', 'city'] },
  { code: 'LON', city: 'Лондон', country: 'Великобритания', vibes: ['city', 'history'] },
  { code: 'VIE', city: 'Вена', country: 'Австрия', vibes: ['city', 'history'] },
  { code: 'ARN', city: 'Стокгольм', country: 'Швеция', vibes: ['city', 'history'] },
  { code: 'CPH', city: 'Копенгаген', country: 'Дания', vibes: ['city', 'history'] },
  { code: 'NCE', city: 'Ницца', country: 'Франция', vibes: ['beach', 'city'] },
  { code: 'TFS', city: 'Тенерифе', country: 'Испания', vibes: ['beach', 'nature'] },
  { code: 'FAO', city: 'Фару', country: 'Португалия', vibes: ['beach'] },
  { code: 'DBV', city: 'Дубровник', country: 'Хорватия', vibes: ['beach', 'history'] },
  { code: 'ZAD', city: 'Задар', country: 'Хорватия', vibes: ['beach'] },
  { code: 'RHO', city: 'Родос', country: 'Греция', vibes: ['beach', 'history'] },
  { code: 'CFU', city: 'Корфу', country: 'Греция', vibes: ['beach', 'history'] },
  { code: 'HER', city: 'Ираклион', country: 'Греция', vibes: ['beach'] },
  { code: 'CHQ', city: 'Ханья', country: 'Греция', vibes: ['beach'] },
  { code: 'JMK', city: 'Миконос', country: 'Греция', vibes: ['beach', 'party'] },
  { code: 'JTR', city: 'Санторини', country: 'Греция', vibes: ['beach', 'nature'] },
  { code: 'IBZ', city: 'Ивиса', country: 'Испания', vibes: ['beach', 'party'] },
  { code: 'ACE', city: 'Лансароте', country: 'Испания', vibes: ['beach', 'nature'] },
  { code: 'LPA', city: 'Гран-Канария', country: 'Испания', vibes: ['beach'] },
  { code: 'AYT', city: 'Анталья', country: 'Турция', vibes: ['beach'] },
  { code: 'PFO', city: 'Пафос', country: 'Кипр', vibes: ['beach', 'history'] },
  { code: 'CAG', city: 'Кальяри', country: 'Италия', vibes: ['beach'] },
  { code: 'PMO', city: 'Палермо', country: 'Италия', vibes: ['beach', 'history'] },
  { code: 'BRI', city: 'Бари', country: 'Италия', vibes: ['beach'] },
  { code: 'OLB', city: 'Ольбия', country: 'Италия', vibes: ['beach'] },
];

// Lowcost airline bases — flying out of one of these is cheaper, which is
// what makes the bus/train-to-hub multimodal trick worth it.
export const LOWCOST_BASES = new Set<string>([
  'BTS', // Bratislava (Ryanair/Wizz)
  'WRO', // Wroclaw (Wizz)
  'KTW', // Katowice (Wizz/Ryanair)
  'KRK', // Krakow
  'POZ', // Poznan
  'PRG', // Prague
  'BUD', // Budapest
  'GRO', // Girona (Ryanair base near Barcelona)
  'CRL', // Charleroi (Brussels South)
  'BGY', // Bergamo (Milan)
  'HHN', // Frankfurt-Hahn
  'NYO', // Stockholm Skavsta
]);

/** Ground leg "to the hub" from the home city: bus or train. */
export interface GroundHub {
  code: string;
  city: string;
  mode: TransportMode; // "bus" | "train"
  pricePerPerson: number; // EUR
  durationMin: number;
  carrier: string;
}

// Ground-hub graph by departure city. From `origin` you can cheaply reach
// these lowcost bases and fly out cheaper than a direct flight.
export const ORIGIN_HUBS: Record<string, GroundHub[]> = {
  BER: [
    { code: 'WRO', city: 'Вроцлав', mode: 'bus', pricePerPerson: 15, durationMin: 300, carrier: 'FlixBus' },
    { code: 'PRG', city: 'Прага', mode: 'bus', pricePerPerson: 18, durationMin: 290, carrier: 'FlixBus' },
    { code: 'POZ', city: 'Познань', mode: 'bus', pricePerPerson: 12, durationMin: 240, carrier: 'FlixBus' },
  ],
  WAW: [
    { code: 'WRO', city: 'Вроцлав', mode: 'train', pricePerPerson: 14, durationMin: 220, carrier: 'PKP IC' },
    { code: 'KTW', city: 'Катовице', mode: 'bus', pricePerPerson: 10, durationMin: 180, carrier: 'FlixBus' },
    { code: 'KRK', city: 'Краков', mode: 'bus', pricePerPerson: 12, durationMin: 170, carrier: 'FlixBus' },
  ],
  VIE: [
    { code: 'BTS', city: 'Братислава', mode: 'bus', pricePerPerson: 9, durationMin: 80, carrier: 'FlixBus' },
    { code: 'BUD', city: 'Будапешт', mode: 'bus', pricePerPerson: 15, durationMin: 170, carrier: 'FlixBus' },
  ],
  PRG: [
    { code: 'WRO', city: 'Вроцлав', mode: 'bus', pricePerPerson: 16, durationMin: 240, carrier: 'FlixBus' },
    { code: 'BTS', city: 'Братислава', mode: 'bus', pricePerPerson: 14, durationMin: 230, carrier: 'FlixBus' },
    { code: 'BUD', city: 'Будапешт', mode: 'bus', pricePerPerson: 18, durationMin: 400, carrier: 'FlixBus' },
  ],
  MUC: [
    { code: 'BGY', city: 'Бергамо', mode: 'bus', pricePerPerson: 22, durationMin: 360, carrier: 'FlixBus' },
    { code: 'PRG', city: 'Прага', mode: 'bus', pricePerPerson: 20, durationMin: 250, carrier: 'FlixBus' },
  ],
};

export function hubsForOrigin(origin: string): GroundHub[] {
  return ORIGIN_HUBS[origin.toUpperCase()] ?? [];
}

export function findDestination(code: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.code === code.toUpperCase());
}
