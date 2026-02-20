"""CLI interface for kviga-koll."""

import argparse
import sys
from datetime import date

from . import models


def cmd_add_animal(args):
    """Add a new heifer to the herd."""
    herd = models.load_herd()
    if models.find_animal(herd, args.id):
        print(f"Fel: Djur med id '{args.id}' finns redan.")
        sys.exit(1)

    animal = {
        "id": args.id,
        "name": args.name,
        "birth_date": args.birth_date,
        "breed": args.breed,
        "target_daily_gain_kg": args.target_gain,
        "weights": [],
    }
    herd["animals"].append(animal)
    models.save_herd(herd)
    print(f"Lagt till: {args.name} ({args.id}), ras {args.breed}, fodd {args.birth_date}")


def cmd_log_weight(args):
    """Log a weight measurement for an animal."""
    herd = models.load_herd()
    animal = models.find_animal(herd, args.id)
    if animal is None:
        print(f"Fel: Djur '{args.id}' hittades inte.")
        sys.exit(1)

    record = {"date": args.date, "kg": args.kg}
    animal["weights"].append(record)
    models.save_herd(herd)

    adg = models.compute_adg(animal["weights"])
    print(f"Vikt registrerad: {args.kg} kg den {args.date} for {animal['name']}")
    if adg is not None:
        print(f"  Daglig tillvaxt (ADG) fran senaste 2 vagningar: {adg:.3f} kg/dag")
    else:
        print("  (Minst 2 vagningar behovs for att berakna ADG)")


def cmd_due_tasks(args):
    """List upcoming tasks within N days."""
    herd = models.load_herd()
    today = date.today()
    horizon = args.days

    all_tasks = []
    for animal in herd["animals"]:
        all_tasks.extend(models.compute_due_tasks(animal, today, horizon))

    if not all_tasks:
        print(f"Inga uppgifter inom {horizon} dagar.")
        return

    print(f"Uppgifter inom {horizon} dagar (fran {today.isoformat()}):")
    print("-" * 60)
    for t in sorted(all_tasks, key=lambda x: x.get("date", x.get("window_start", ""))):
        if "date" in t:
            print(f"  {t['date']}  {t['task']:20s}  {t.get('animal_name', t.get('animal_id', ''))}")
        else:
            print(f"  {t['window_start']} - {t['window_end']}  {t['task']:20s}  {t.get('animal_name', '')}")


def cmd_feed_plan(args):
    """Show feed plan for an animal based on latest weight."""
    herd = models.load_herd()
    animal = models.find_animal(herd, args.id)
    if animal is None:
        print(f"Fel: Djur '{args.id}' hittades inte.")
        sys.exit(1)

    if not animal["weights"]:
        print(f"Fel: Inga vikter registrerade for {animal['name']}.")
        sys.exit(1)

    latest = sorted(animal["weights"], key=lambda r: r["date"])[-1]
    plan = models.compute_feed_plan(latest["kg"])

    print(f"Foderplan for {animal['name']} (vikt {plan['body_weight_kg']} kg):")
    print(f"  Dagligt torrsubstansintag (DMI): {plan['daily_dmi_kg']:.2f} kg")
    print(f"  Grovfoder (60%):                 {plan['forage_kg']:.2f} kg")
    print(f"  Kraftfoder (40%):                {plan['concentrate_kg']:.2f} kg")


def cmd_summary(args):
    """Print herd summary: count, avg weight, animals below target."""
    herd = models.load_herd()
    animals = herd["animals"]

    if not animals:
        print("Besattningen ar tom.")
        return

    total = len(animals)
    weights = []
    below_target = []

    for a in animals:
        if a["weights"]:
            latest_w = sorted(a["weights"], key=lambda r: r["date"])[-1]["kg"]
            weights.append(latest_w)
            adg = models.compute_adg(a["weights"])
            if adg is not None and adg < a["target_daily_gain_kg"]:
                below_target.append((a["name"], a["id"], adg, a["target_daily_gain_kg"]))

    print(f"Besattningssammanfattning")
    print(f"{'='*40}")
    print(f"  Antal kvigor:      {total}")
    if weights:
        avg_w = sum(weights) / len(weights)
        print(f"  Medelvikt:         {avg_w:.1f} kg")
    else:
        print(f"  Medelvikt:         (inga vikter)")

    if below_target:
        print(f"\n  Djur under maltillvaxt:")
        for name, aid, adg, target in below_target:
            print(f"    {name} ({aid}): ADG {adg:.3f} kg/dag (mal: {target:.3f})")
    else:
        print(f"\n  Alla djur med vikter uppnar maltillvaxt.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="kviga-koll",
        description="Praktiskt CLI-verktyg for kviguppfodare.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add-animal
    p_add = sub.add_parser("add-animal", help="Lagg till en kviga")
    p_add.add_argument("--id", required=True, help="Unikt djur-ID")
    p_add.add_argument("--name", required=True, help="Namn")
    p_add.add_argument("--birth-date", required=True, help="Fodelsedag (YYYY-MM-DD)")
    p_add.add_argument("--breed", required=True, help="Ras")
    p_add.add_argument("--target-gain", type=float, default=0.8, help="Maltillvaxt kg/dag (standard: 0.8)")

    # log-weight
    p_lw = sub.add_parser("log-weight", help="Registrera vikt")
    p_lw.add_argument("--id", required=True, help="Djur-ID")
    p_lw.add_argument("--kg", type=float, required=True, help="Vikt i kg")
    p_lw.add_argument("--date", default=date.today().isoformat(), help="Datum (YYYY-MM-DD, standard: idag)")

    # due-tasks
    p_dt = sub.add_parser("due-tasks", help="Visa kommande uppgifter")
    p_dt.add_argument("--days", type=int, default=30, help="Antal dagar framat (standard: 30)")

    # feed-plan
    p_fp = sub.add_parser("feed-plan", help="Visa foderplan")
    p_fp.add_argument("--id", required=True, help="Djur-ID")

    # summary
    sub.add_parser("summary", help="Sammanfattning av besattningen")

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)

    dispatch = {
        "add-animal": cmd_add_animal,
        "log-weight": cmd_log_weight,
        "due-tasks": cmd_due_tasks,
        "feed-plan": cmd_feed_plan,
        "summary": cmd_summary,
    }
    dispatch[args.command](args)
