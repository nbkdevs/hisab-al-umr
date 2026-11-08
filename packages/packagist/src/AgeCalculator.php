<?php

declare(strict_types=1);

namespace HisabAlUmr\AgeCalculator;

/**
 * Age in Gregorian and tabular civil Hijri years, months and days.
 *
 * The split borrows whole months instead of dividing the day count by 365.
 * A 29 February birthday is observed on 1 March when the year is not a leap year.
 */
final class AgeCalculator
{
    public const VERSION = '1.0.0';
    public const HOMEPAGE = 'https://hisabaleumr.com/';

    private function __construct()
    {
    }

    /**
     * @return array<string, mixed>
     */
    public static function calculate(
        string $birth,
        string $birthCalendar = 'gregorian',
        ?string $asOf = null,
        string $asOfCalendar = 'gregorian',
        ?string $today = null,
    ): array {
        $birthCal = Calendar::canonicalCalendar($birthCalendar);
        $birthDate = Calendar::parseDate($birth, $birthCal, 'birth');
        if ($asOf === null) {
            $asOfCal = 'gregorian';
            $asOfText = $today ?? date('Y-m-d');
        } else {
            $asOfCal = Calendar::canonicalCalendar($asOfCalendar);
            $asOfText = $asOf;
        }
        $asOfDate = Calendar::parseDate($asOfText, $asOfCal, 'asOf');

        $birthJdn = Calendar::toJdn($birthDate, $birthCal);
        $asOfJdn = Calendar::toJdn($asOfDate, $asOfCal);
        if ($asOfJdn < $birthJdn) {
            throw new AgeException('The as-of date is before the birth date.', 'future-birth', 'asOf');
        }

        $birthG = Calendar::gregorianDate($birthDate, $birthCal);
        $asOfG = Calendar::gregorianDate($asOfDate, $asOfCal);
        $birthH = Calendar::hijriDate($birthDate, $birthCal);
        $asOfH = Calendar::hijriDate($asOfDate, $asOfCal);

        [$gYears, $gMonths, $gDays] = self::periodBetween($birthG, $asOfG, [Calendar::class, 'daysInGregorianMonth']);
        [$hYears, $hMonths, $hDays] = self::periodBetween($birthH, $asOfH, [Calendar::class, 'daysInHijriMonth']);

        $nextG = self::nextAnniversary($birthG, $asOfG, [Calendar::class, 'daysInGregorianMonth']);
        $nextH = self::nextAnniversary($birthH, $asOfH, [Calendar::class, 'daysInHijriMonth']);
        $nextHg = Calendar::jdnToGregorian(Calendar::hijriToJdn($nextH[0], $nextH[1], $nextH[2]));

        return [
            'version' => self::VERSION,
            'homepage' => self::HOMEPAGE,
            'birth' => self::part($birthDate, $birthCal),
            'asOf' => self::part($asOfDate, $asOfCal),
            'gregorianAge' => ['years' => $gYears, 'months' => $gMonths, 'days' => $gDays],
            'hijriAge' => ['years' => $hYears, 'months' => $hMonths, 'days' => $hDays],
            'totalDays' => $asOfJdn - $birthJdn,
            'nextGregorianBirthday' => [
                'date' => Calendar::iso($nextG),
                'daysUntil' => Calendar::gregorianToJdn($nextG[0], $nextG[1], $nextG[2]) - $asOfJdn,
            ],
            'nextHijriBirthday' => [
                'hijri' => Calendar::iso($nextH),
                'gregorian' => Calendar::iso($nextHg),
                'hijriMonthEn' => Calendar::MONTHS_EN[$nextH[1] - 1],
                'hijriMonthAr' => Calendar::MONTHS_AR[$nextH[1] - 1],
                'daysUntil' => Calendar::hijriToJdn($nextH[0], $nextH[1], $nextH[2]) - $asOfJdn,
            ],
            'leapDayBirth' => $birthG[1] === 2 && $birthG[2] === 29,
            'calendar' => 'tabular-civil',
            'limitationEn' => Calendar::LIMITATION_EN,
            'limitationAr' => Calendar::LIMITATION_AR,
        ];
    }

