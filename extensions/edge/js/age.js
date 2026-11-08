"use strict";

/**
 * Gregorian and tabular civil (Kuwaiti) Hijri age calculator.
 * Years, months and days are borrowed across real month lengths.
 * 29 February is observed on 1 March in a common year.
 * The Hijri table can differ by ±1 day from crescent sighting and Umm al-Qura.
 * Vendored from packages/npm/lib/index.js for the Edge package.
 * The homepage string is omitted so this package does not name a website.
 */

const VERSION = "1.0.0";
const HOMEPAGE = "";
const HIJRI_EPOCH_JDN = 1948440;
const LEAP_YEARS_IN_CYCLE = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
const LEAP_SET = new Set(LEAP_YEARS_IN_CYCLE);
const MONTHS_EN = [
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
];
const MONTHS_AR = [
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
];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const LIMITATION_EN =
  "Tabular civil Hijri (Kuwaiti algorithm) counted with the Julian day number. It is not crescent sighting and not the Umm al-Qura calendar, so a date can differ by ±1 day.";
const LIMITATION_AR =
  "التقويم الهجري هنا جدولي مدني (الخوارزمية الكويتية) بحساب رقم اليوم اليولياني، وليس رؤية الهلال ولا تقويم أم القرى، لذلك قد يختلف التاريخ بمقدار ±1 يوم.";
const DIGITS = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

class AgeError extends Error {
  constructor(message, code, field) {
    super(message);
    this.name = "AgeError";
    this.code = code;
    this.field = field || null;
  }
}

function normalizeDigits(value) {
  return String(value)
    .replace(/[٠-٩۰-۹]/g, (ch) => DIGITS[ch])
    .trim();
}

