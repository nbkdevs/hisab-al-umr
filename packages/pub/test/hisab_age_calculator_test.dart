import 'dart:convert';
import 'dart:io';

import 'package:hisab_age_calculator/hisab_age_calculator.dart';
import 'package:test/test.dart';

void main() {
  final vectors = jsonDecode(File('../../vectors.json').readAsStringSync()) as Map<String, dynamic>;

  test('anchors', () {
    expect([for (var year = 1; year <= 30; year++) if (isHijriLeap(year)) year], leapYearsInCycle);
    expect(gregorianToJdn(2000, 1, 1), 2451545);
    expect(jdnToGregorian(hijriToJdn(1420, 9, 1)), (1999, 12, 9));
    expect(jdnToHijri(gregorianToJdn(2000, 1, 1)), (1420, 9, 24));
    expect(homepage, 'https://hisabaleumr.com/');
    expect(limitationEn, contains('Umm al-Qura'));
  });

  test('shared vectors', () {
    for (final row in vectors['ages'] as List) {
      final result = calculateAge(
        row['birth'] as String,
        birthCalendar: row['birthCalendar'] as String,
        asOf: row['asOf'] as String,
        asOfCalendar: row['asOfCalendar'] as String,
      );
      expect(result['gregorianAge'], row['gregorianAge']);
      expect(result['hijriAge'], row['hijriAge']);
      expect(result['totalDays'], row['totalDays']);
      expect((result['birth']! as Map)['gregorian'], row['birthGregorian']);
      expect((result['birth']! as Map)['hijri'], row['birthHijri']);
      expect((result['nextGregorianBirthday']! as Map)['date'], row['nextGregorianBirthday']);
      expect((result['nextHijriBirthday']! as Map)['hijri'], row['nextHijriBirthday']);
      expect(result['homepage'], 'https://hisabaleumr.com/');
    }
  });

  test('arabic digits', () {
    final result = calculateAge('١٩٩٠-٠٥-١٥', asOf: '٢٠٢٦-١١-٠٨');
    expect(result['gregorianAge'], {'years': 36, 'months': 5, 'days': 24});
  });
}
