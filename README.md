# Hisab Al-Umr · حساب العمر

**العربية** · [English](#english)

حاسبة عمر تعمل على الجهاز بدون إنترنت: سنوات وأشهر وأيام بالتقويم الميلادي وبالتقويم الهجري الجدولي المدني، مع عدد الأيام وعيد الميلاد القادم في التقويمين. يوم 29 فبراير يُحتسب في 1 مارس عندما لا تكون السنة كبيسة. التاريخ الهجري حسابي (الخوارزمية الكويتية) وقد يختلف بيوم عن رؤية الهلال وعن تقويم أم القرى.

الموقع: [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/).

## English

Offline age calculator for the Gregorian calendar and the tabular civil (Kuwaiti) Hijri calendar. The age is whole years, then months, then days, with borrowing across real month lengths. It is not the day count divided by 365. You also get the total days lived and the next birthday in both calendars.

1 Ramadan 1420 AH is 9 December 1999 CE in this table, one day from the often-cited 8 December 1999. 1 January 2000 CE is 24 Ramadan 1420 AH. The full vectors are in [`packages/SPEC.md`](packages/SPEC.md).

| Folder | What | Test |
|---|---|---|
| `packages/packagist` | PHP library `hisabaleumr/age-calculator` and CLI. Packagist metadata is the root `composer.json` | `composer test` |
| `packages/npm` | `hisab-age-calculator` | `npm test` |
| `packages/pypi` | `hisab-age-calculator` | `python3 -m unittest discover -s packages/pypi/tests` |
| `packages/crates` | `hisab-age-calculator` | `cargo test` |
| `packages/pub` | `hisab_age_calculator` | `dart test` |
| `packages/nuget` | `HisabAlUmr.AgeCalculator` | `dotnet run --project packages/nuget/tests` |
| `packages/rubygems` | `hisab-age-calculator` | `ruby -Ilib test/test_hisab_age_calculator.rb` |
| `packages/docker` | Local JSON API and the static page. Not pushed | `npm test` |
| `packages/hf-space` | Static page for a later upload | open `index.html` |
| `skills/hisab-age-calculator` | Agent skill | — |
| `extensions/edge` | Edge MV3 popup. Listing submitted, In Review | `node --test extensions/edge/test/extension.test.js` |

This repository does not submit packages. What is already live is listed in [`STATUS.md`](STATUS.md).

## PHP library

Packagist name: `hisabaleumr/age-calculator`. Homepage: `https://hisabaleumr.com/`. The package is live at https://packagist.org/packages/hisabaleumr/age-calculator. From this checkout:

```sh
composer install
php packages/packagist/bin/hisab-age-calculator --birth 1990-05-15 --as-of 2026-11-08
php packages/packagist/bin/hisab-age-calculator --birth 1420-09-01 --calendar hijri --as-of 2026-11-08 --json
```

```php
<?php

require __DIR__ . '/vendor/autoload.php';

use HisabAlUmr\AgeCalculator\AgeCalculator;

$result = AgeCalculator::calculate('1990-05-15', 'gregorian', '2026-11-08');
// 36 years, 5 months, 24 days. 13326 days.
// Hijri birth 1410-10-19 (Shawwal). Hijri age 37 years, 7 months, 8 days.

$result = AgeCalculator::calculate('١٤٢٠-٠٩-٠١', 'hijri', '2026-11-08');
```

`calculate($birth, $birthCalendar = 'gregorian', $asOf = null, $asOfCalendar = 'gregorian')` accepts `gregorian` or `hijri`. Omit `$asOf` to use today in the runtime's local timezone. Arabic-Indic digits are accepted. The result array includes `gregorianAge`, `hijriAge`, `totalDays`, `nextGregorianBirthday`, and `nextHijriBirthday`. `homepage` is `https://hisabaleumr.com/`.

Install the published package with `composer require hisabaleumr/age-calculator`.

## Other libraries

Each package exposes the same calculation and a small CLI named `hisab-age-calculator` (`hisab_age_calculator` on pub). Examples:

```js
const { calculateAge } = require("hisab-age-calculator");
calculateAge("1990-05-15", "gregorian", "2026-11-08");
```

```python
from hisab_age_calculator import calculate_age
calculate_age("1990-05-15", as_of="2026-11-08")
```

```rust
hisab_age_calculator::calculate_age("1990-05-15", "gregorian", Some("2026-11-08"), "gregorian")?;
```

The Rust CLI uses the UTC date when `--as-of` is omitted. The other CLIs use the local date.

## Related install

A container is already on Docker Hub. This repository does not push images.

```sh
docker pull iamnazzal/hisab-age-calculator:1.0.0
docker run --rm -p 8787:8787 iamnazzal/hisab-age-calculator:1.0.0
```

`POST /api/v1/age` with `{"birth":"1990-05-15","asOf":"2026-11-08"}`. The image is offline and uses tabular civil Hijri. Hub tag 1.0.0 observes 29 February on 28 February in a common year. The source in `packages/docker` follows this repository instead: 29 February is observed on 1 March. Build that image locally only; do not push it.

`packages/docker` also answers `GET /api/health` and `POST /api/v1/difference`, `/api/v1/countdown`, `/api/v1/age-on`, and `/api/v1/hijri`.

Firefox add-on `hisab-age-calculator` 1.0.0 by NBK Apps is awaiting Mozilla review. The Amazon Appstore listing for Hisab Age Calculator is In Review (`amzn1.devportal.mobileapp.63995c2c6a9946a09acf33df67bee266`). Neither is a live store page. This repository does not add a second extension or an Android app.

## Links

- [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/)
- Privacy: [سياسة الخصوصية](https://hisabaleumr.com/سياسة-الخصوصية/) · [`PRIVACY.md`](PRIVACY.md)
- Contact: [اتصل بنا](https://hisabaleumr.com/اتصل-بنا/)

## Elsewhere

Packagist and the GitLab mirror are live. The Edge Add-ons listing for Hisab Age Calculator is In Review; the store page may not be public until publication. npm, PyPI, crates.io, pub.dev, NuGet, and RubyGems in the table above are source only and were not submitted. Hugging Face is not submitted.

- Packagist: https://packagist.org/packages/hisabaleumr/age-calculator
- GitLab: https://gitlab.com/nbkdevs/hisab-al-umr
- Edge Add-ons (In Review): https://microsoftedge.microsoft.com/addons/detail/hisab-age-calculator/cicfkemnfcippdbiknioffcbcedifeeo
- Docker Hub: https://hub.docker.com/r/iamnazzal/hisab-age-calculator
- Design Nominees: https://www.designnominees.com/sites/hisabalumr
- Product Hunt: https://www.producthunt.com/products/hisabalumr

## License

MIT © Hisab Al-Umr
