/// Gregorian and tabular civil (Kuwaiti) Hijri age calculator.
library;

const String version = '1.0.0';
const String homepage = 'https://hisabaleumr.com/';
const int hijriEpochJdn = 1948440;
const List<int> leapYearsInCycle = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
const List<String> monthsEn = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Thani',
  'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah',
];
const List<String> monthsAr = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];
const List<String> weekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const List<String> weekdaysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const String limitationEn =
    'Tabular civil Hijri (Kuwaiti algorithm) counted with the Julian day number. It is not crescent sighting and not the Umm al-Qura calendar, so a date can differ by ±1 day.';
const String limitationAr =
    'التقويم الهجري هنا جدولي مدني (الخوارزمية الكويتية) بحساب رقم اليوم اليولياني، وليس رؤية الهلال ولا تقويم أم القرى، لذلك قد يختلف التاريخ بمقدار ±1 يوم.';

const Map<String, String> _digits = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

class AgeError implements Exception {
  AgeError(this.message, this.code, [this.field]);
  final String message;
  final String code;
  final String? field;
  @override
  String toString() => message;
}

typedef Ymd = (int, int, int);

String normalizeDigits(String value) => value.split('').map((ch) => _digits[ch] ?? ch).join().trim();

bool isGregorianLeap(int year) => year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);

bool isHijriLeap(int year) => year >= 1 && leapYearsInCycle.contains(year % 30);

int daysInGregorianMonth(int year, int month) {
  if (month == 2 && isGregorianLeap(year)) return 29;
  const lengths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 ? lengths[month] : 0;
}

int daysInHijriMonth(int year, int month) {
  if (month < 1 || month > 12) return 0;
  if (month.isOdd) return 30;
  if (month == 12 && isHijriLeap(year)) return 30;
  return 29;
}

int gregorianToJdn(int year, int month, int day) {
  final a = (14 - month) ~/ 12;
  final y = year + 4800 - a;
  final m = month + 12 * a - 3;
  return day + (153 * m + 2) ~/ 5 + 365 * y + y ~/ 4 - y ~/ 100 + y ~/ 400 - 32045;
}

Ymd jdnToGregorian(int jdn) {
  final a = jdn + 32044;
  final b = (4 * a + 3) ~/ 146097;
  final c = a - (146097 * b) ~/ 4;
  final d = (4 * c + 3) ~/ 1461;
  final e = c - (1461 * d) ~/ 4;
  final m = (5 * e + 2) ~/ 153;
  final day = e - (153 * m + 2) ~/ 5 + 1;
  final month = m + 3 - 12 * (m ~/ 10);
  final year = 100 * b + d - 4800 + m ~/ 10;
  return (year, month, day);
}

int hijriToJdn(int year, int month, int day) {
  final monthOffset = 29 * (month - 1) + month ~/ 2;
  final rd = day + monthOffset + (year - 1) * 354 + (3 + 11 * year) ~/ 30 + 227015 - 1;
  return rd + 1721425;
}

Ymd jdnToHijri(int jdn) {
  if (jdn < hijriEpochJdn) {
    throw AgeError('Date is before the Hijri epoch (19 July 622 CE).', 'before-hijri-epoch');
  }
  final days = jdn - hijriEpochJdn;
  var year = (30 * days + 10646) ~/ 10631;
  if (year < 1) year = 1;
  while (year > 1 && hijriToJdn(year, 1, 1) > jdn) {
    year -= 1;
  }
  while (hijriToJdn(year + 1, 1, 1) <= jdn) {
    year += 1;
  }
  var month = 1;
  while (month < 12 && hijriToJdn(year, month + 1, 1) <= jdn) {
    month += 1;
  }
  final day = jdn - hijriToJdn(year, month, 1) + 1;
  return (year, month, day);
}

int weekdayFromJdn(int jdn) => (jdn + 1) % 7;

String iso(Ymd date) =>
    '${date.$1.toString().padLeft(4, '0')}-${date.$2.toString().padLeft(2, '0')}-${date.$3.toString().padLeft(2, '0')}';

String canonicalCalendar(String name) {
  final key = normalizeDigits(name).toLowerCase();
  if (['gregorian', 'g', 'ce', 'miladi', 'ميلادي'].contains(key)) return 'gregorian';
  if (['hijri', 'h', 'ah', 'islamic', 'هجري'].contains(key)) return 'hijri';
  throw AgeError('Calendar must be gregorian or hijri.', 'invalid-calendar', 'calendar');
}

Ymd parseDate(String value, String calendar, [String field = 'date']) {
  final cleaned = normalizeDigits(value);
  final match = RegExp(r'^(\d{1,4})-(\d{1,2})-(\d{1,2})$').firstMatch(cleaned);
  if (match == null) {
    throw AgeError('Could not read $field as YYYY-MM-DD.', 'invalid-date', field);
  }
  final year = int.parse(match.group(1)!);
  final month = int.parse(match.group(2)!);
  final day = int.parse(match.group(3)!);
  final limit = calendar == 'gregorian' ? daysInGregorianMonth(year, month) : daysInHijriMonth(year, month);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > limit) {
    throw AgeError('$field is not a real $calendar date.', 'invalid-date', field);
  }
  return (year, month, day);
}

int _toJdn(Ymd date, String calendar) =>
    calendar == 'gregorian' ? gregorianToJdn(date.$1, date.$2, date.$3) : hijriToJdn(date.$1, date.$2, date.$3);

Ymd _gregorianDate(Ymd date, String calendar) =>
    calendar == 'gregorian' ? date : jdnToGregorian(hijriToJdn(date.$1, date.$2, date.$3));

Ymd _hijriDate(Ymd date, String calendar) =>
    calendar == 'hijri' ? date : jdnToHijri(gregorianToJdn(date.$1, date.$2, date.$3));

