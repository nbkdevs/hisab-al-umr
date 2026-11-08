"""Gregorian and tabular civil (Kuwaiti) Hijri age calculator.

Ages are whole years, months and days obtained by borrowing, not by dividing
the day count by 365. Hijri dates use the arithmetic civil calendar: a 30-year
cycle whose leap years are 2, 5, 7, 10, 13, 16, 18, 21, 24, 26 and 29.
1 Muharram 1 AH is Julian day 1948440 (Friday 19 July 622 CE). The table can
differ by ±1 day from crescent sighting and from Umm al-Qura.
"""

from __future__ import annotations

import datetime as _dt
import re
from typing import Mapping, Optional, Sequence, Tuple

VERSION = "1.0.0"
HOMEPAGE = "https://hisabaleumr.com/"
HIJRI_EPOCH_JDN = 1_948_440

LEAP_YEARS_IN_CYCLE = (2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29)
_LEAP_SET = frozenset(LEAP_YEARS_IN_CYCLE)

MONTHS_EN = (
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Ula",
    "Jumada al-Thani",
    "Rajab",
    "Shaban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qidah",
    "Dhu al-Hijjah",
)
MONTHS_AR = (
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الآخر",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
)
WEEKDAYS_EN = (
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
)
WEEKDAYS_AR = (
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
)

LIMITATION_EN = (
    "Tabular civil Hijri (Kuwaiti algorithm) counted with the Julian day number. "
    "It is not crescent sighting and not the Umm al-Qura calendar, so a date can differ by ±1 day."
)
LIMITATION_AR = (
    "التقويم الهجري هنا جدولي مدني (الخوارزمية الكويتية) بحساب رقم اليوم اليولياني، "
    "وليس رؤية الهلال ولا تقويم أم القرى، لذلك قد يختلف التاريخ بمقدار ±1 يوم."
)

