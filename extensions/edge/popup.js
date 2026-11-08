"use strict";

const I18N = {
  ar: {
    title: "حاسبة العمر",
    subtitle: "هجري وميلادي، على هذا الجهاز",
    birth: "تاريخ الميلاد",
    calendar: "التقويم",
    gregorian: "ميلادي",
    hijri: "هجري",
    asof: "حتى تاريخ (اختياري)",
    calc: "احسب",
    gage: "العمر الميلادي",
    hage: "العمر الهجري",
    days: "الأيام",
    nextg: "الميلاد الميلادي القادم",
    nexth: "الميلاد الهجري القادم",
    years: "سنة",
    months: "أشهر",
    daysWord: "يومًا",
    after: "بعد",
    dayUnit: "يومًا",
    lang: "EN",
    invalid: "التاريخ غير صالح. استخدم YYYY-MM-DD.",
    future: "تاريخ «حتى» قبل تاريخ الميلاد.",
    epoch: "التاريخ أقدم من بداية التقويم الهجري الجدولي.",
    other: "تعذر الحساب.",
  },
  en: {
    title: "Hisab Age Calculator",
    subtitle: "Hijri and Gregorian, on this device",
    birth: "Date of birth",
    calendar: "Calendar",
    gregorian: "Gregorian",
    hijri: "Hijri",
    asof: "As of (optional)",
    calc: "Calculate",
    gage: "Gregorian age",
    hage: "Hijri age",
    days: "Days lived",
    nextg: "Next Gregorian birthday",
    nexth: "Next Hijri birthday",
    years: "years",
    months: "months",
    daysWord: "days",
    after: "in",
    dayUnit: "days",
    lang: "ع",
    invalid: "That date is not valid. Use YYYY-MM-DD.",
    future: "The as-of date is before the birth date.",
    epoch: "That date is before the tabular Hijri calendar begins.",
    other: "The age could not be calculated.",
  },
};

const html = document.documentElement;
const result = document.getElementById("result");
const note = document.getElementById("note");
let lang = "ar";

function text(id, value) {
  document.getElementById(id).textContent = value;
}

function applyLanguage() {
  const s = I18N[lang];
  html.lang = lang === "ar" ? "ar" : "en";
  html.dir = lang === "ar" ? "rtl" : "ltr";
  text("title", s.title);
  text("subtitle", s.subtitle);
  text("lbl-birth", s.birth);
  text("lbl-cal", s.calendar);
  text("opt-gregorian", s.gregorian);
  text("opt-hijri", s.hijri);
  text("lbl-asof", s.asof);
  text("calc", s.calc);
  text("lbl-gage", s.gage);
  text("lbl-hage", s.hage);
  text("lbl-days", s.days);
  text("lbl-nextg", s.nextg);
  text("lbl-nexth", s.nexth);
  text("lang", s.lang);
  note.textContent = lang === "ar" ? HisabAge.LIMITATION_AR : HisabAge.LIMITATION_EN;
}

function formatAge(part) {
  const s = I18N[lang];
  return `${part.years} ${s.years}, ${part.months} ${s.months}, ${part.days} ${s.daysWord}`;
}

function ltr(value) {
  return `\u200e${value}\u200e`;
}

function formatNext(date, days) {
  const s = I18N[lang];
  return `${ltr(date)} (${s.after} ${days} ${s.dayUnit})`;
}

function showError(error) {
  result.hidden = true;
  const s = I18N[lang];
  const code = error && error.code;
  if (code === "invalid-date" || code === "invalid-calendar") note.textContent = s.invalid;
  else if (code === "future-birth") note.textContent = s.future;
  else if (code === "before-hijri-epoch") note.textContent = s.epoch;
  else note.textContent = s.other;
}

document.getElementById("lang").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLanguage();
  if (!result.hidden) document.getElementById("form").requestSubmit();
});

document.getElementById("form").addEventListener("submit", (event) => {
  event.preventDefault();
  const birth = document.getElementById("birth").value;
  const calendar = document.getElementById("calendar").value;
  const asOfValue = document.getElementById("asof").value.trim();
  try {
    const age = HisabAge.calculateAge(birth, calendar, asOfValue || null);
    text("out-g", formatAge(age.gregorianAge));
    text("out-h", formatAge(age.hijriAge));
    text("out-days", String(age.totalDays));
    text("out-nextg", formatNext(age.nextGregorianBirthday.date, age.nextGregorianBirthday.daysUntil));
    text("out-nexth", `${ltr(age.nextHijriBirthday.hijri)} = ${ltr(age.nextHijriBirthday.gregorian)}`);
    result.hidden = false;
    note.textContent = lang === "ar" ? HisabAge.LIMITATION_AR : HisabAge.LIMITATION_EN;
  } catch (error) {
    showError(error);
  }
});

applyLanguage();
