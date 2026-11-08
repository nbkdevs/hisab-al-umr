"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const age = require("../lib/index.js");

const vectors = JSON.parse(fs.readFileSync(path.join(__dirname, "../../vectors.json"), "utf8"));

test("leap years and known conversions", () => {
  assert.deepEqual(age.LEAP_YEARS_IN_CYCLE, vectors.leapYearsInCycle);
  assert.equal(age.gregorianToJdn(2000, 1, 1), 2451545);
  assert.equal(age.hijriToJdn(1420, 9, 1), 2451522);
  assert.deepEqual(age.jdnToGregorian(2451522), [1999, 12, 9]);
  assert.deepEqual(age.jdnToHijri(age.gregorianToJdn(2000, 1, 1)), [1420, 9, 24]);
  assert.equal(age.HOMEPAGE, "https://hisabaleumr.com/");
  assert.match(age.LIMITATION_EN, /Umm al-Qura/);
  assert.match(age.LIMITATION_EN, /±1/);
});

test("shared vectors", () => {
  for (const row of vectors.conversions) {
    const [gy, gm, gd] = row.gregorian.split("-").map(Number);
    const [hy, hm, hd] = row.hijri.split("-").map(Number);
    assert.equal(age.gregorianToJdn(gy, gm, gd), row.jdn);
    assert.equal(age.hijriToJdn(hy, hm, hd), row.jdn);
    assert.equal(age.weekdayFromJdn(row.jdn), row.weekday);
  }
  for (const row of vectors.ages) {
    const result = age.calculateAge(row.birth, row.birthCalendar, row.asOf, row.asOfCalendar);
    assert.deepEqual(result.gregorianAge, row.gregorianAge);
    assert.deepEqual(result.hijriAge, row.hijriAge);
    assert.equal(result.totalDays, row.totalDays);
    assert.equal(result.birth.gregorian, row.birthGregorian);
    assert.equal(result.birth.hijri, row.birthHijri);
    assert.equal(result.nextGregorianBirthday.date, row.nextGregorianBirthday);
    assert.equal(result.nextGregorianBirthday.daysUntil, row.daysUntilGregorianBirthday);
    assert.equal(result.nextHijriBirthday.hijri, row.nextHijriBirthday);
    assert.equal(result.nextHijriBirthday.gregorian, row.nextHijriBirthdayGregorian);
    assert.equal(result.nextHijriBirthday.daysUntil, row.daysUntilHijriBirthday);
    assert.equal(result.homepage, "https://hisabaleumr.com/");
  }
});

test("arabic digits, february overflow, and rejections", () => {
  const result = age.calculateAge("١٩٩٠-٠٥-١٥", "gregorian", "٢٠٢٦-١١-٠٨");
  assert.deepEqual(result.gregorianAge, { years: 36, months: 5, days: 24 });
  const turned = age.calculateAge("2000-02-29", "gregorian", "2023-03-01");
  assert.deepEqual(turned.gregorianAge, { years: 23, months: 0, days: 0 });
  assert.equal(turned.nextGregorianBirthday.date, "2023-03-01");
  assert.throws(() => age.calculateAge("1990-02-29"), /not a real/);
  assert.throws(() => age.calculateAge("2026-01-01", "gregorian", "2000-01-01"), /before the birth/);
});