_GREGORIAN_MONTH_DAYS = (0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
_DATE_RE = re.compile(r"^(\d{1,4})-(\d{1,2})-(\d{1,2})$")
_DIGITS = str.maketrans(
    {
        "٠": "0",
        "١": "1",
        "٢": "2",
        "٣": "3",
        "٤": "4",
        "٥": "5",
        "٦": "6",
        "٧": "7",
        "٨": "8",
        "٩": "9",
        "۰": "0",
        "۱": "1",
        "۲": "2",
        "۳": "3",
        "۴": "4",
        "۵": "5",
        "۶": "6",
        "۷": "7",
        "۸": "8",
        "۹": "9",
    }
)

Date = Tuple[int, int, int]


class AgeError(ValueError):
    """Invalid birth date, calendar, or as-of date."""

    def __init__(self, message: str, code: str, field: Optional[str] = None) -> None:
        super().__init__(message)
        self.code = code
        self.field = field


def normalize_digits(value: str) -> str:
    """Map Arabic-Indic (U+0660) and Extended Arabic-Indic (U+06F0) digits to ASCII."""
    return value.translate(_DIGITS).strip()


def is_gregorian_leap(year: int) -> bool:
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def is_hijri_leap(year: int) -> bool:
    """True when `year` is one of the 11 leap years in its 30-year cycle."""
    if year < 1:
        return False
    return (year % 30) in _LEAP_SET


def days_in_gregorian_month(year: int, month: int) -> int:
    if month == 2 and is_gregorian_leap(year):
        return 29
    if 1 <= month <= 12:
        return _GREGORIAN_MONTH_DAYS[month]
    return 0


def days_in_hijri_month(year: int, month: int) -> int:
    if month < 1 or month > 12:
        return 0
    if month % 2 == 1:
        return 30
    if month == 12 and is_hijri_leap(year):
        return 30
    return 29


def gregorian_to_jdn(year: int, month: int, day: int) -> int:
    """Fliegel–Van Flandern integer Julian day number (noon convention)."""
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    return day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045


def jdn_to_gregorian(jdn: int) -> Date:
    a = jdn + 32044
    b = (4 * a + 3) // 146097
    c = a - (146097 * b) // 4
    d = (4 * c + 3) // 1461
    e = c - (1461 * d) // 4
    m = (5 * e + 2) // 153
    day = e - (153 * m + 2) // 5 + 1
    month = m + 3 - 12 * (m // 10)
    year = 100 * b + d - 4800 + (m // 10)
    return year, month, day


def hijri_to_jdn(year: int, month: int, day: int) -> int:
    """Civil/Kuwaiti tabular Hijri. 1 Muharram 1 AH → JDN 1948440."""
    month_offset = 29 * (month - 1) + month // 2
    rd = day + month_offset + (year - 1) * 354 + (3 + 11 * year) // 30 + 227015 - 1
    return rd + 1_721_425


def jdn_to_hijri(jdn: int) -> Date:
    if jdn < HIJRI_EPOCH_JDN:
        raise AgeError(
            "Date is before the Hijri epoch (19 July 622 CE).",
            "before-hijri-epoch",
        )
    days = jdn - HIJRI_EPOCH_JDN
    year = (30 * days + 10646) // 10631
    if year < 1:
        year = 1
    while year > 1 and hijri_to_jdn(year, 1, 1) > jdn:
        year -= 1
    while hijri_to_jdn(year + 1, 1, 1) <= jdn:
        year += 1
    month = 1
    while month < 12 and hijri_to_jdn(year, month + 1, 1) <= jdn:
        month += 1
    day = jdn - hijri_to_jdn(year, month, 1) + 1
    return year, month, day


def weekday_from_jdn(jdn: int) -> int:
    """0 = Sunday … 6 = Saturday."""
    return (jdn + 1) % 7


def iso(date: Date) -> str:
    return f"{date[0]:04d}-{date[1]:02d}-{date[2]:02d}"


def canonical_calendar(name: str) -> str:
    key = normalize_digits(name).strip().lower()
    if key in {"gregorian", "g", "ce", "miladi", "ميلادي"}:
        return "gregorian"
    if key in {"hijri", "h", "ah", "islamic", "هجري"}:
        return "hijri"
    raise AgeError(
        "Calendar must be gregorian or hijri.",
        "invalid-calendar",
        "calendar",
    )


def _valid_gregorian(year: int, month: int, day: int) -> bool:
    if year < 1 or year > 9999 or month < 1 or month > 12:
        return False
    return 1 <= day <= days_in_gregorian_month(year, month)


def _valid_hijri(year: int, month: int, day: int) -> bool:
    if year < 1 or year > 9999 or month < 1 or month > 12:
        return False
    return 1 <= day <= days_in_hijri_month(year, month)


def parse_date(value: str, calendar: str, field: str = "date") -> Date:
    cleaned = normalize_digits(value)
    match = _DATE_RE.match(cleaned)
    if not match:
        raise AgeError(
            f"Could not read {field} as YYYY-MM-DD.",
            "invalid-date",
            field,
        )
    year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
    valid = _valid_gregorian(year, month, day) if calendar == "gregorian" else _valid_hijri(year, month, day)
    if not valid:
        raise AgeError(
            f"{field} is not a real {calendar} date.",
            "invalid-date",
            field,
        )
    return year, month, day


def to_jdn(date: Date, calendar: str) -> int:
    if calendar == "gregorian":
        return gregorian_to_jdn(*date)
    return hijri_to_jdn(*date)


def gregorian_date(date: Date, calendar: str) -> Date:
    if calendar == "gregorian":
        return date
    return jdn_to_gregorian(hijri_to_jdn(*date))


def hijri_date(date: Date, calendar: str) -> Date:
    if calendar == "hijri":
        return date
    return jdn_to_hijri(gregorian_to_jdn(*date))


def _previous_month(year: int, month: int) -> Date:
    if month == 1:
        return year - 1, 12, 1
    return year, month - 1, 1


def period_between(start: Date, end: Date, days_in_month) -> Tuple[int, int, int]:
    """Years, months and days from start to end, borrowing across short months.

    The loop matches civil date subtraction: if the day of the month has not
    been reached, borrow the length of the previous month, repeating when that
    month is still too short (31 January to 1 March, 29 February to 1 March).
    """
    years = end[0] - start[0]
    months = end[1] - start[1]
    days = end[2] - start[2]
    cursor_year, cursor_month = end[0], end[1]
    for _ in range(6):
        if days >= 0:
            break
        months -= 1
        cursor_year, cursor_month, _ = _previous_month(cursor_year, cursor_month)
        days += days_in_month(cursor_year, cursor_month)
    else:
        raise AgeError("Could not resolve the year/month/day age.", "internal")
    while months < 0:
        years -= 1
        months += 12
    return years, months, days


def anniversary(birth: Date, year: int, days_in_month) -> Date:
    """Birthday in `year`. 29 February becomes 1 March when February has 28 days.

    The same overflow applies to 30 Dhu al-Hijjah in a common Hijri year: the
    anniversary is 1 Muharram of the following year.
    """
    if birth[2] <= days_in_month(year, birth[1]):
        return year, birth[1], birth[2]
    overflow = birth[2] - days_in_month(year, birth[1])
    if birth[1] == 12:
        return year + 1, 1, overflow
    return year, birth[1] + 1, overflow


def next_anniversary(birth: Date, as_of: Date, days_in_month) -> Date:
    best: Optional[Date] = None
    for year in range(as_of[0] - 1, as_of[0] + 3):
        if year < 1:
            continue
        candidate = anniversary(birth, year, days_in_month)
        if candidate >= as_of and (best is None or candidate < best):
            best = candidate
    if best is None:
        raise AgeError("Could not find the next birthday.", "internal")
    return best


def _part(date: Date, calendar: str) -> Mapping[str, object]:
    greg = gregorian_date(date, calendar)
    hijri = hijri_date(date, calendar)
    jdn = gregorian_to_jdn(*greg)
    weekday = weekday_from_jdn(jdn)
    return {
        "gregorian": iso(greg),
        "hijri": iso(hijri),
        "hijriMonth": hijri[1],
        "hijriMonthEn": MONTHS_EN[hijri[1] - 1],
        "hijriMonthAr": MONTHS_AR[hijri[1] - 1],
        "weekday": weekday,
        "weekdayEn": WEEKDAYS_EN[weekday],
        "weekdayAr": WEEKDAYS_AR[weekday],
        "jdn": jdn,
    }


def calculate_age(
    birth: str,
    birth_calendar: str = "gregorian",
    as_of: Optional[str] = None,
    as_of_calendar: str = "gregorian",
    today: Optional[str] = None,
) -> dict:
    """Age in both calendars.

    `birth` and `as_of` are `YYYY-MM-DD`. Arabic-Indic digits are accepted.
    When `as_of` is omitted, the as-of date is today in the Gregorian calendar
    (the runtime's local date). Pass `today` only from tests.
    """
    birth_cal = canonical_calendar(birth_calendar)
    birth_date = parse_date(birth, birth_cal, "birth")
    if as_of is None:
        as_of_cal = "gregorian"
        as_of_text = today if today is not None else _dt.date.today().isoformat()
    else:
        as_of_cal = canonical_calendar(as_of_calendar)
        as_of_text = as_of
    as_of_date = parse_date(as_of_text, as_of_cal, "asOf")

    birth_jdn = to_jdn(birth_date, birth_cal)
    as_of_jdn = to_jdn(as_of_date, as_of_cal)
    if as_of_jdn < birth_jdn:
        raise AgeError("The as-of date is before the birth date.", "future-birth", "asOf")

    birth_g = gregorian_date(birth_date, birth_cal)
    as_of_g = gregorian_date(as_of_date, as_of_cal)
    birth_h = hijri_date(birth_date, birth_cal)
    as_of_h = hijri_date(as_of_date, as_of_cal)

    g_years, g_months, g_days = period_between(birth_g, as_of_g, days_in_gregorian_month)
    h_years, h_months, h_days = period_between(birth_h, as_of_h, days_in_hijri_month)

    next_g = next_anniversary(birth_g, as_of_g, days_in_gregorian_month)
    next_h = next_anniversary(birth_h, as_of_h, days_in_hijri_month)
    next_h_g = jdn_to_gregorian(hijri_to_jdn(*next_h))

    birth_part = _part(birth_date, birth_cal)
    as_of_part = _part(as_of_date, as_of_cal)
    return {
        "version": VERSION,
        "homepage": HOMEPAGE,
        "birth": birth_part,
        "asOf": as_of_part,
        "gregorianAge": {"years": g_years, "months": g_months, "days": g_days},
        "hijriAge": {"years": h_years, "months": h_months, "days": h_days},
        "totalDays": as_of_jdn - birth_jdn,
        "nextGregorianBirthday": {
            "date": iso(next_g),
            "daysUntil": gregorian_to_jdn(*next_g) - as_of_jdn,
        },
        "nextHijriBirthday": {
            "hijri": iso(next_h),
            "gregorian": iso(next_h_g),
            "hijriMonthEn": MONTHS_EN[next_h[1] - 1],
            "hijriMonthAr": MONTHS_AR[next_h[1] - 1],
            "daysUntil": hijri_to_jdn(*next_h) - as_of_jdn,
        },
        "leapDayBirth": birth_g[1] == 2 and birth_g[2] == 29,
        "calendar": "tabular-civil",
        "limitationEn": LIMITATION_EN,
        "limitationAr": LIMITATION_AR,
    }


def format_report(result: Mapping[str, object]) -> str:
    birth = result["birth"]
    as_of = result["asOf"]
    g = result["gregorianAge"]
    h = result["hijriAge"]
    nxt_g = result["nextGregorianBirthday"]
    nxt_h = result["nextHijriBirthday"]
    assert isinstance(birth, Mapping) and isinstance(as_of, Mapping)
    assert isinstance(g, Mapping) and isinstance(h, Mapping)
    assert isinstance(nxt_g, Mapping) and isinstance(nxt_h, Mapping)
    lines: Sequence[str] = (
        f"Hisab Al-Umr {VERSION}",
        f"Birth: {birth['gregorian']}  ·  {birth['hijri']} {birth['hijriMonthEn']} / {birth['hijriMonthAr']}  ·  {birth['weekdayEn']}",
        f"As of: {as_of['gregorian']}  ·  {as_of['hijri']} {as_of['hijriMonthEn']} / {as_of['hijriMonthAr']}  ·  {as_of['weekdayEn']}",
        f"Gregorian age: {g['years']} years, {g['months']} months, {g['days']} days",
        f"Hijri age: {h['years']} years, {h['months']} months, {h['days']} days",
        f"Total days: {result['totalDays']}",
        f"Next Gregorian birthday: {nxt_g['date']} ({nxt_g['daysUntil']} days)",
        f"Next Hijri birthday: {nxt_h['hijri']} = {nxt_h['gregorian']} ({nxt_h['daysUntil']} days)",
        str(result["limitationEn"]),
    )
    return "\n".join(lines)
