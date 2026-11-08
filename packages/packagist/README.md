# hisabaleumr/age-calculator

PHP library and `hisab-age-calculator` CLI for [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/).

The Packagist metadata is the repository root `composer.json` (`hisabaleumr/age-calculator`, homepage `https://hisabaleumr.com/`). Submission is pending.

```php
use HisabAlUmr\AgeCalculator\AgeCalculator;

$result = AgeCalculator::calculate('1990-05-15', 'gregorian', '2026-11-08');
```

```sh
php packages/packagist/bin/hisab-age-calculator --birth 1990-05-15 --as-of 2026-11-08
```

Tabular civil Hijri (Kuwaiti algorithm). A date can differ by ±1 day from crescent sighting and from Umm al-Qura. 29 February is observed on 1 March in a common year. This package is not published from this repository.

## Links

- [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/)
- Privacy: [سياسة الخصوصية](https://hisabaleumr.com/سياسة-الخصوصية/)
- Contact: [اتصل بنا](https://hisabaleumr.com/اتصل-بنا/)