function isGregorianLeap(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isHijriLeap(year) {
  return year >= 1 && LEAP_SET.has(year % 30);
}

function daysInGregorianMonth(year, month) {
  if (month === 2 && isGregorianLeap(year)) return 29;
  return [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] || 0;
}

function daysInHijriMonth(year, month) {
  if (month < 1 || month > 12) return 0;
  if (month % 2 === 1) return 30;
  if (month === 12 && isHijriLeap(year)) return 30;
  return 29;
}

function gregorianToJdn(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function jdnToGregorian(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return [year, month, day];
}

function hijriToJdn(year, month, day) {
  const monthOffset = 29 * (month - 1) + Math.floor(month / 2);
  const rd = day + monthOffset + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + 227015 - 1;
  return rd + 1721425;
}

function jdnToHijri(jdn) {
  if (jdn < HIJRI_EPOCH_JDN) {
    throw new AgeError("Date is before the Hijri epoch (19 July 622 CE).", "before-hijri-epoch");
  }
  const days = jdn - HIJRI_EPOCH_JDN;
  let year = Math.floor((30 * days + 10646) / 10631);
  if (year < 1) year = 1;
  while (year > 1 && hijriToJdn(year, 1, 1) > jdn) year -= 1;
  while (hijriToJdn(year + 1, 1, 1) <= jdn) year += 1;
  let month = 1;
  while (month < 12 && hijriToJdn(year, month + 1, 1) <= jdn) month += 1;
  const day = jdn - hijriToJdn(year, month, 1) + 1;
  return [year, month, day];
}

function weekdayFromJdn(jdn) {
  return (jdn + 1) % 7;
}

function iso(date) {
  const [year, month, day] = date;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function canonicalCalendar(name) {
  const key = normalizeDigits(name).toLowerCase();
  if (["gregorian", "g", "ce", "miladi", "ميلادي"].includes(key)) return "gregorian";
  if (["hijri", "h", "ah", "islamic", "هجري"].includes(key)) return "hijri";
  throw new AgeError("Calendar must be gregorian or hijri.", "invalid-calendar", "calendar");
}

function parseDate(value, calendar, field) {
  const cleaned = normalizeDigits(value);
  const match = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(cleaned);
  if (!match) throw new AgeError(`Could not read ${field} as YYYY-MM-DD.`, "invalid-date", field);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const limit = calendar === "gregorian" ? daysInGregorianMonth(year, month) : daysInHijriMonth(year, month);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > limit) {
    throw new AgeError(`${field} is not a real ${calendar} date.`, "invalid-date", field);
  }
  return [year, month, day];
}

function toJdn(date, calendar) {
  return calendar === "gregorian" ? gregorianToJdn(...date) : hijriToJdn(...date);
}

function gregorianDate(date, calendar) {
  return calendar === "gregorian" ? date : jdnToGregorian(hijriToJdn(...date));
}

function hijriDate(date, calendar) {
  return calendar === "hijri" ? date : jdnToHijri(gregorianToJdn(...date));
}

function periodBetween(start, end, daysInMonth) {
  let years = end[0] - start[0];
  let months = end[1] - start[1];
  let days = end[2] - start[2];
  let cursorYear = end[0];
  let cursorMonth = end[1];
  for (let guard = 0; days < 0; guard += 1) {
    if (guard > 5) throw new AgeError("Could not resolve the year/month/day age.", "internal");
    months -= 1;
    if (cursorMonth === 1) {
      cursorYear -= 1;
      cursorMonth = 12;
    } else {
      cursorMonth -= 1;
    }
    days += daysInMonth(cursorYear, cursorMonth);
  }
  while (months < 0) {
    years -= 1;
    months += 12;
  }
  return [years, months, days];
}

function anniversary(birth, year, daysInMonth) {
  if (birth[2] <= daysInMonth(year, birth[1])) return [year, birth[1], birth[2]];
  const overflow = birth[2] - daysInMonth(year, birth[1]);
  if (birth[1] === 12) return [year + 1, 1, overflow];
  return [year, birth[1] + 1, overflow];
}

function compareDate(a, b) {
  if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
  if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
  if (a[2] !== b[2]) return a[2] < b[2] ? -1 : 1;
  return 0;
}

function nextAnniversary(birth, asOf, daysInMonth) {
  let best = null;
  for (let year = asOf[0] - 1; year <= asOf[0] + 2; year += 1) {
    if (year < 1) continue;
    const candidate = anniversary(birth, year, daysInMonth);
    if (compareDate(candidate, asOf) >= 0 && (best === null || compareDate(candidate, best) < 0)) {
      best = candidate;
    }
  }
  if (!best) throw new AgeError("Could not find the next birthday.", "internal");
  return best;
}

function part(date, calendar) {
  const greg = gregorianDate(date, calendar);
  const hijri = hijriDate(date, calendar);
  const jdn = gregorianToJdn(...greg);
  const weekday = weekdayFromJdn(jdn);
  return {
    gregorian: iso(greg),
    hijri: iso(hijri),
    hijriMonth: hijri[1],
    hijriMonthEn: MONTHS_EN[hijri[1] - 1],
    hijriMonthAr: MONTHS_AR[hijri[1] - 1],
    weekday,
    weekdayEn: WEEKDAYS_EN[weekday],
    weekdayAr: WEEKDAYS_AR[weekday],
    jdn,
  };
}

function todayIso() {
  const now = new Date();
  return iso([now.getFullYear(), now.getMonth() + 1, now.getDate()]);
}

function calculateAge(birth, birthCalendar = "gregorian", asOf = null, asOfCalendar = "gregorian", today = null) {
  const birthCal = canonicalCalendar(birthCalendar);
  const birthDate = parseDate(birth, birthCal, "birth");
  let asOfCal;
  let asOfText;
  if (asOf === null || asOf === undefined) {
    asOfCal = "gregorian";
    asOfText = today || todayIso();
  } else {
    asOfCal = canonicalCalendar(asOfCalendar);
    asOfText = asOf;
  }
  const asOfDate = parseDate(asOfText, asOfCal, "asOf");
  const birthJdn = toJdn(birthDate, birthCal);
  const asOfJdn = toJdn(asOfDate, asOfCal);
  if (asOfJdn < birthJdn) {
    throw new AgeError("The as-of date is before the birth date.", "future-birth", "asOf");
  }
  const birthG = gregorianDate(birthDate, birthCal);
  const asOfG = gregorianDate(asOfDate, asOfCal);
  const birthH = hijriDate(birthDate, birthCal);
  const asOfH = hijriDate(asOfDate, asOfCal);
  const [gYears, gMonths, gDays] = periodBetween(birthG, asOfG, daysInGregorianMonth);
  const [hYears, hMonths, hDays] = periodBetween(birthH, asOfH, daysInHijriMonth);
  const nextG = nextAnniversary(birthG, asOfG, daysInGregorianMonth);
  const nextH = nextAnniversary(birthH, asOfH, daysInHijriMonth);
  const nextHg = jdnToGregorian(hijriToJdn(...nextH));
  return {
    version: VERSION,
    homepage: HOMEPAGE,
    birth: part(birthDate, birthCal),
    asOf: part(asOfDate, asOfCal),
    gregorianAge: { years: gYears, months: gMonths, days: gDays },
    hijriAge: { years: hYears, months: hMonths, days: hDays },
    totalDays: asOfJdn - birthJdn,
    nextGregorianBirthday: {
      date: iso(nextG),
      daysUntil: gregorianToJdn(...nextG) - asOfJdn,
    },
    nextHijriBirthday: {
      hijri: iso(nextH),
      gregorian: iso(nextHg),
      hijriMonthEn: MONTHS_EN[nextH[1] - 1],
      hijriMonthAr: MONTHS_AR[nextH[1] - 1],
      daysUntil: hijriToJdn(...nextH) - asOfJdn,
    },
    leapDayBirth: birthG[1] === 2 && birthG[2] === 29,
    calendar: "tabular-civil",
    limitationEn: LIMITATION_EN,
    limitationAr: LIMITATION_AR,
  };
}

function formatReport(result) {
  const { birth, asOf, gregorianAge: g, hijriAge: h, nextGregorianBirthday: nextG, nextHijriBirthday: nextH } = result;
  return [
    `Hisab Al-Umr ${VERSION}`,
    `Birth: ${birth.gregorian}  ·  ${birth.hijri} ${birth.hijriMonthEn} / ${birth.hijriMonthAr}  ·  ${birth.weekdayEn}`,
    `As of: ${asOf.gregorian}  ·  ${asOf.hijri} ${asOf.hijriMonthEn} / ${asOf.hijriMonthAr}  ·  ${asOf.weekdayEn}`,
    `Gregorian age: ${g.years} years, ${g.months} months, ${g.days} days`,
    `Hijri age: ${h.years} years, ${h.months} months, ${h.days} days`,
    `Total days: ${result.totalDays}`,
    `Next Gregorian birthday: ${nextG.date} (${nextG.daysUntil} days)`,
    `Next Hijri birthday: ${nextH.hijri} = ${nextH.gregorian} (${nextH.daysUntil} days)`,
    result.limitationEn,
  ].join("\n");
}

const api = {
  VERSION,
  HOMEPAGE,
  HIJRI_EPOCH_JDN,
  LEAP_YEARS_IN_CYCLE,
  MONTHS_EN,
  MONTHS_AR,
  LIMITATION_EN,
  LIMITATION_AR,
  AgeError,
  normalizeDigits,
  isGregorianLeap,
  isHijriLeap,
  daysInGregorianMonth,
  daysInHijriMonth,
  gregorianToJdn,
  jdnToGregorian,
  hijriToJdn,
  jdnToHijri,
  weekdayFromJdn,
  calculateAge,
  formatReport,
};

if (typeof module === "object" && module.exports) {
  module.exports = api;
}
if (typeof globalThis !== "undefined") {
  globalThis.HisabAge = api;
}
