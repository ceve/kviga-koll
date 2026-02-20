const STORAGE_KEY = 'kviga-koll-herd';

export function loadHerd() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { animals: [] };
    return JSON.parse(raw);
  } catch {
    return { animals: [] };
  }
}

export function saveHerd(herd) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(herd));
}

export function findAnimal(herd, animalId) {
  return herd.animals.find((a) => a.id === animalId) || null;
}
