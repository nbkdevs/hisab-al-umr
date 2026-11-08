import 'package:hisab_age_calculator/hisab_age_calculator.dart';

void main() {
  final result = calculateAge('1990-05-15', asOf: '2026-11-08');
  final age = result['gregorianAge']! as Map;
  // ignore: avoid_print
  print('${age['years']} years, ${age['months']} months, ${age['days']} days');
}
