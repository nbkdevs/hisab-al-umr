# Edge Add-ons listing

Type these fields into Microsoft Partner Center. Do not submit the package from this repository. The submission zip does not contain this file or these URLs, and the popup does not link to a website.

This is an Edge extension only. It is not a second Firefox add-on. The Firefox listing already uses the name Hisab Age Calculator and stays as it is.

## Name

Hisab Age Calculator

## Short description

Offline Hijri and Gregorian age in years, months, and days. Runs on the device with no network access.

## Full description

Hisab Age Calculator works out an age in the Gregorian calendar and the tabular civil Hijri calendar. Type a date of birth in either calendar, and an optional as-of date. Arabic-Indic digits are accepted. The result is whole years, months, and days, using each calendar's real month lengths rather than dividing the day count by 365. It also shows the total number of days lived and the next birthday in both calendars.

A birthday on 29 February is observed on 1 March when the year is not a leap year.

Hijri dates follow a fixed arithmetic table, the civil Kuwaiti 30-year cycle. A date can differ by one day from crescent sighting and from the Umm al-Qura calendar. The extension does not use the network, analytics, or remote fonts. The popup opens in Arabic, right to left, and can be switched to English.

## Privacy URL

https://hisabaleumr.com/سياسة-الخصوصية/

## Homepage URL

https://hisabaleumr.com/

## Support URL

https://hisabaleumr.com/اتصل-بنا/

## Single-purpose statement

This extension has one purpose: it calculates an age in the Gregorian calendar and the tabular civil Hijri calendar from dates typed into the popup.

## Permission justifications

No permissions are requested. `permissions` is `[]`. There is no host permission, no storage permission, and no remote code.

| Permission | Justification |
|---|---|
| (none) | The extension does not read browsing data, does not open network connections, and does not save the date of birth. |

## Store images

- 128×128 logo: `extensions/edge/store/icon128.png` (also packaged as `icons/icon128.png`)
- 300×300 logo: `extensions/edge/store/icon300.png`
- 1280×800 screenshot: `extensions/edge/store/screenshot-1280x800.png`

## Certification and test notes

Package: `extensions/edge/hisab-age-calculator-edge-1.0.0.zip`

1. Load the unpacked `extensions/edge` folder, or install the zip. Open the toolbar popup. It should show an Arabic, right-to-left form and make no network request.
2. Leave the language in Arabic. Calendar: Gregorian (ميلادي). Birth: `1990-05-15`. As of: `2026-11-08`. Press calculate (احسب).
3. Expected Gregorian age: 36 years, 5 months, 24 days. Total days: 13326. The note under the result says the Hijri table can differ by ±1 day from crescent sighting and from Umm al-Qura.
4. Optional check: birth `2000-02-29`, as of `2023-03-01`. Expected age: 23 years, 0 months, 0 days. The next Gregorian birthday is 2023-03-01, because 29 February is observed on 1 March in a common year.
5. Optional check: switch the calendar to Hijri and enter birth `١٤٢٠-٠٩-٠١` with as of `1999-12-09`. Expected age: 0 years, 0 months, 0 days.
6. Confirm the popup has no link and does not name a website. The EN button switches the same form to English.

Automated check from the repo root:

```sh
node --test extensions/edge/test/extension.test.js
```
