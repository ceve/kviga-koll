/** Compute average daily gain from the last two weight records.
 *  Each record: { date: "YYYY-MM-DD", kg: number }
 *  Returns kg/day or null if fewer than 2 records or zero-day span.
 */
export function computeAdg(weights) {
  if (weights.length < 2) return null;

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const prev = sorted[sorted.length - 2];
  const last = sorted[sorted.length - 1];

  const d1 = new Date(prev.date);
  const d2 = new Date(last.date);
  const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

  if (days <= 0) return null;
  return (last.kg - prev.kg) / days;
}

/** Estimate daily dry matter intake and forage/concentrate split.
 *  DMI = 2.2 % of body weight. Split: 60 % forage, 40 % concentrate.
 */
export function computeFeedPlan(bodyWeightKg) {
  const dmi = bodyWeightKg * 0.022;
  return {
    bodyWeightKg,
    dailyDmiKg: Math.round(dmi * 100) / 100,
    forageKg: Math.round(dmi * 0.6 * 100) / 100,
    concentrateKg: Math.round(dmi * 0.4 * 100) / 100,
  };
}

/** Day-difference helper (positive when b is after a). */
function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/** Return list of tasks due within horizonDays from today.
 *  Rules:
 *  - Vaccination every 180 days from birth.
 *  - Hoof check every 90 days from birth.
 *  - Breeding check when age is 13-15 months (395-456 days).
 */
export function computeDueTasks(animal, today, horizonDays) {
  const birth = new Date(animal.birthDate);
  const tasks = [];

  addRecurring(tasks, 'Vaccination', animal, birth, 180, today, horizonDays);
  addRecurring(tasks, 'Klövkontroll', animal, birth, 90, today, horizonDays);

  // One-time window: breeding check at 13-15 months
  const breedingStartOrd = daysBetween(new Date(0), birth) + 395;
  const breedingEndOrd = daysBetween(new Date(0), birth) + 456;
  const todayOrd = daysBetween(new Date(0), today);
  const endOrd = todayOrd + horizonDays;

  if (breedingStartOrd <= endOrd && breedingEndOrd >= todayOrd) {
    const wsDate = new Date(birth);
    wsDate.setDate(wsDate.getDate() + 395);
    const weDate = new Date(birth);
    weDate.setDate(weDate.getDate() + 456);

    const windowStart = wsDate > today ? wsDate : today;
    const windowEnd = weDate < new Date(today.getTime() + horizonDays * 86400000) ? weDate : new Date(today.getTime() + horizonDays * 86400000);

    tasks.push({
      task: 'Brunst-/betäckningskontroll',
      animalId: animal.id,
      animalName: animal.name,
      windowStart: fmt(windowStart),
      windowEnd: fmt(windowEnd),
    });
  }

  return tasks;
}

function addRecurring(tasks, name, animal, birth, intervalDays, today, horizonDays) {
  const ageDays = daysBetween(birth, today);
  let nextDate;

  if (ageDays < 0) {
    nextDate = new Date(birth);
    nextDate.setDate(nextDate.getDate() + intervalDays);
  } else if (ageDays % intervalDays === 0) {
    nextDate = new Date(today);
  } else {
    const periodsPassed = Math.floor(ageDays / intervalDays);
    nextDate = new Date(birth);
    nextDate.setDate(nextDate.getDate() + (periodsPassed + 1) * intervalDays);
  }

  const diff = daysBetween(today, nextDate);
  if (diff >= 0 && diff <= horizonDays) {
    tasks.push({
      task: name,
      animalId: animal.id,
      animalName: animal.name,
      date: fmt(nextDate),
    });
  }
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}
