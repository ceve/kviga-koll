"""Unit tests for kviga_koll.models core calculations and task scheduling."""

import json
import os
import tempfile
import unittest
from datetime import date, timedelta

from kviga_koll import models


class TestComputeADG(unittest.TestCase):
    """Tests for average daily gain calculation."""

    def test_two_records(self):
        weights = [
            {"date": "2025-01-01", "kg": 200.0},
            {"date": "2025-01-31", "kg": 224.0},
        ]
        adg = models.compute_adg(weights)
        self.assertIsNotNone(adg)
        self.assertAlmostEqual(adg, 24.0 / 30, places=4)

    def test_multiple_records_uses_last_two(self):
        weights = [
            {"date": "2025-01-01", "kg": 100.0},
            {"date": "2025-02-01", "kg": 130.0},
            {"date": "2025-03-01", "kg": 155.0},
        ]
        adg = models.compute_adg(weights)
        # Last two: Feb 1 (130 kg) -> Mar 1 (155 kg) = 25 kg / 28 days
        self.assertAlmostEqual(adg, 25.0 / 28, places=4)

    def test_unsorted_records(self):
        weights = [
            {"date": "2025-03-01", "kg": 155.0},
            {"date": "2025-01-01", "kg": 100.0},
            {"date": "2025-02-01", "kg": 130.0},
        ]
        adg = models.compute_adg(weights)
        self.assertAlmostEqual(adg, 25.0 / 28, places=4)

    def test_single_record_returns_none(self):
        weights = [{"date": "2025-01-01", "kg": 200.0}]
        self.assertIsNone(models.compute_adg(weights))

    def test_empty_returns_none(self):
        self.assertIsNone(models.compute_adg([]))

    def test_same_date_returns_none(self):
        weights = [
            {"date": "2025-01-01", "kg": 200.0},
            {"date": "2025-01-01", "kg": 210.0},
        ]
        self.assertIsNone(models.compute_adg(weights))

    def test_weight_loss_negative_adg(self):
        weights = [
            {"date": "2025-01-01", "kg": 200.0},
            {"date": "2025-01-11", "kg": 195.0},
        ]
        adg = models.compute_adg(weights)
        self.assertAlmostEqual(adg, -0.5, places=4)


class TestComputeFeedPlan(unittest.TestCase):
    """Tests for feed plan calculation."""

    def test_standard_weight(self):
        plan = models.compute_feed_plan(300.0)
        self.assertEqual(plan["body_weight_kg"], 300.0)
        # DMI = 300 * 0.022 = 6.6
        self.assertAlmostEqual(plan["daily_dmi_kg"], 6.6, places=2)
        # Forage = 6.6 * 0.6 = 3.96
        self.assertAlmostEqual(plan["forage_kg"], 3.96, places=2)
        # Concentrate = 6.6 * 0.4 = 2.64
        self.assertAlmostEqual(plan["concentrate_kg"], 2.64, places=2)

    def test_small_weight(self):
        plan = models.compute_feed_plan(100.0)
        self.assertAlmostEqual(plan["daily_dmi_kg"], 2.2, places=2)
        self.assertAlmostEqual(plan["forage_kg"], 1.32, places=2)
        self.assertAlmostEqual(plan["concentrate_kg"], 0.88, places=2)

    def test_zero_weight(self):
        plan = models.compute_feed_plan(0.0)
        self.assertEqual(plan["daily_dmi_kg"], 0.0)
        self.assertEqual(plan["forage_kg"], 0.0)
        self.assertEqual(plan["concentrate_kg"], 0.0)


