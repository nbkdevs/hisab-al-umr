import 'dart:convert';
import 'dart:io';

import 'package:hisab_age_calculator/hisab_age_calculator.dart';

void main(List<String> args) {
  String? birth;
  var calendar = 'gregorian';
  String? asOf;
  var asOfCalendar = 'gregorian';
  var json = false;
  for (var i = 0; i < args.length; i++) {
    final arg = args[i];
    String? next() => i + 1 < args.length ? args[++i] : null;
    if (arg == '--help' || arg == '-h') {
      stdout.writeln('''
hisab_age_calculator — Gregorian and tabular civil Hijri age

Usage:
  hisab_age_calculator --birth 1990-05-15 [--as-of 2026-11-08] [--json]
  hisab_age_calculator --birth 1420-09-01 --calendar hijri
''');
      return;
    } else if (arg == '--version') {
      stdout.writeln('hisab_age_calculator $version');
      return;
    } else if (arg == '--json') {
      json = true;
    } else if (arg == '--birth') {
      birth = next();
    } else if (arg == '--calendar' || arg == '--birth-calendar') {
      calendar = next() ?? calendar;
    } else if (arg == '--as-of') {
      asOf = next();
    } else if (arg == '--as-of-calendar') {
      asOfCalendar = next() ?? asOfCalendar;
    } else if (!arg.startsWith('-') && birth == null) {
      birth = arg;
    } else {
      stderr.writeln('Unknown argument $arg.');
      exitCode = 1;
      return;
    }
  }
  if (birth == null) {
    stderr.writeln('Pass a birth date, for example: hisab_age_calculator --birth 1990-05-15');
    exitCode = 1;
    return;
  }
  try {
    final result = calculateAge(birth, birthCalendar: calendar, asOf: asOf, asOfCalendar: asOfCalendar);
    if (json) {
      stdout.writeln(const JsonEncoder.withIndent('  ').convert(result));
    } else {
      final birthPart = result['birth']! as Map;
      final asOfPart = result['asOf']! as Map;
      final g = result['gregorianAge']! as Map;
      final h = result['hijriAge']! as Map;
      final nextG = result['nextGregorianBirthday']! as Map;
      final nextH = result['nextHijriBirthday']! as Map;
      stdout.writeln('''
Hisab Al-Umr $version
Birth: ${birthPart['gregorian']}  ·  ${birthPart['hijri']} ${birthPart['hijriMonthEn']} / ${birthPart['hijriMonthAr']}
As of: ${asOfPart['gregorian']}  ·  ${asOfPart['hijri']} ${asOfPart['hijriMonthEn']} / ${asOfPart['hijriMonthAr']}
Gregorian age: ${g['years']} years, ${g['months']} months, ${g['days']} days
Hijri age: ${h['years']} years, ${h['months']} months, ${h['days']} days
Total days: ${result['totalDays']}
Next Gregorian birthday: ${nextG['date']} (${nextG['daysUntil']} days)
Next Hijri birthday: ${nextH['hijri']} = ${nextH['gregorian']} (${nextH['daysUntil']} days)
${result['limitationEn']}
''');
    }
  } on AgeError catch (error) {
    stderr.writeln(error.message);
    exitCode = 1;
  }
}
