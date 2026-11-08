# frozen_string_literal: true

require "date"

# Gregorian and tabular civil (Kuwaiti) Hijri age calculator.
# Years, months and days are borrowed. 29 February is observed on 1 March
# in a common year. The Hijri table can differ by ±1 day from moon sighting
# and from Umm al-Qura.
module HisabAgeCalculator
  VERSION = "1.0.0"
  HOMEPAGE = "https://hisabaleumr.com/"
  HIJRI_EPOCH_JDN = 1_948_440
  LEAP_YEARS_IN_CYCLE = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].freeze
  MONTHS_EN = [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula",
    "Jumada al-Thani", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qidah", "Dhu al-Hijjah"
  ].freeze
  MONTHS_AR = [
    "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
    "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ].freeze
  WEEKDAYS_EN = %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday].freeze
  WEEKDAYS_AR = %w[الأحد الإثنين الثلاثاء الأربعاء الخميس الجمعة السبت].freeze
  LIMITATION_EN = "Tabular civil Hijri (Kuwaiti algorithm) counted with the Julian day number. It is not crescent sighting and not the Umm al-Qura calendar, so a date can differ by ±1 day."
  LIMITATION_AR = "التقويم الهجري هنا جدولي مدني (الخوارزمية الكويتية) بحساب رقم اليوم اليولياني، وليس رؤية الهلال ولا تقويم أم القرى، لذلك قد يختلف التاريخ بمقدار ±1 يوم."
  DIGITS = {
    "٠" => "0", "١" => "1", "٢" => "2", "٣" => "3", "٤" => "4",
    "٥" => "5", "٦" => "6", "٧" => "7", "٨" => "8", "٩" => "9",
    "۰" => "0", "۱" => "1", "۲" => "2", "۳" => "3", "۴" => "4",
    "۵" => "5", "۶" => "6", "۷" => "7", "۸" => "8", "۹" => "9"
  }.freeze

  class AgeError < ArgumentError
    attr_reader :code, :field

    def initialize(message, code, field = nil)
      super(message)
      @code = code
      @field = field
    end
  end

  module_function

  def normalize_digits(value)
    value.to_s.chars.map { |ch| DIGITS.fetch(ch, ch) }.join.strip
  end

  def gregorian_leap?(year)
    (year % 4).zero? && (!(year % 100).zero? || (year % 400).zero?)
  end

  def hijri_leap?(year)
    year >= 1 && LEAP_YEARS_IN_CYCLE.include?(year % 30)
  end

  def days_in_gregorian_month(year, month)
    return 29 if month == 2 && gregorian_leap?(year)

    [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] || 0
  end

  def days_in_hijri_month(year, month)
    return 0 unless (1..12).cover?(month)
    return 30 if month.odd?
    return 30 if month == 12 && hijri_leap?(year)

    29
  end

  def gregorian_to_jdn(year, month, day)
    a = (14 - month) / 12
    y = year + 4800 - a
    m = month + (12 * a) - 3
    day + ((153 * m) + 2) / 5 + (365 * y) + (y / 4) - (y / 100) + (y / 400) - 32_045
  end

  def jdn_to_gregorian(jdn)
    a = jdn + 32_044
    b = ((4 * a) + 3) / 146_097
    c = a - ((146_097 * b) / 4)
    d = ((4 * c) + 3) / 1461
    e = c - ((1461 * d) / 4)
    m = ((5 * e) + 2) / 153
    day = e - (((153 * m) + 2) / 5) + 1
    month = m + 3 - (12 * (m / 10))
    year = (100 * b) + d - 4800 + (m / 10)
    [year, month, day]
  end

  def hijri_to_jdn(year, month, day)
    month_offset = (29 * (month - 1)) + (month / 2)
    rd = day + month_offset + ((year - 1) * 354) + ((3 + (11 * year)) / 30) + 227_015 - 1
    rd + 1_721_425
  end

  def jdn_to_hijri(jdn)
    raise AgeError.new("Date is before the Hijri epoch (19 July 622 CE).", "before-hijri-epoch") if jdn < HIJRI_EPOCH_JDN

    days = jdn - HIJRI_EPOCH_JDN
    year = ((30 * days) + 10_646) / 10_631
    year = 1 if year < 1
    year -= 1 while year > 1 && hijri_to_jdn(year, 1, 1) > jdn
    year += 1 while hijri_to_jdn(year + 1, 1, 1) <= jdn
    month = 1
    month += 1 while month < 12 && hijri_to_jdn(year, month + 1, 1) <= jdn
    day = jdn - hijri_to_jdn(year, month, 1) + 1
    [year, month, day]
  end

  def weekday_from_jdn(jdn)
    (jdn + 1) % 7
  end

  def iso(date)
    format("%04d-%02d-%02d", date[0], date[1], date[2])
  end

  def canonical_calendar(name)
    key = normalize_digits(name).downcase
    return "gregorian" if %w[gregorian g ce miladi ميلادي].include?(key)
    return "hijri" if %w[hijri h ah islamic هجري].include?(key)

    raise AgeError.new("Calendar must be gregorian or hijri.", "invalid-calendar", "calendar")
  end

  def parse_date(value, calendar, field = "date")
    cleaned = normalize_digits(value)
    match = /\A(\d{1,4})-(\d{1,2})-(\d{1,2})\z/.match(cleaned)
    raise AgeError.new("Could not read #{field} as YYYY-MM-DD.", "invalid-date", field) unless match

    year = match[1].to_i
    month = match[2].to_i
    day = match[3].to_i
    limit = calendar == "gregorian" ? days_in_gregorian_month(year, month) : days_in_hijri_month(year, month)
    unless (1..9999).cover?(year) && (1..12).cover?(month) && (1..limit).cover?(day)
      raise AgeError.new("#{field} is not a real #{calendar} date.", "invalid-date", field)
    end
    [year, month, day]
  end

  def to_jdn(date, calendar)
    calendar == "gregorian" ? gregorian_to_jdn(*date) : hijri_to_jdn(*date)
  end

  def gregorian_date(date, calendar)
    calendar == "gregorian" ? date : jdn_to_gregorian(hijri_to_jdn(*date))
  end

  def hijri_date(date, calendar)
    calendar == "hijri" ? date : jdn_to_hijri(gregorian_to_jdn(*date))
  end

  def period_between(start_date, end_date, counter)
    years = end_date[0] - start_date[0]
    months = end_date[1] - start_date[1]
    days = end_date[2] - start_date[2]
    cursor_year = end_date[0]
    cursor_month = end_date[1]
    guard = 0
    while days.negative?
      raise AgeError.new("Could not resolve the year/month/day age.", "internal") if guard > 5

      guard += 1
      months -= 1
      if cursor_month == 1
        cursor_year -= 1
        cursor_month = 12
      else
        cursor_month -= 1
      end
      days += send(counter, cursor_year, cursor_month)
    end
    while months.negative?
      years -= 1
      months += 12
    end
    [years, months, days]
  end

  def anniversary(birth, year, counter)
    return [year, birth[1], birth[2]] if birth[2] <= send(counter, year, birth[1])

    overflow = birth[2] - send(counter, year, birth[1])
    return [year + 1, 1, overflow] if birth[1] == 12

    [year, birth[1] + 1, overflow]
  end

  def next_anniversary(birth, as_of, counter)
    best = nil
    (as_of[0] - 1).upto(as_of[0] + 2) do |year|
      next if year < 1

      candidate = anniversary(birth, year, counter)
      best = candidate if (candidate <=> as_of) >= 0 && (best.nil? || (candidate <=> best).negative?)
    end
    raise AgeError.new("Could not find the next birthday.", "internal") if best.nil?

    best
  end

  def part(date, calendar)
    greg = gregorian_date(date, calendar)
    hijri = hijri_date(date, calendar)
    jdn = gregorian_to_jdn(*greg)
    weekday = weekday_from_jdn(jdn)
    {
      "gregorian" => iso(greg),
      "hijri" => iso(hijri),
      "hijriMonthEn" => MONTHS_EN[hijri[1] - 1],
      "hijriMonthAr" => MONTHS_AR[hijri[1] - 1],
      "weekday" => weekday,
      "weekdayEn" => WEEKDAYS_EN[weekday],
      "weekdayAr" => WEEKDAYS_AR[weekday],
      "jdn" => jdn
    }
  end

  def calculate(birth, birth_calendar: "gregorian", as_of: nil, as_of_calendar: "gregorian", today: nil)
    birth_cal = canonical_calendar(birth_calendar)
    birth_date = parse_date(birth, birth_cal, "birth")
    if as_of.nil?
      as_of_cal = "gregorian"
      as_of_text = today || Date.today.iso8601
    else
      as_of_cal = canonical_calendar(as_of_calendar)
      as_of_text = as_of
    end
    as_of_date = parse_date(as_of_text, as_of_cal, "asOf")
    birth_jdn = to_jdn(birth_date, birth_cal)
    as_of_jdn = to_jdn(as_of_date, as_of_cal)
    raise AgeError.new("The as-of date is before the birth date.", "future-birth", "asOf") if as_of_jdn < birth_jdn

    birth_g = gregorian_date(birth_date, birth_cal)
    as_of_g = gregorian_date(as_of_date, as_of_cal)
    birth_h = hijri_date(birth_date, birth_cal)
    as_of_h = hijri_date(as_of_date, as_of_cal)
    g_years, g_months, g_days = period_between(birth_g, as_of_g, :days_in_gregorian_month)
    h_years, h_months, h_days = period_between(birth_h, as_of_h, :days_in_hijri_month)
    next_g = next_anniversary(birth_g, as_of_g, :days_in_gregorian_month)
    next_h = next_anniversary(birth_h, as_of_h, :days_in_hijri_month)
    next_hg = jdn_to_gregorian(hijri_to_jdn(*next_h))
    {
      "version" => VERSION,
      "homepage" => HOMEPAGE,
      "birth" => part(birth_date, birth_cal),
      "asOf" => part(as_of_date, as_of_cal),
      "gregorianAge" => { "years" => g_years, "months" => g_months, "days" => g_days },
      "hijriAge" => { "years" => h_years, "months" => h_months, "days" => h_days },
      "totalDays" => as_of_jdn - birth_jdn,
      "nextGregorianBirthday" => {
        "date" => iso(next_g),
        "daysUntil" => gregorian_to_jdn(*next_g) - as_of_jdn
      },
      "nextHijriBirthday" => {
        "hijri" => iso(next_h),
        "gregorian" => iso(next_hg),
        "hijriMonthEn" => MONTHS_EN[next_h[1] - 1],
        "hijriMonthAr" => MONTHS_AR[next_h[1] - 1],
        "daysUntil" => hijri_to_jdn(*next_h) - as_of_jdn
      },
      "leapDayBirth" => birth_g[1] == 2 && birth_g[2] == 29,
      "calendar" => "tabular-civil",
      "limitationEn" => LIMITATION_EN,
      "limitationAr" => LIMITATION_AR
    }
  end

  def format_report(result)
    birth = result["birth"]
    as_of = result["asOf"]
    g = result["gregorianAge"]
    h = result["hijriAge"]
    next_g = result["nextGregorianBirthday"]
    next_h = result["nextHijriBirthday"]
    [
      "Hisab Al-Umr #{VERSION}",
      "Birth: #{birth['gregorian']}  ·  #{birth['hijri']} #{birth['hijriMonthEn']} / #{birth['hijriMonthAr']}  ·  #{birth['weekdayEn']}",
      "As of: #{as_of['gregorian']}  ·  #{as_of['hijri']} #{as_of['hijriMonthEn']} / #{as_of['hijriMonthAr']}  ·  #{as_of['weekdayEn']}",
      "Gregorian age: #{g['years']} years, #{g['months']} months, #{g['days']} days",
      "Hijri age: #{h['years']} years, #{h['months']} months, #{h['days']} days",
      "Total days: #{result['totalDays']}",
      "Next Gregorian birthday: #{next_g['date']} (#{next_g['daysUntil']} days)",
      "Next Hijri birthday: #{next_h['hijri']} = #{next_h['gregorian']} (#{next_h['daysUntil']} days)",
      result["limitationEn"]
    ].join("\n")
  end
end