class TestComputeDueTasks(unittest.TestCase):
    """Tests for task scheduling logic."""

    def _make_animal(self, birth_date_str):
        return {
            "id": "K001",
            "name": "Bella",
            "birth_date": birth_date_str,
            "breed": "SRB",
            "target_daily_gain_kg": 0.8,
            "weights": [],
        }

    def test_vaccination_due(self):
        # Born 180 days ago => vaccination due today
        today = date(2025, 7, 1)
        birth = today - timedelta(days=180)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=1)
        vacc_tasks = [t for t in tasks if t["task"] == "Vaccination"]
        self.assertEqual(len(vacc_tasks), 1)
        self.assertEqual(vacc_tasks[0]["date"], today.isoformat())

    def test_hoof_check_due(self):
        # Born 90 days ago => hoof check due today
        today = date(2025, 7, 1)
        birth = today - timedelta(days=90)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=1)
        hoof_tasks = [t for t in tasks if t["task"] == "Hoof check"]
        self.assertEqual(len(hoof_tasks), 1)
        self.assertEqual(hoof_tasks[0]["date"], today.isoformat())

    def test_no_tasks_outside_horizon(self):
        today = date(2025, 7, 1)
        # Born 10 days ago — next hoof check in 80 days, next vacc in 170 days
        birth = today - timedelta(days=10)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=7)
        # Nothing should be due within 7 days
        self.assertEqual(len(tasks), 0)

    def test_breeding_check_in_window(self):
        # Born 400 days ago => within 395-456 breeding window
        today = date(2025, 7, 1)
        birth = today - timedelta(days=400)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=30)
        breeding = [t for t in tasks if t["task"] == "Breeding check"]
        self.assertEqual(len(breeding), 1)

    def test_breeding_check_not_yet(self):
        # Born 100 days ago — far from 13-15 month window
        today = date(2025, 7, 1)
        birth = today - timedelta(days=100)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=30)
        breeding = [t for t in tasks if t["task"] == "Breeding check"]
        self.assertEqual(len(breeding), 0)

    def test_breeding_check_past(self):
        # Born 500 days ago — past the 456-day window
        today = date(2025, 7, 1)
        birth = today - timedelta(days=500)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=30)
        breeding = [t for t in tasks if t["task"] == "Breeding check"]
        self.assertEqual(len(breeding), 0)

    def test_multiple_tasks_same_animal(self):
        # Born exactly 360 days ago: next vacc at 360 (=2*180, due today),
        # next hoof at 360 (=4*90, due today), breeding window 395-456 within 60 days
        today = date(2025, 7, 1)
        birth = today - timedelta(days=360)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=60)
        task_names = [t["task"] for t in tasks]
        self.assertIn("Vaccination", task_names)
        self.assertIn("Hoof check", task_names)

    def test_recurring_tasks_have_animal_info(self):
        today = date(2025, 7, 1)
        birth = today - timedelta(days=180)
        animal = self._make_animal(birth.isoformat())

        tasks = models.compute_due_tasks(animal, today, horizon_days=1)
        for t in tasks:
            self.assertEqual(t["animal_id"], "K001")
            self.assertEqual(t["animal_name"], "Bella")


class TestPersistence(unittest.TestCase):
    """Tests for load/save herd data."""

    def setUp(self):
        self._tmpdir = tempfile.mkdtemp()
        self._orig_data_dir = models.DATA_DIR
        self._orig_herd_file = models.HERD_FILE
        models.DATA_DIR = self._tmpdir
        models.HERD_FILE = os.path.join(self._tmpdir, "herd.json")

    def tearDown(self):
        models.DATA_DIR = self._orig_data_dir
        models.HERD_FILE = self._orig_herd_file
        herd_path = os.path.join(self._tmpdir, "herd.json")
        if os.path.exists(herd_path):
            os.remove(herd_path)
        os.rmdir(self._tmpdir)

    def test_load_empty(self):
        herd = models.load_herd()
        self.assertEqual(herd, {"animals": []})

    def test_save_and_load(self):
        herd = {"animals": [{"id": "K001", "name": "Test"}]}
        models.save_herd(herd)
        loaded = models.load_herd()
        self.assertEqual(loaded["animals"][0]["id"], "K001")

    def test_find_animal(self):
        herd = {"animals": [
            {"id": "K001", "name": "Bella"},
            {"id": "K002", "name": "Stella"},
        ]}
        self.assertEqual(models.find_animal(herd, "K002")["name"], "Stella")
        self.assertIsNone(models.find_animal(herd, "K999"))


if __name__ == "__main__":
    unittest.main()
