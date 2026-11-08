# Age calculator specification

Shared by every package in this repository. Machine-readable cases live in [`vectors.json`](vectors.json).

The Hijri dates are the **tabular civil calendar** (the Kuwaiti arithmetic table), not crescent sighting and not the Saudi Umm al-Qura calendar. A converted date can differ by **±1 day**.

## Calendars

Gregorian leap years are years divisible by 4, except century years, which are leap years only when divisible by 400.

Hijri months alternate 30 and 29 days. Odd months have 30 days. Even months have 29 days, and Dhu al-Hijjah (month 12) has 30 days in a leap year. Leap years in each 30-year cycle are:

`2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29`

Year `Y` is leap when `(11Y + 14) mod 30 < 11`, which is the same set. `Y mod 30 = 0` (year 30 of the cycle) is not a leap year.

Both calendars meet on the Julian day number. 1 Muharram 1 AH is **JDN 1948440**, Friday **19 July 622 CE** (proleptic Gregorian; 16 July 622 Julian). Weekday `0` is Sunday.

```
gregorian_jdn(Y, M, D) =
    a = (14 - M) // 12
    y = Y + 4800 - a
    m = M + 12a - 3
    D + (153m + 2) // 5 + 365y + y // 4 - y // 100 + y // 400 - 32045

hijri_jdn(Y, M, D) =
    offset = 29(M - 1) + M // 2
    rd = D + offset + (Y - 1) * 354 + (3 + 11Y) // 30 + 227015 - 1
    rd + 1721425
```

`1721425` is the offset between this rata-die count and the Julian day number (`JDN(0001-01-01) = 1721426`).

## Age

Age is whole years, then whole months, then days. It is not `totalDays / 365`.

```
years  = end.year - start.year
months = end.month - start.month
days   = end.day - start.day
while days < 0:
    months -= 1
    move the cursor to the previous month of the end date
    days += length of that month
while months < 0:
    years -= 1
    months += 12
```

Borrowing repeats when one short month is not enough (31 January to 1 March). The same steps run once on the Gregorian dates and once on the Hijri dates. `totalDays` is the Julian-day difference and is the same either way.

## Birthdays

The next birthday is the soonest anniversary on or after the as-of date, so a birthday today has `daysUntil = 0`.

If the day does not exist in that month, the extra days spill into the next month. **29 February becomes 1 March** in a common year. **30 Dhu al-Hijjah becomes 1 Muharram** of the next Hijri year when that year is not a leap year.

Input dates are `YYYY-MM-DD` in either calendar. Arabic-Indic digits `٠١٢٣٤٥٦٧٨٩` and Extended Arabic-Indic digits `۰۱۲۳۴۵۶۷۸۹` are accepted. An as-of date before the birth date is an error.

## Checked conversions

| Hijri | Gregorian | JDN | Note |
|---|---|---|---|
| 0001-01-01 | 0622-07-19 | 1948440 | Friday, civil epoch |
| 1420-09-01 | 1999-12-09 | 2451522 | 1 Ramadan 1420. One day from the often-cited 8 December 1999 |
| 1420-09-24 | 2000-01-01 | 2451545 | 24 Ramadan 1420. Saturday |

## Checked ages

| Birth | As of | Gregorian age | Days |
|---|---|---|---|
| 1990-05-15 CE | 2026-11-08 CE | 36 years, 5 months, 24 days | 13326 |
| 2000-01-01 CE | 2026-10-04 CE | 26 years, 9 months, 3 days | 9773 |
| 2000-02-29 CE | 2023-02-28 CE | 22 years, 11 months, 30 days | 8400 |
| 2000-02-29 CE | 2023-03-01 CE | 23 years, 0 months, 0 days | 8401 |
| 2-12-30 AH | 4-01-01 AH | Hijri age 1 year, 0 months, 0 days | 355 |

1990-05-15 CE is 19 Shawwal 1410 AH in this table (1410-10-19). On 2026-11-08 CE (27 Jumada al-Ula 1448 AH) the Hijri age is 37 years, 7 months, 8 days. The next Gregorian birthday is 2027-05-15 (188 days). The next Hijri birthday is 1448-10-19, which is 2027-03-28 (140 days).

The published Docker Hub tag `iamnazzal/hisab-age-calculator:1.0.0` uses an end-of-month clamp, so it observes 29 February on 28 February. This repository uses the overflow rule above (1 March). Gregorian ages for births that are not on the 29th, 30th, or 31st match ordinary civil subtraction either way. The sample `1990-05-15` as of `2026-11-08` is 36 years, 5 months, 24 days in both.
