<?php

declare(strict_types=1);

namespace HisabAlUmr\AgeCalculator\Tests;

use HisabAlUmr\AgeCalculator\AgeCalculator;
use HisabAlUmr\AgeCalculator\AgeException;
use HisabAlUmr\AgeCalculator\Calendar;
use PHPUnit\Framework\TestCase;

final class AgeCalculatorTest extends TestCase
{
    public function testLeapYearsInTheThirtyYearCycle(): void
    {
        $expected = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
        $found = [];
        for ($year = 1; $year <= 30; $year++) {
            if (Calendar::isHijriLeap($year)) {
                $found[] = $year;
            }
        }
        self::assertSame($expected, $found);
        self::assertFalse(Calendar::isHijriLeap(30));
        self::assertTrue(Calendar::isHijriLeap(1420));
        self::assertFalse(Calendar::isHijriLeap(1421));
        for ($year = 1; $year <= 300; $year++) {
            $byFormula = (11 * $year + 14) % 30 < 11;
            self::assertSame($byFormula, Calendar::isHijriLeap($year));
        }
    }

    public function testKnownCivilConversions(): void
    {
        self::assertSame(2451545, Calendar::gregorianToJdn(2000, 1, 1));
        self::assertSame(1948440, Calendar::gregorianToJdn(622, 7, 19));
        self::assertSame(1948440, Calendar::hijriToJdn(1, 1, 1));
        self::assertSame([622, 7, 19], Calendar::jdnToGregorian(1948440));
        self::assertSame([1, 1, 1], Calendar::jdnToHijri(1948440));
        self::assertSame(5, Calendar::weekdayFromJdn(1948440));
        self::assertSame('Friday', Calendar::WEEKDAYS_EN[5]);

        self::assertSame(2451522, Calendar::hijriToJdn(1420, 9, 1));
        self::assertSame([1999, 12, 9], Calendar::jdnToGregorian(2451522));
        $ramadan = \DateTimeImmutable::createFromFormat('!Y-m-d', '1999-12-09');
        $cited = \DateTimeImmutable::createFromFormat('!Y-m-d', '1999-12-08');
        self::assertNotFalse($ramadan);
        self::assertNotFalse($cited);
        self::assertSame(1, (int) $ramadan->diff($cited)->days);

        self::assertSame([1420, 9, 24], Calendar::jdnToHijri(Calendar::gregorianToJdn(2000, 1, 1)));
        self::assertSame('Ramadan', Calendar::MONTHS_EN[8]);
    }

    public function testJulianDayMatchesPhpCalendarExtension(): void
    {
        if (!function_exists('gregoriantojd')) {
            self::markTestSkipped('ext-calendar is not loaded');
        }
        for ($year = 622; $year <= 2200; $year += 17) {
            for ($month = 1; $month <= 12; $month++) {
                self::assertSame(
                    gregoriantojd($month, 1, $year),
                    Calendar::gregorianToJdn($year, $month, 1),
                );
                $last = Calendar::daysInGregorianMonth($year, $month);
                self::assertSame(
                    gregoriantojd($month, $last, $year),
                    Calendar::gregorianToJdn($year, $month, $last),
                );
            }
        }
    }

    public function testRoundTrip(): void
    {
        for ($year = 1; $year <= 1600; $year += 19) {
            foreach ([1, 2, 9, 12] as $month) {
                foreach ([1, 29, 30] as $day) {
                    if ($day > Calendar::daysInHijriMonth($year, $month)) {
                        continue;
                    }
                    $jdn = Calendar::hijriToJdn($year, $month, $day);
                    self::assertSame([$year, $month, $day], Calendar::jdnToHijri($jdn));
                }
            }
        }
        for ($year = 1; $year <= 2400; $year += 23) {
            for ($month = 1; $month <= 12; $month++) {
                $day = Calendar::daysInGregorianMonth($year, $month);
                self::assertSame([$year, $month, $day], Calendar::jdnToGregorian(Calendar::gregorianToJdn($year, $month, $day)));
            }
        }
    }

