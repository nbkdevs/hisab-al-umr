#!/usr/bin/env node
"use strict";

const { VERSION, AgeError, calculateAge, formatReport } = require("../lib/index.js");

function usage() {
  return `hisab-age-calculator — Gregorian and tabular civil Hijri age

Usage:
  hisab-age-calculator --birth 1990-05-15 [--as-of 2026-11-08] [--json]
  hisab-age-calculator --birth 1420-09-01 --calendar hijri
`;
}

function main(argv) {
  let birth = null;
  let calendar = "gregorian";
  let asOf = null;
  let asOfCalendar = "gregorian";
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--help" || arg === "-h") {
      process.stdout.write(usage());
      return 0;
    }
    if (arg === "--version") {
      process.stdout.write(`hisab-age-calculator ${VERSION}\n`);
      return 0;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (["--birth", "--calendar", "--birth-calendar", "--as-of", "--as-of-calendar"].includes(arg)) {
      if (next === undefined) {
        process.stderr.write(`Missing value for ${arg}.\n`);
        return 1;
      }
      if (arg === "--birth") birth = next;
      if (arg === "--calendar" || arg === "--birth-calendar") calendar = next;
      if (arg === "--as-of") asOf = next;
      if (arg === "--as-of-calendar") asOfCalendar = next;
      i += 1;
      continue;
    }
    if (!arg.startsWith("-") && birth === null) {
      birth = arg;
      continue;
    }
    process.stderr.write(`Unknown argument ${arg}.\n`);
    return 1;
  }
  if (!birth) {
    process.stderr.write("Pass a birth date, for example: hisab-age-calculator --birth 1990-05-15\n");
    return 1;
  }
  try {
    const result = calculateAge(birth, calendar, asOf, asOfCalendar);
    process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : `${formatReport(result)}\n`);
    return 0;
  } catch (error) {
    if (error instanceof AgeError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { main };