    /** @param array<string, mixed> $result */
    public static function format(array $result): string
    {
        $birth = $result['birth'];
        $asOf = $result['asOf'];
        $g = $result['gregorianAge'];
        $h = $result['hijriAge'];
        $nextG = $result['nextGregorianBirthday'];
        $nextH = $result['nextHijriBirthday'];

        return implode("\n", [
            'Hisab Al-Umr ' . self::VERSION,
            "Birth: {$birth['gregorian']}  ·  {$birth['hijri']} {$birth['hijriMonthEn']} / {$birth['hijriMonthAr']}  ·  {$birth['weekdayEn']}",
            "As of: {$asOf['gregorian']}  ·  {$asOf['hijri']} {$asOf['hijriMonthEn']} / {$asOf['hijriMonthAr']}  ·  {$asOf['weekdayEn']}",
            "Gregorian age: {$g['years']} years, {$g['months']} months, {$g['days']} days",
            "Hijri age: {$h['years']} years, {$h['months']} months, {$h['days']} days",
            "Total days: {$result['totalDays']}",
            "Next Gregorian birthday: {$nextG['date']} ({$nextG['daysUntil']} days)",
            "Next Hijri birthday: {$nextH['hijri']} = {$nextH['gregorian']} ({$nextH['daysUntil']} days)",
            (string) $result['limitationEn'],
        ]);
    }

    /**
     * @param array{0: int, 1: int, 2: int} $date
     * @return array<string, mixed>
     */
    private static function part(array $date, string $calendar): array
    {
        $greg = Calendar::gregorianDate($date, $calendar);
        $hijri = Calendar::hijriDate($date, $calendar);
        $jdn = Calendar::gregorianToJdn($greg[0], $greg[1], $greg[2]);
        $weekday = Calendar::weekdayFromJdn($jdn);

        return [
            'gregorian' => Calendar::iso($greg),
            'hijri' => Calendar::iso($hijri),
            'hijriMonth' => $hijri[1],
            'hijriMonthEn' => Calendar::MONTHS_EN[$hijri[1] - 1],
            'hijriMonthAr' => Calendar::MONTHS_AR[$hijri[1] - 1],
            'weekday' => $weekday,
            'weekdayEn' => Calendar::WEEKDAYS_EN[$weekday],
            'weekdayAr' => Calendar::WEEKDAYS_AR[$weekday],
            'jdn' => $jdn,
        ];
    }

    /**
     * @param array{0: int, 1: int, 2: int} $start
     * @param array{0: int, 1: int, 2: int} $end
     * @param callable(int, int): int $daysInMonth
     * @return array{0: int, 1: int, 2: int}
     */
    private static function periodBetween(array $start, array $end, callable $daysInMonth): array
    {
        $years = $end[0] - $start[0];
        $months = $end[1] - $start[1];
        $days = $end[2] - $start[2];
        $cursorYear = $end[0];
        $cursorMonth = $end[1];
        for ($guard = 0; $days < 0; $guard++) {
            if ($guard > 5) {
                throw new AgeException('Could not resolve the year/month/day age.', 'internal');
            }
            $months--;
            if ($cursorMonth === 1) {
                $cursorYear--;
                $cursorMonth = 12;
            } else {
                $cursorMonth--;
            }
            $days += $daysInMonth($cursorYear, $cursorMonth);
        }
        while ($months < 0) {
            $years--;
            $months += 12;
        }

        return [$years, $months, $days];
    }

    /**
     * @param array{0: int, 1: int, 2: int} $birth
     * @param callable(int, int): int $daysInMonth
     * @return array{0: int, 1: int, 2: int}
     */
    private static function anniversary(array $birth, int $year, callable $daysInMonth): array
    {
        if ($birth[2] <= $daysInMonth($year, $birth[1])) {
            return [$year, $birth[1], $birth[2]];
        }
        $overflow = $birth[2] - $daysInMonth($year, $birth[1]);
        if ($birth[1] === 12) {
            return [$year + 1, 1, $overflow];
        }

        return [$year, $birth[1] + 1, $overflow];
    }

    /**
     * @param array{0: int, 1: int, 2: int} $birth
     * @param array{0: int, 1: int, 2: int} $asOf
     * @param callable(int, int): int $daysInMonth
     * @return array{0: int, 1: int, 2: int}
     */
    private static function nextAnniversary(array $birth, array $asOf, callable $daysInMonth): array
    {
        $best = null;
        for ($year = $asOf[0] - 1; $year <= $asOf[0] + 2; $year++) {
            if ($year < 1) {
                continue;
            }
            $candidate = self::anniversary($birth, $year, $daysInMonth);
            if ($candidate >= $asOf && ($best === null || $candidate < $best)) {
                $best = $candidate;
            }
        }
        if ($best === null) {
            throw new AgeException('Could not find the next birthday.', 'internal');
        }

        return $best;
    }
}