    public function testVectorFile(): void
    {
        $path = dirname(__DIR__, 2) . '/vectors.json';
        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29], $data['leapYearsInCycle']);

        foreach ($data['conversions'] as $row) {
            [$gy, $gm, $gd] = array_map('intval', explode('-', $row['gregorian']));
            [$hy, $hm, $hd] = array_map('intval', explode('-', $row['hijri']));
            self::assertSame($row['jdn'], Calendar::gregorianToJdn($gy, $gm, $gd), $row['gregorian']);
            self::assertSame($row['jdn'], Calendar::hijriToJdn($hy, $hm, $hd), $row['hijri']);
            self::assertSame($row['weekday'], Calendar::weekdayFromJdn($row['jdn']));
        }

        foreach ($data['ages'] as $row) {
            $result = AgeCalculator::calculate(
                $row['birth'],
                $row['birthCalendar'],
                $row['asOf'],
                $row['asOfCalendar'],
            );
            self::assertSame($row['gregorianAge'], $result['gregorianAge']);
            self::assertSame($row['hijriAge'], $result['hijriAge']);
            self::assertSame($row['totalDays'], $result['totalDays']);
            self::assertSame($row['birthGregorian'], $result['birth']['gregorian']);
            self::assertSame($row['birthHijri'], $result['birth']['hijri']);
            self::assertSame($row['asOfGregorian'], $result['asOf']['gregorian']);
            self::assertSame($row['asOfHijri'], $result['asOf']['hijri']);
            self::assertSame($row['nextGregorianBirthday'], $result['nextGregorianBirthday']['date']);
            self::assertSame($row['daysUntilGregorianBirthday'], $result['nextGregorianBirthday']['daysUntil']);
            self::assertSame($row['nextHijriBirthday'], $result['nextHijriBirthday']['hijri']);
            self::assertSame($row['nextHijriBirthdayGregorian'], $result['nextHijriBirthday']['gregorian']);
            self::assertSame($row['daysUntilHijriBirthday'], $result['nextHijriBirthday']['daysUntil']);
            self::assertSame('https://hisabaleumr.com/', $result['homepage']);
            self::assertStringContainsString('Umm al-Qura', $result['limitationEn']);
            self::assertStringContainsString('±1', $result['limitationEn']);
        }
    }

    public function testGregorianAgeMatchesDateTime(): void
    {
        $state = 20261108;
        $next = static function () use (&$state): int {
            $state = (1103515245 * $state + 12345) % 2147483648;

            return $state;
        };
        for ($i = 0; $i < 80; $i++) {
            $y1 = 1900 + ($next() % 100);
            $m1 = 1 + ($next() % 12);
            $d1 = 1 + ($next() % Calendar::daysInGregorianMonth($y1, $m1));
            $y2 = $y1 + ($next() % 40);
            $m2 = 1 + ($next() % 12);
            $d2 = 1 + ($next() % Calendar::daysInGregorianMonth($y2, $m2));
            $start = sprintf('%04d-%02d-%02d', $y1, $m1, $d1);
            $end = sprintf('%04d-%02d-%02d', $y2, $m2, $d2);
            if ($end < $start) {
                [$start, $end] = [$end, $start];
            }
            $diff = (new \DateTimeImmutable($start))->diff(new \DateTimeImmutable($end));
            $result = AgeCalculator::calculate($start, 'gregorian', $end);
            self::assertSame(
                [(int) $diff->y, (int) $diff->m, (int) $diff->d, (int) $diff->days],
                [
                    $result['gregorianAge']['years'],
                    $result['gregorianAge']['months'],
                    $result['gregorianAge']['days'],
                    $result['totalDays'],
                ],
                "{$start} -> {$end}",
            );
        }
    }

    public function testArabicIndicDigitsAndFebruaryRule(): void
    {
        $ascii = AgeCalculator::calculate('1990-05-15', 'gregorian', '2026-11-08');
        $arabic = AgeCalculator::calculate('١٩٩٠-٠٥-١٥', 'gregorian', '٢٠٢٦-١١-٠٨');
        self::assertSame($ascii['gregorianAge'], $arabic['gregorianAge']);
        self::assertSame(36, $ascii['gregorianAge']['years']);
        self::assertSame(5, $ascii['gregorianAge']['months']);
        self::assertSame(24, $ascii['gregorianAge']['days']);
        self::assertSame(13326, $ascii['totalDays']);

        $turned = AgeCalculator::calculate('2000-02-29', 'gregorian', '2023-03-01');
        self::assertSame(['years' => 23, 'months' => 0, 'days' => 0], $turned['gregorianAge']);
        self::assertSame('2023-03-01', $turned['nextGregorianBirthday']['date']);
        self::assertSame(0, $turned['nextGregorianBirthday']['daysUntil']);

        $dayBefore = AgeCalculator::calculate('2000-02-29', 'gregorian', '2023-02-28');
        self::assertSame('2023-03-01', $dayBefore['nextGregorianBirthday']['date']);
        self::assertSame(1, $dayBefore['nextGregorianBirthday']['daysUntil']);
    }

    public function testRejectsInvalidInput(): void
    {
        $this->expectException(AgeException::class);
        AgeCalculator::calculate('1990-02-29');
    }

    public function testRejectsFutureBirth(): void
    {
        try {
            AgeCalculator::calculate('2026-11-08', 'gregorian', '1990-05-15');
            self::fail('expected AgeException');
        } catch (AgeException $exception) {
            self::assertSame('future-birth', $exception->errorCode);
        }
    }

    public function testRejectsHijriDayThatDoesNotExist(): void
    {
        $this->expectException(AgeException::class);
        AgeCalculator::calculate('1421-12-30', 'hijri', '2026-11-08');
    }

    public function testCliJson(): void
    {
        $bin = dirname(__DIR__) . '/bin/hisab-age-calculator';
        $command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($bin)
            . ' --birth 1990-05-15 --as-of 2026-11-08 --json';
        $output = [];
        $code = 0;
        exec($command, $output, $code);
        self::assertSame(0, $code);
        $decoded = json_decode(implode("\n", $output), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(36, $decoded['gregorianAge']['years']);
        self::assertSame('https://hisabaleumr.com/', $decoded['homepage']);
    }
}
