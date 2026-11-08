namespace HisabAlUmr.AgeCalculator;

/// <summary>
/// Gregorian and tabular civil (Kuwaiti) Hijri ages.
/// Years, months and days are borrowed. 29 February is observed on 1 March
/// in a common year. The Hijri table can differ by ±1 day from moon sighting
/// and from Umm al-Qura.
/// </summary>
public static class AgeCalculator
{
    public const string Version = "1.0.0";
    public const string Homepage = "https://hisabaleumr.com/";
    public const long HijriEpochJdn = 1948440;
    public static readonly int[] LeapYearsInCycle = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    public static readonly string[] MonthsEn =
    [
        "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Thani",
        "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qidah", "Dhu al-Hijjah",
    ];
    public static readonly string[] MonthsAr =
    [
        "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
        "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
    ];
    public static readonly string[] WeekdaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    public static readonly string[] WeekdaysAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    public const string LimitationEn = "Tabular civil Hijri (Kuwaiti algorithm) counted with the Julian day number. It is not crescent sighting and not the Umm al-Qura calendar, so a date can differ by ±1 day.";
    public const string LimitationAr = "التقويم الهجري هنا جدولي مدني (الخوارزمية الكويتية) بحساب رقم اليوم اليولياني، وليس رؤية الهلال ولا تقويم أم القرى، لذلك قد يختلف التاريخ بمقدار ±1 يوم.";

    private static readonly Dictionary<char, char> Digits = new()
    {
        ['٠'] = '0', ['١'] = '1', ['٢'] = '2', ['٣'] = '3', ['٤'] = '4',
        ['٥'] = '5', ['٦'] = '6', ['٧'] = '7', ['٨'] = '8', ['٩'] = '9',
        ['۰'] = '0', ['۱'] = '1', ['۲'] = '2', ['۳'] = '3', ['۴'] = '4',
        ['۵'] = '5', ['۶'] = '6', ['۷'] = '7', ['۸'] = '8', ['۹'] = '9',
    };

    public static string NormalizeDigits(string value)
    {
        var chars = value.Select(ch => Digits.TryGetValue(ch, out var ascii) ? ascii : ch).ToArray();
        return new string(chars).Trim();
    }

