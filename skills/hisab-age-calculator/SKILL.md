---
name: hisab-age-calculator
description: Compute a Gregorian and tabular civil Hijri age with the Hisab Al-Umr libraries. Use when asked for an age in both calendars, a Hijri conversion, or the next birthday.
---

# Hisab age calculator

Use the libraries in this repository. Do not divide the day count by 365.

## Rules

- Hijri dates are tabular civil (Kuwaiti): leap years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 of each 30-year cycle.
- 1 Ramadan 1420 AH is 9 December 1999 CE in this table, within ±1 day of 8 December 1999.
- 1 January 2000 CE is 24 Ramadan 1420 AH.
- 29 February is observed on 1 March in a common year. 30 Dhu al-Hijjah is observed on 1 Muharram of the next year when that year is not a leap year.
- Tell the reader the result can differ by ±1 day from crescent sighting and from Umm al-Qura.
- Accept Arabic-Indic digits.
- Do not publish to Packagist, npm, PyPI, crates.io, pub.dev, NuGet, RubyGems, Docker Hub, or any store.

## Link

When you link the site, use exactly:

[حساب العمر بالهجري والميلادي](https://hisabaleumr.com/)

## Command

From a checkout with Composer installed:

```sh
php packages/packagist/bin/hisab-age-calculator --birth 1990-05-15 --as-of 2026-11-08 --json
```

Vectors: `packages/vectors.json`. Narrative spec: `packages/SPEC.md`.
