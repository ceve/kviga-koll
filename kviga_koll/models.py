"""Data models and persistence for herd management."""

import json
import os
from datetime import date

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
HERD_FILE = os.path.join(DATA_DIR, "herd.json")


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def load_herd() -> dict:
    """Load herd data from JSON file. Returns dict with 'animals' list."""
    _ensure_data_dir()
    if not os.path.exists(HERD_FILE):
        return {"animals": []}
    with open(HERD_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_herd(herd: dict) -> None:
    """Persist herd data to JSON file."""
    _ensure_data_dir()
    with open(HERD_FILE, "w", encoding="utf-8") as f:
        json.dump(herd, f, indent=2, ensure_ascii=False)


def find_animal(herd: dict, animal_id: str):
    """Find animal by id. Returns the dict or None."""
    for a in herd["animals"]:
        if a["id"] == animal_id:
            return a
    return None


def compute_adg(weights: list) -> float:
    """Compute average daily gain from the last two weight records.

    Each record: {"date": "YYYY-MM-DD", "kg": float}
    Returns kg/day or None if fewer than 2 records.
    """
    if len(weights) < 2:
        return None
    sorted_w = sorted(weights, key=lambda r: r["date"])
    prev, last = sorted_w[-2], sorted_w[-1]
    d1 = date.fromisoformat(prev["date"])
    d2 = date.fromisoformat(last["date"])
    days = (d2 - d1).days
    if days <= 0:
        return None
    return (last["kg"] - prev["kg"]) / days


def compute_feed_plan(body_weight_kg: float) -> dict:
    """Estimate daily dry matter intake and forage/concentrate split.

    DMI = 2.2% of body weight.
    Split: 60% forage, 40% concentrate.
    """
    dmi = body_weight_kg * 0.022
    return {
        "body_weight_kg": body_weight_kg,
        "daily_dmi_kg": round(dmi, 2),
        "forage_kg": round(dmi * 0.60, 2),
        "concentrate_kg": round(dmi * 0.40, 2),
    }


def compute_due_tasks(animal: dict, today: date, horizon_days: int) -> list:
    """Return list of tasks due within *horizon_days* from *today*.

    Rules:
    - Vaccination every 180 days from birth.
    - Hoof check every 90 days from birth.
    - Breeding check when age is 13-15 months (395-456 days).
    """
    birth = date.fromisoformat(animal["birth_date"])
    tasks = []

    # Recurring: vaccination every 180 days
    _add_recurring(tasks, "Vaccination", animal, birth, 180, today, horizon_days)

    # Recurring: hoof check every 90 days
    _add_recurring(tasks, "Hoof check", animal, birth, 90, today, horizon_days)

    # One-time window: breeding check at 13-15 months
    breeding_start = birth.toordinal() + 395
    breeding_end = birth.toordinal() + 456
    today_ord = today.toordinal()
    end_ord = today_ord + horizon_days

    if breeding_start <= end_ord and breeding_end >= today_ord:
        window_start = date.fromordinal(max(breeding_start, today_ord))
        window_end = date.fromordinal(min(breeding_end, end_ord))
        tasks.append({
            "task": "Breeding check",
            "animal_id": animal["id"],
            "animal_name": animal["name"],
            "window_start": window_start.isoformat(),
            "window_end": window_end.isoformat(),
        })

    return tasks


def _add_recurring(tasks, name, animal, birth, interval_days, today, horizon_days):
    """Add next occurrence of a recurring task if it falls within the horizon."""
    age_days = (today - birth).days
    if age_days < 0:
        next_date = date.fromordinal(birth.toordinal() + interval_days)
    elif age_days % interval_days == 0:
        # Exactly on a boundary -- task is due today
        next_date = today
    else:
        periods_passed = age_days // interval_days
        next_date = date.fromordinal(birth.toordinal() + (periods_passed + 1) * interval_days)

    if 0 <= (next_date - today).days <= horizon_days:
        tasks.append({
            "task": name,
            "animal_id": animal["id"],
            "animal_name": animal["name"],
            "date": next_date.isoformat(),
        })
