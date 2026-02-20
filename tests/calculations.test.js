import { describe, it, expect } from 'vitest';
import { computeAdg, computeFeedPlan, computeDueTasks } from '../src/utils/calculations.js';

// ---------------------------------------------------------------------------
// computeAdg
// ---------------------------------------------------------------------------
describe('computeAdg', () => {
  it('computes ADG from two records', () => {
    const weights = [
      { date: '2025-01-01', kg: 200 },
      { date: '2025-01-31', kg: 224 },
    ];
    expect(computeAdg(weights)).toBeCloseTo(24 / 30, 4);
  });

  it('uses last two records when more exist', () => {
    const weights = [
      { date: '2025-01-01', kg: 100 },
      { date: '2025-02-01', kg: 130 },
      { date: '2025-03-01', kg: 155 },
    ];
    expect(computeAdg(weights)).toBeCloseTo(25 / 28, 4);
  });

  it('handles unsorted records', () => {
    const weights = [
      { date: '2025-03-01', kg: 155 },
      { date: '2025-01-01', kg: 100 },
      { date: '2025-02-01', kg: 130 },
    ];
    expect(computeAdg(weights)).toBeCloseTo(25 / 28, 4);
  });

  it('returns null for single record', () => {
    expect(computeAdg([{ date: '2025-01-01', kg: 200 }])).toBeNull();
  });

  it('returns null for empty list', () => {
    expect(computeAdg([])).toBeNull();
  });

  it('returns null for same-date records', () => {
    const weights = [
      { date: '2025-01-01', kg: 200 },
      { date: '2025-01-01', kg: 210 },
    ];
    expect(computeAdg(weights)).toBeNull();
  });

  it('returns negative ADG for weight loss', () => {
    const weights = [
      { date: '2025-01-01', kg: 200 },
      { date: '2025-01-11', kg: 195 },
    ];
    expect(computeAdg(weights)).toBeCloseTo(-0.5, 4);
  });
});

// ---------------------------------------------------------------------------
// computeFeedPlan
// ---------------------------------------------------------------------------
describe('computeFeedPlan', () => {
  it('computes plan for standard weight (300 kg)', () => {
    const plan = computeFeedPlan(300);
    expect(plan.bodyWeightKg).toBe(300);
    expect(plan.dailyDmiKg).toBeCloseTo(6.6, 2);
    expect(plan.forageKg).toBeCloseTo(3.96, 2);
    expect(plan.concentrateKg).toBeCloseTo(2.64, 2);
  });

  it('computes plan for small weight (100 kg)', () => {
    const plan = computeFeedPlan(100);
    expect(plan.dailyDmiKg).toBeCloseTo(2.2, 2);
    expect(plan.forageKg).toBeCloseTo(1.32, 2);
    expect(plan.concentrateKg).toBeCloseTo(0.88, 2);
  });

  it('handles zero weight', () => {
    const plan = computeFeedPlan(0);
    expect(plan.dailyDmiKg).toBe(0);
    expect(plan.forageKg).toBe(0);
    expect(plan.concentrateKg).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeDueTasks
// ---------------------------------------------------------------------------
describe('computeDueTasks', () => {
  function makeAnimal(birthDateStr) {
    return {
      id: 'K001',
      name: 'Bella',
      birthDate: birthDateStr,
      breed: 'SRB',
      targetDailyGainKg: 0.8,
      weights: [],
    };
  }

  function daysAgo(n) {
    const d = new Date(2025, 6, 1); // July 1 2025
    d.setDate(d.getDate() - n);
    return d;
  }

  function today() {
    return new Date(2025, 6, 1); // July 1 2025
  }

  it('shows vaccination due when age is multiple of 180', () => {
    const birth = daysAgo(180);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 1);
    const vacc = tasks.filter((t) => t.task === 'Vaccination');
    expect(vacc).toHaveLength(1);
    expect(vacc[0].date).toBe('2025-07-01');
  });

  it('shows hoof check due when age is multiple of 90', () => {
    const birth = daysAgo(90);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 1);
    const hoof = tasks.filter((t) => t.task === 'Klövkontroll');
    expect(hoof).toHaveLength(1);
    expect(hoof[0].date).toBe('2025-07-01');
  });

  it('returns no tasks outside horizon', () => {
    const birth = daysAgo(10);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 7);
    expect(tasks).toHaveLength(0);
  });

  it('shows breeding check within 395-456 day window', () => {
    const birth = daysAgo(400);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 30);
    const breeding = tasks.filter((t) => t.task === 'Brunst-/betäckningskontroll');
    expect(breeding).toHaveLength(1);
  });

  it('does not show breeding check before window', () => {
    const birth = daysAgo(100);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 30);
    const breeding = tasks.filter((t) => t.task === 'Brunst-/betäckningskontroll');
    expect(breeding).toHaveLength(0);
  });

  it('does not show breeding check after window', () => {
    const birth = daysAgo(500);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 30);
    const breeding = tasks.filter((t) => t.task === 'Brunst-/betäckningskontroll');
    expect(breeding).toHaveLength(0);
  });

  it('shows multiple tasks for same animal', () => {
    const birth = daysAgo(360);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 60);
    const names = tasks.map((t) => t.task);
    expect(names).toContain('Vaccination');
    expect(names).toContain('Klövkontroll');
  });

  it('includes animal info in recurring tasks', () => {
    const birth = daysAgo(180);
    const animal = makeAnimal(birth.toISOString().slice(0, 10));
    const tasks = computeDueTasks(animal, today(), 1);
    for (const t of tasks) {
      expect(t.animalId).toBe('K001');
      expect(t.animalName).toBe('Bella');
    }
  });
});
