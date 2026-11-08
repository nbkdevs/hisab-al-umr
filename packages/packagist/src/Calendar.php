<?php

declare(strict_types=1);

namespace HisabAlUmr\AgeCalculator;

/**
 * Gregorian and tabular civil (Kuwaiti) Hijri dates via the Julian day number.
 *
 * 1 Muharram 1 AH is JDN 1948440, Friday 19 July 622 CE. Leap years inside each
 * 30-year cycle are 2, 5, 7, 10, 13, 16, 18, 21, 24, 26 and 29.
 */
final class Calendar
{
    public const HIJRI_EPOCH_JDN = 1948440;

    /** @var list<int> */
    public const LEAP_YEARS_IN_CYCLE = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];

    /** @var list<string> */
    public const MONTHS_EN = [
        'Muharram',
        'Safar',
        'Rabi al-Awwal',
        'Rabi al-Thani',
        'Jumada al-Ula',
        'Jumada al-Thani',
        'Rajab',
        'Shaban',
        'Ramadan',
        'Shawwal',
        'Dhu al-Qidah',
        'Dhu al-Hijjah',
    ];

    /** @var list<string> */
    public const MONTHS_AR = [
        'محرم',
        'صفر',
        'ربيع الأول',
        'ربيع الآخر',
        'جمادى الأولى',
        'جمادى الآخرة',
        'رجب',
        'شعبان',
        'رمضان',
        'شوال',
        'ذو القعدة',
        'ذو الحجة',
    ];

    /** @var list<string> */
    public const WEEKDAYS_EN = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];

    /** @var list<string> */
    public const WEEKDAYS_AR = [
        'الأحد',
        'الإثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
        'الجمعة',
        'السبت',
    ];

    public const LIMITATION_EN = 'Tabular civil Hijri (Kuwaiti algorithm) counted with the Julian day number. It is not crescent sighting and not the Umm al-Qura calendar, so a date can differ by ±1 day.';

    public const LIMITATION_AR = 'التقويم الهجري هنا جدولي مدني (الخوارزمية الكويتية) بحساب رقم اليوم اليولياني، وليس رؤية الهلال ولا تقويم أم القرى، لذلك قد يختلف التاريخ بمقدار ±1 يوم.';

    /** @var array<string, string> */
    private const DIGITS = [
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
        '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
        '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
        '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
    ];

    private function __construct()
    {
    }

    public static function normalizeDigits(string $value): string
    {
        return trim(strtr($value, self::DIGITS));
    }

    public static function isGregorianLeap(int $year): bool
    {
        return $year % 4 === 0 && ($year % 100 !== 0 || $year % 400 === 0);
    }

    public static function isHijriLeap(int $year): bool
    {
        if ($year < 1) {
            return false;
        }

        return in_array($year % 30, self::LEAP_YEARS_IN_CYCLE, true);
    }

    public static function daysInGregorianMonth(int $year, int $month): int
    {
        if ($month === 2 && self::isGregorianLeap($year)) {
            return 29;
        }

        return match ($month) {
            1, 3, 5, 7, 8, 10, 12 => 31,
            4, 6, 9, 11 => 30,
            2 => 28,
            default => 0,
        };
    }

    public static function daysInHijriMonth(int $year, int $month): int
    {
        if ($month < 1 || $month > 12) {
            return 0;
        }
        if ($month % 2 === 1) {
            return 30;
        }
        if ($month === 12 && self::isHijriLeap($year)) {
            return 30;
        }

        return 29;
    }

    public static function gregorianToJdn(int $year, int $month, int $day): int
    {
        $a = intdiv(14 - $month, 12);
        $y = $year + 4800 - $a;
        $m = $month + 12 * $a - 3;

        return $day + intdiv(153 * $m + 2, 5) + 365 * $y + intdiv($y, 4) - intdiv($y, 100) + intdiv($y, 400) - 32045;
    }

    /** @return array{0: int, 1: int, 2: int} */
    public static function jdnToGregorian(int $jdn): array
    {
        $a = $jdn + 32044;
        $b = intdiv(4 * $a + 3, 146097);
        $c = $a - intdiv(146097 * $b, 4);
        $d = intdiv(4 * $c + 3, 1461);
        $e = $c - intdiv(1461 * $d, 4);
        $m = intdiv(5 * $e + 2, 153);
        $day = $e - intdiv(153 * $m + 2, 5) + 1;
        $month = $m + 3 - 12 * intdiv($m, 10);
        $year = 100 * $b + $d - 4800 + intdiv($m, 10);

        return [$year, $month, $day];
    }

    public static function hijriToJdn(int $year, int $month, int $day): int
    {
        $monthOffset = 29 * ($month - 1) + intdiv($month, 2);
        $rd = $day + $monthOffset + ($year - 1) * 354 + intdiv(3 + 11 * $year, 30) + 227015 - 1;

        return $rd + 1721425;
    }

    /** @return array{0: int, 1: int, 2: int} */
    public static function jdnToHijri(int $jdn): array
    {
        if ($jdn < self::HIJRI_EPOCH_JDN) {
            throw new AgeException(
                'Date is before the Hijri epoch (19 July 622 CE).',
                'before-hijri-epoch',
            );
        }

        $days = $jdn - self::HIJRI_EPOCH_JDN;
        $year = intdiv(30 * $days + 10646, 10631);
        if ($year < 1) {
            $year = 1;
        }
        while ($year > 1 && self::hijriToJdn($year, 1, 1) > $jdn) {
            $year--;
        }
        while (self::hijriToJdn($year + 1, 1, 1) <= $jdn) {
            $year++;
        }
        $month = 1;
        while ($month < 12 && self::hijriToJdn($year, $month + 1, 1) <= $jdn) {
            $month++;
        }
        $day = $jdn - self::hijriToJdn($year, $month, 1) + 1;

        return [$year, $month, $day];
    }

    public static function weekdayFromJdn(int $jdn): int
    {
        return ($jdn + 1) % 7;
    }

    /** @param array{0: int, 1: int, 2: int} $date */
    public static function iso(array $date): string
    {
        return sprintf('%04d-%02d-%02d', $date[0], $date[1], $date[2]);
    }

    public static function canonicalCalendar(string $name): string
    {
        $key = strtolower(self::normalizeDigits($name));
        if (in_array($key, ['gregorian', 'g', 'ce', 'miladi', 'ميلادي'], true)) {
            return 'gregorian';
        }
        if (in_array($key, ['hijri', 'h', 'ah', 'islamic', 'هجري'], true)) {
            return 'hijri';
        }

        throw new AgeException('Calendar must be gregorian or hijri.', 'invalid-calendar', 'calendar');
    }

    /** @return array{0: int, 1: int, 2: int} */
    public static function parseDate(string $value, string $calendar, string $field = 'date'): array
    {
        $cleaned = self::normalizeDigits($value);
        if (!preg_match('/^(\d{1,4})-(\d{1,2})-(\d{1,2})$/', $cleaned, $match)) {
            throw new AgeException("Could not read {$field} as YYYY-MM-DD.", 'invalid-date', $field);
        }
        $year = (int) $match[1];
        $month = (int) $match[2];
        $day = (int) $match[3];
        $limit = $calendar === 'gregorian'
            ? self::daysInGregorianMonth($year, $month)
            : self::daysInHijriMonth($year, $month);
        if ($year < 1 || $year > 9999 || $month < 1 || $month > 12 || $day < 1 || $day > $limit) {
            throw new AgeException("{$field} is not a real {$calendar} date.", 'invalid-date', $field);
        }

        return [$year, $month, $day];
    }

    /** @param array{0: int, 1: int, 2: int} $date */
    public static function toJdn(array $date, string $calendar): int
    {
        return $calendar === 'gregorian'
            ? self::gregorianToJdn($date[0], $date[1], $date[2])
            : self::hijriToJdn($date[0], $date[1], $date[2]);
    }

    /** @param array{0: int, 1: int, 2: int} $date
     *  @return array{0: int, 1: int, 2: int}
     */
    public static function gregorianDate(array $date, string $calendar): array
    {
        if ($calendar === 'gregorian') {
            return $date;
        }

        return self::jdnToGregorian(self::hijriToJdn($date[0], $date[1], $date[2]));
    }

    /** @param array{0: int, 1: int, 2: int} $date
     *  @return array{0: int, 1: int, 2: int}
     */
    public static function hijriDate(array $date, string $calendar): array
    {
        if ($calendar === 'hijri') {
            return $date;
        }

        return self::jdnToHijri(self::gregorianToJdn($date[0], $date[1], $date[2]));
    }
}
