"""Vectors and the hand-checked civil-calendar anchors."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from hisab_age_calculator import (  # noqa: E402
    HOMEPAGE,
    LIMITATION_EN,
    AgeError,
    calculate_age,
    gregorian_to_jdn,
    hijri_to_jdn,
    is_hijri_leap,
    jdn_to_gregorian,
    jdn_to_hijri,
)

VECTORS = json.loads((Path(__file__).resolve().parents[2] / "vectors.json").read_text(encoding="utf-8"))


class CoreTest(unittest.TestCase):
    def test_anchors(self) -> None:
        self.assertEqual(gregorian_to_jdn(2000, 1, 1), 2451545)
        self.assertEqual(hijri_to_jdn(1, 1, 1), 1948440)
        self.assertEqual(jdn_to_gregorian(hijri_to_jdn(1420, 9, 1)), (1999, 12, 9))
        self.assertEqual(jdn_to_hijri(gregorian_to_jdn(2000, 1, 1)), (1420, 9, 24))
        self.assertEqual(HOMEPAGE, "https://hisabaleumr.com/")
        self.assertIn("Umm al-Qura", LIMITATION_EN)
        self.assertIn("±1", LIMITATION_EN)
        leaps = [year for year in range(1, 31) if is_hijri_leap(year)]
        self.assertEqual(leaps, [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29])

    def test_vectors(self) -> None:
        for row in VECTORS["conversions"]:
            gy, gm, gd = (int(part) for part in row["gregorian"].split("-"))
            hy, hm, hd = (int(part) for part in row["hijri"].split("-"))
            self.assertEqual(gregorian_to_jdn(gy, gm, gd), row["jdn"])
            self.assertEqual(hijri_to_jdn(hy, hm, hd), row["jdn"])
        for row in VECTORS["ages"]:
            result = calculate_age(row["birth"], row["birthCalendar"], row["asOf"], row["asOfCalendar"])
            self.assertEqual(result["gregorianAge"], row["gregorianAge"])
            self.assertEqual(result["hijriAge"], row["hijriAge"])
            self.assertEqual(result["totalDays"], row["totalDays"])
            self.assertEqual(result["birth"]["gregorian"], row["birthGregorian"])
            self.assertEqual(result["birth"]["hijri"], row["birthHijri"])
            self.assertEqual(result["nextGregorianBirthday"]["date"], row["nextGregorianBirthday"])
            self.assertEqual(result["nextHijriBirthday"]["hijri"], row["nextHijriBirthday"])
            self.assertEqual(result["homepage"], "https://hisabaleumr.com/")

    def test_arabic_digits_and_rejection(self) -> None:
        result = calculate_age("١٩٩٠-٠٥-١٥", "gregorian", "٢٠٢٦-١١-٠٨")
        self.assertEqual(result["gregorianAge"], {"years": 36, "months": 5, "days": 24})
        with self.assertRaises(AgeError):
            calculate_age("1990-02-29")
        with self.assertRaises(AgeError):
            calculate_age("2026-11-08", as_of="1990-05-15")


if __name__ == "__main__":
    unittest.main()
