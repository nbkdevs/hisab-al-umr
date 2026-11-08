"""Command line for the Hisab Al-Umr age calculator."""

from __future__ import annotations

import argparse
import json
import sys

from hisab_age_calculator import VERSION, AgeError, calculate_age, format_report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="hisab-age-calculator",
        description="Gregorian and tabular civil Hijri age. Offline. No network.",
    )
    parser.add_argument("birth_pos", nargs="?", help="Birth date YYYY-MM-DD")
    parser.add_argument("--birth", dest="birth", help="Birth date YYYY-MM-DD")
    parser.add_argument(
        "--calendar",
        "--birth-calendar",
        dest="calendar",
        default="gregorian",
        help="Calendar of the birth date: gregorian or hijri",
    )
    parser.add_argument("--as-of", dest="as_of", help="As-of date YYYY-MM-DD (default: today)")
    parser.add_argument(
        "--as-of-calendar",
        dest="as_of_calendar",
        default="gregorian",
        help="Calendar of --as-of: gregorian or hijri",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON")
    parser.add_argument("--version", action="version", version=f"hisab-age-calculator {VERSION}")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    birth = args.birth or args.birth_pos
    if not birth:
        parser.print_help(sys.stderr)
        return 1
    try:
        result = calculate_age(birth, args.calendar, args.as_of, args.as_of_calendar)
    except AgeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(format_report(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