    public static bool IsGregorianLeap(int year) => year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);

    public static bool IsHijriLeap(int year) => year >= 1 && LeapYearsInCycle.Contains(year % 30);

    public static int DaysInGregorianMonth(int year, int month) => month switch
    {
        2 when IsGregorianLeap(year) => 29,
        1 or 3 or 5 or 7 or 8 or 10 or 12 => 31,
        4 or 6 or 9 or 11 => 30,
        2 => 28,
        _ => 0,
    };

    public static int DaysInHijriMonth(int year, int month)
    {
        if (month is < 1 or > 12) return 0;
        if (month % 2 == 1) return 30;
        if (month == 12 && IsHijriLeap(year)) return 30;
        return 29;
    }

    public static long GregorianToJdn(int year, int month, int day)
    {
        var a = (14 - month) / 12;
        var y = year + 4800 - a;
        var m = month + 12 * a - 3;
        return day + (153 * m + 2) / 5 + 365L * y + y / 4 - y / 100 + y / 400 - 32045;
    }

    public static (int Year, int Month, int Day) JdnToGregorian(long jdn)
    {
        var a = jdn + 32044;
        var b = (4 * a + 3) / 146097;
        var c = a - 146097 * b / 4;
        var d = (4 * c + 3) / 1461;
        var e = c - 1461 * d / 4;
        var m = (5 * e + 2) / 153;
        var day = (int)(e - (153 * m + 2) / 5 + 1);
        var month = (int)(m + 3 - 12 * (m / 10));
        var year = (int)(100 * b + d - 4800 + m / 10);
        return (year, month, day);
    }

    public static long HijriToJdn(int year, int month, int day)
    {
        var monthOffset = 29 * (month - 1) + month / 2;
        var rd = day + monthOffset + (year - 1) * 354L + (3 + 11L * year) / 30 + 227015 - 1;
        return rd + 1721425;
    }

    public static (int Year, int Month, int Day) JdnToHijri(long jdn)
    {
        if (jdn < HijriEpochJdn)
        {
            throw new AgeException("Date is before the Hijri epoch (19 July 622 CE).", "before-hijri-epoch");
        }
        var days = jdn - HijriEpochJdn;
        var year = (int)((30 * days + 10646) / 10631);
        if (year < 1) year = 1;
        while (year > 1 && HijriToJdn(year, 1, 1) > jdn) year--;
        while (HijriToJdn(year + 1, 1, 1) <= jdn) year++;
        var month = 1;
        while (month < 12 && HijriToJdn(year, month + 1, 1) <= jdn) month++;
        var day = (int)(jdn - HijriToJdn(year, month, 1) + 1);
        return (year, month, day);
    }

    public static int WeekdayFromJdn(long jdn) => (int)((jdn + 1) % 7);

    public static string Iso((int Year, int Month, int Day) date) =>
        $"{date.Year:0000}-{date.Month:00}-{date.Day:00}";

    public static string CanonicalCalendar(string name)
    {
        var key = NormalizeDigits(name).ToLowerInvariant();
        if (key is "gregorian" or "g" or "ce" or "miladi" or "ميلادي") return "gregorian";
        if (key is "hijri" or "h" or "ah" or "islamic" or "هجري") return "hijri";
        throw new AgeException("Calendar must be gregorian or hijri.", "invalid-calendar", "calendar");
    }

    public static (int Year, int Month, int Day) ParseDate(string value, string calendar, string field = "date")
    {
        var cleaned = NormalizeDigits(value);
        var parts = cleaned.Split('-');
        if (parts.Length != 3 || parts.Any(part => part.Length is < 1 or > 4 || part.Any(ch => !char.IsAsciiDigit(ch))))
        {
            throw new AgeException($"Could not read {field} as YYYY-MM-DD.", "invalid-date", field);
        }
        var year = int.Parse(parts[0]);
        var month = int.Parse(parts[1]);
        var day = int.Parse(parts[2]);
        var limit = calendar == "gregorian" ? DaysInGregorianMonth(year, month) : DaysInHijriMonth(year, month);
        if (year is < 1 or > 9999 || month is < 1 or > 12 || day < 1 || day > limit)
        {
            throw new AgeException($"{field} is not a real {calendar} date.", "invalid-date", field);
        }
        return (year, month, day);
    }

    public static IReadOnlyDictionary<string, object?> Calculate(
        string birth,
        string birthCalendar = "gregorian",
        string? asOf = null,
        string asOfCalendar = "gregorian",
        string? today = null)
    {
        var birthCal = CanonicalCalendar(birthCalendar);
        var birthDate = ParseDate(birth, birthCal, "birth");
        string asOfText;
        string asOfCal;
        if (asOf is null)
        {
            asOfCal = "gregorian";
            asOfText = today ?? DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd");
        }
        else
        {
            asOfCal = CanonicalCalendar(asOfCalendar);
            asOfText = asOf;
        }
        var asOfDate = ParseDate(asOfText, asOfCal, "asOf");
        var birthJdn = ToJdn(birthDate, birthCal);
        var asOfJdn = ToJdn(asOfDate, asOfCal);
        if (asOfJdn < birthJdn)
        {
            throw new AgeException("The as-of date is before the birth date.", "future-birth", "asOf");
        }
        var birthG = GregorianDate(birthDate, birthCal);
        var asOfG = GregorianDate(asOfDate, asOfCal);
        var birthH = HijriDate(birthDate, birthCal);
        var asOfH = HijriDate(asOfDate, asOfCal);
        var g = PeriodBetween(birthG, asOfG, DaysInGregorianMonth);
        var h = PeriodBetween(birthH, asOfH, DaysInHijriMonth);
        var nextG = NextAnniversary(birthG, asOfG, DaysInGregorianMonth);
        var nextH = NextAnniversary(birthH, asOfH, DaysInHijriMonth);
        var nextHg = JdnToGregorian(HijriToJdn(nextH.Year, nextH.Month, nextH.Day));
        return new Dictionary<string, object?>
        {
            ["version"] = Version,
            ["homepage"] = Homepage,
            ["birth"] = Part(birthDate, birthCal),
            ["asOf"] = Part(asOfDate, asOfCal),
            ["gregorianAge"] = Ymd(g),
            ["hijriAge"] = Ymd(h),
            ["totalDays"] = asOfJdn - birthJdn,
            ["nextGregorianBirthday"] = new Dictionary<string, object?>
            {
                ["date"] = Iso(nextG),
                ["daysUntil"] = GregorianToJdn(nextG.Year, nextG.Month, nextG.Day) - asOfJdn,
            },
            ["nextHijriBirthday"] = new Dictionary<string, object?>
            {
                ["hijri"] = Iso(nextH),
                ["gregorian"] = Iso(nextHg),
                ["hijriMonthEn"] = MonthsEn[nextH.Month - 1],
                ["hijriMonthAr"] = MonthsAr[nextH.Month - 1],
                ["daysUntil"] = HijriToJdn(nextH.Year, nextH.Month, nextH.Day) - asOfJdn,
            },
            ["leapDayBirth"] = birthG.Month == 2 && birthG.Day == 29,
            ["calendar"] = "tabular-civil",
            ["limitationEn"] = LimitationEn,
            ["limitationAr"] = LimitationAr,
        };
    }

    public static string Format(IReadOnlyDictionary<string, object?> result)
    {
        var birth = (IReadOnlyDictionary<string, object?>)result["birth"]!;
        var asOf = (IReadOnlyDictionary<string, object?>)result["asOf"]!;
        var g = (IReadOnlyDictionary<string, object?>)result["gregorianAge"]!;
        var h = (IReadOnlyDictionary<string, object?>)result["hijriAge"]!;
        var nextG = (IReadOnlyDictionary<string, object?>)result["nextGregorianBirthday"]!;
        var nextH = (IReadOnlyDictionary<string, object?>)result["nextHijriBirthday"]!;
        return string.Join('\n',
        [
            $"Hisab Al-Umr {Version}",
            $"Birth: {birth["gregorian"]}  ·  {birth["hijri"]} {birth["hijriMonthEn"]} / {birth["hijriMonthAr"]}  ·  {birth["weekdayEn"]}",
            $"As of: {asOf["gregorian"]}  ·  {asOf["hijri"]} {asOf["hijriMonthEn"]} / {asOf["hijriMonthAr"]}  ·  {asOf["weekdayEn"]}",
            $"Gregorian age: {g["years"]} years, {g["months"]} months, {g["days"]} days",
            $"Hijri age: {h["years"]} years, {h["months"]} months, {h["days"]} days",
            $"Total days: {result["totalDays"]}",
            $"Next Gregorian birthday: {nextG["date"]} ({nextG["daysUntil"]} days)",
            $"Next Hijri birthday: {nextH["hijri"]} = {nextH["gregorian"]} ({nextH["daysUntil"]} days)",
            result["limitationEn"],
        ]);
    }

    private static long ToJdn((int Year, int Month, int Day) date, string calendar) =>
        calendar == "gregorian"
            ? GregorianToJdn(date.Year, date.Month, date.Day)
            : HijriToJdn(date.Year, date.Month, date.Day);

    private static (int Year, int Month, int Day) GregorianDate((int Year, int Month, int Day) date, string calendar) =>
        calendar == "gregorian" ? date : JdnToGregorian(HijriToJdn(date.Year, date.Month, date.Day));

    private static (int Year, int Month, int Day) HijriDate((int Year, int Month, int Day) date, string calendar) =>
        calendar == "hijri" ? date : JdnToHijri(GregorianToJdn(date.Year, date.Month, date.Day));

    private static (int Years, int Months, int Days) PeriodBetween(
        (int Year, int Month, int Day) start,
        (int Year, int Month, int Day) end,
        Func<int, int, int> daysInMonth)
    {
        var years = end.Year - start.Year;
        var months = end.Month - start.Month;
        var days = end.Day - start.Day;
        var cursorYear = end.Year;
        var cursorMonth = end.Month;
        for (var guard = 0; days < 0; guard++)
        {
            if (guard > 5) throw new AgeException("Could not resolve the year/month/day age.", "internal");
            months--;
            if (cursorMonth == 1)
            {
                cursorYear--;
                cursorMonth = 12;
            }
            else
            {
                cursorMonth--;
            }
            days += daysInMonth(cursorYear, cursorMonth);
        }
        while (months < 0)
        {
            years--;
            months += 12;
        }
        return (years, months, days);
    }

    private static (int Year, int Month, int Day) Anniversary(
        (int Year, int Month, int Day) birth,
        int year,
        Func<int, int, int> daysInMonth)
    {
        if (birth.Day <= daysInMonth(year, birth.Month)) return (year, birth.Month, birth.Day);
        var overflow = birth.Day - daysInMonth(year, birth.Month);
        return birth.Month == 12 ? (year + 1, 1, overflow) : (year, birth.Month + 1, overflow);
    }

    private static (int Year, int Month, int Day) NextAnniversary(
        (int Year, int Month, int Day) birth,
        (int Year, int Month, int Day) asOf,
        Func<int, int, int> daysInMonth)
    {
        (int Year, int Month, int Day)? best = null;
        for (var year = asOf.Year - 1; year <= asOf.Year + 2; year++)
        {
            if (year < 1) continue;
            var candidate = Anniversary(birth, year, daysInMonth);
            if (Compare(candidate, asOf) >= 0 && (best is null || Compare(candidate, best.Value) < 0))
            {
                best = candidate;
            }
        }
        return best ?? throw new AgeException("Could not find the next birthday.", "internal");
    }

    private static int Compare((int Year, int Month, int Day) left, (int Year, int Month, int Day) right)
    {
        var byYear = left.Year.CompareTo(right.Year);
        if (byYear != 0) return byYear;
        var byMonth = left.Month.CompareTo(right.Month);
        return byMonth != 0 ? byMonth : left.Day.CompareTo(right.Day);
    }

    private static Dictionary<string, object?> Ymd((int Years, int Months, int Days) value) => new()
    {
        ["years"] = value.Years,
        ["months"] = value.Months,
        ["days"] = value.Days,
    };

    private static Dictionary<string, object?> Part((int Year, int Month, int Day) date, string calendar)
    {
        var greg = GregorianDate(date, calendar);
        var hijri = HijriDate(date, calendar);
        var jdn = GregorianToJdn(greg.Year, greg.Month, greg.Day);
        var weekday = WeekdayFromJdn(jdn);
        return new Dictionary<string, object?>
        {
            ["gregorian"] = Iso(greg),
            ["hijri"] = Iso(hijri),
            ["hijriMonthEn"] = MonthsEn[hijri.Month - 1],
            ["hijriMonthAr"] = MonthsAr[hijri.Month - 1],
            ["weekday"] = weekday,
            ["weekdayEn"] = WeekdaysEn[weekday],
            ["weekdayAr"] = WeekdaysAr[weekday],
            ["jdn"] = jdn,
        };
    }
}

public sealed class AgeException : ArgumentException
{
    public string ErrorCode { get; }
    public string? FieldName { get; }

    public AgeException(string message, string errorCode, string? field = null) : base(message)
    {
        ErrorCode = errorCode;
        FieldName = field;
    }
}