int _cmp(Ymd a, Ymd b) {
  if (a.$1 != b.$1) return a.$1.compareTo(b.$1);
  if (a.$2 != b.$2) return a.$2.compareTo(b.$2);
  return a.$3.compareTo(b.$3);
}

Ymd _period(Ymd start, Ymd end, int Function(int, int) daysInMonth) {
  var years = end.$1 - start.$1;
  var months = end.$2 - start.$2;
  var days = end.$3 - start.$3;
  var cursorYear = end.$1;
  var cursorMonth = end.$2;
  var guard = 0;
  while (days < 0) {
    if (guard > 5) throw AgeError('Could not resolve the year/month/day age.', 'internal');
    guard += 1;
    months -= 1;
    if (cursorMonth == 1) {
      cursorYear -= 1;
      cursorMonth = 12;
    } else {
      cursorMonth -= 1;
    }
    days += daysInMonth(cursorYear, cursorMonth);
  }
  while (months < 0) {
    years -= 1;
    months += 12;
  }
  return (years, months, days);
}

Ymd _anniversary(Ymd birth, int year, int Function(int, int) daysInMonth) {
  if (birth.$3 <= daysInMonth(year, birth.$2)) return (year, birth.$2, birth.$3);
  final overflow = birth.$3 - daysInMonth(year, birth.$2);
  if (birth.$2 == 12) return (year + 1, 1, overflow);
  return (year, birth.$2 + 1, overflow);
}

Ymd _next(Ymd birth, Ymd asOf, int Function(int, int) daysInMonth) {
  Ymd? best;
  for (var year = asOf.$1 - 1; year <= asOf.$1 + 2; year++) {
    if (year < 1) continue;
    final candidate = _anniversary(birth, year, daysInMonth);
    if (_cmp(candidate, asOf) >= 0 && (best == null || _cmp(candidate, best) < 0)) {
      best = candidate;
    }
  }
  if (best == null) throw AgeError('Could not find the next birthday.', 'internal');
  return best;
}

Map<String, Object?> _part(Ymd date, String calendar) {
  final greg = _gregorianDate(date, calendar);
  final hijri = _hijriDate(date, calendar);
  final jdn = gregorianToJdn(greg.$1, greg.$2, greg.$3);
  final weekday = weekdayFromJdn(jdn);
  return {
    'gregorian': iso(greg),
    'hijri': iso(hijri),
    'hijriMonthEn': monthsEn[hijri.$2 - 1],
    'hijriMonthAr': monthsAr[hijri.$2 - 1],
    'weekday': weekday,
    'weekdayEn': weekdaysEn[weekday],
    'weekdayAr': weekdaysAr[weekday],
    'jdn': jdn,
  };
}

/// [birth] and [asOf] are `YYYY-MM-DD`. Arabic-Indic digits are accepted.
/// When [asOf] is omitted, today is the local Gregorian date.
Map<String, Object?> calculateAge(
  String birth, {
  String birthCalendar = 'gregorian',
  String? asOf,
  String asOfCalendar = 'gregorian',
  String? today,
}) {
  final birthCal = canonicalCalendar(birthCalendar);
  final birthDate = parseDate(birth, birthCal, 'birth');
  final String asOfText;
  final String asOfCal;
  if (asOf == null) {
    asOfCal = 'gregorian';
    final now = DateTime.now();
    asOfText = today ?? iso((now.year, now.month, now.day));
  } else {
    asOfCal = canonicalCalendar(asOfCalendar);
    asOfText = asOf;
  }
  final asOfDate = parseDate(asOfText, asOfCal, 'asOf');
  final birthJdn = _toJdn(birthDate, birthCal);
  final asOfJdn = _toJdn(asOfDate, asOfCal);
  if (asOfJdn < birthJdn) {
    throw AgeError('The as-of date is before the birth date.', 'future-birth', 'asOf');
  }
  final birthG = _gregorianDate(birthDate, birthCal);
  final asOfG = _gregorianDate(asOfDate, asOfCal);
  final birthH = _hijriDate(birthDate, birthCal);
  final asOfH = _hijriDate(asOfDate, asOfCal);
  final g = _period(birthG, asOfG, daysInGregorianMonth);
  final h = _period(birthH, asOfH, daysInHijriMonth);
  final nextG = _next(birthG, asOfG, daysInGregorianMonth);
  final nextH = _next(birthH, asOfH, daysInHijriMonth);
  final nextHg = jdnToGregorian(hijriToJdn(nextH.$1, nextH.$2, nextH.$3));
  return {
    'version': version,
    'homepage': homepage,
    'birth': _part(birthDate, birthCal),
    'asOf': _part(asOfDate, asOfCal),
    'gregorianAge': {'years': g.$1, 'months': g.$2, 'days': g.$3},
    'hijriAge': {'years': h.$1, 'months': h.$2, 'days': h.$3},
    'totalDays': asOfJdn - birthJdn,
    'nextGregorianBirthday': {
      'date': iso(nextG),
      'daysUntil': gregorianToJdn(nextG.$1, nextG.$2, nextG.$3) - asOfJdn,
    },
    'nextHijriBirthday': {
      'hijri': iso(nextH),
      'gregorian': iso(nextHg),
      'hijriMonthEn': monthsEn[nextH.$2 - 1],
      'hijriMonthAr': monthsAr[nextH.$2 - 1],
      'daysUntil': hijriToJdn(nextH.$1, nextH.$2, nextH.$3) - asOfJdn,
    },
    'leapDayBirth': birthG.$2 == 2 && birthG.$3 == 29,
    'calendar': 'tabular-civil',
    'limitationEn': limitationEn,
    'limitationAr': limitationAr,
  };
}
