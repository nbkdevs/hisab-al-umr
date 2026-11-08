using System.Text.Json;
using HisabAlUmr.AgeCalculator;

var path = FindVectors();
using var document = JsonDocument.Parse(File.ReadAllText(path));
var root = document.RootElement;
var failures = 0;

void Check(bool ok, string message)
{
    if (ok) return;
    Console.Error.WriteLine(message);
    failures++;
}

var leaps = Enumerable.Range(1, 30).Where(AgeCalculator.IsHijriLeap).ToArray();
Check(leaps.SequenceEqual(new[] { 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 }), "leap years");
Check(AgeCalculator.GregorianToJdn(2000, 1, 1) == 2451545, "jdn 2000");
Check(AgeCalculator.JdnToGregorian(AgeCalculator.HijriToJdn(1420, 9, 1)) == (1999, 12, 9), "1 Ramadan 1420");
Check(AgeCalculator.JdnToHijri(AgeCalculator.GregorianToJdn(2000, 1, 1)) == (1420, 9, 24), "1 Jan 2000");
Check(AgeCalculator.Homepage == "https://hisabaleumr.com/", "homepage");
Check(AgeCalculator.LimitationEn.Contains("Umm al-Qura", StringComparison.Ordinal), "limitation");

foreach (var row in root.GetProperty("ages").EnumerateArray())
{
    var result = AgeCalculator.Calculate(
        row.GetProperty("birth").GetString()!,
        row.GetProperty("birthCalendar").GetString()!,
        row.GetProperty("asOf").GetString()!,
        row.GetProperty("asOfCalendar").GetString()!);
    var g = (IReadOnlyDictionary<string, object?>)result["gregorianAge"]!;
    var h = (IReadOnlyDictionary<string, object?>)result["hijriAge"]!;
    var birth = (IReadOnlyDictionary<string, object?>)result["birth"]!;
    var nextG = (IReadOnlyDictionary<string, object?>)result["nextGregorianBirthday"]!;
    var nextH = (IReadOnlyDictionary<string, object?>)result["nextHijriBirthday"]!;
    var label = $"{row.GetProperty("birth").GetString()} -> {row.GetProperty("asOf").GetString()}";
    Check((int)g["years"]! == row.GetProperty("gregorianAge").GetProperty("years").GetInt32(), label + " gy");
    Check((int)g["months"]! == row.GetProperty("gregorianAge").GetProperty("months").GetInt32(), label + " gm");
    Check((int)g["days"]! == row.GetProperty("gregorianAge").GetProperty("days").GetInt32(), label + " gd");
    Check((int)h["years"]! == row.GetProperty("hijriAge").GetProperty("years").GetInt32(), label + " hy");
    Check((int)h["months"]! == row.GetProperty("hijriAge").GetProperty("months").GetInt32(), label + " hm");
    Check((int)h["days"]! == row.GetProperty("hijriAge").GetProperty("days").GetInt32(), label + " hd");
    Check((long)result["totalDays"]! == row.GetProperty("totalDays").GetInt64(), label + " days");
    Check((string)birth["gregorian"]! == row.GetProperty("birthGregorian").GetString(), label + " birth g");
    Check((string)birth["hijri"]! == row.GetProperty("birthHijri").GetString(), label + " birth h");
    Check((string)nextG["date"]! == row.GetProperty("nextGregorianBirthday").GetString(), label + " next g");
    Check((string)nextH["hijri"]! == row.GetProperty("nextHijriBirthday").GetString(), label + " next h");
    Check((string)result["homepage"]! == "https://hisabaleumr.com/", "result homepage");
}

var arabic = AgeCalculator.Calculate("١٩٩٠-٠٥-١٥", asOf: "٢٠٢٦-١١-٠٨");
var arabicAge = (IReadOnlyDictionary<string, object?>)arabic["gregorianAge"]!;
Check((int)arabicAge["years"]! == 36 && (int)arabicAge["months"]! == 5 && (int)arabicAge["days"]! == 24, "arabic digits");

if (failures > 0)
{
    Console.Error.WriteLine($"{failures} failed");
    Environment.Exit(1);
}

Console.WriteLine("ok");

static string FindVectors()
{
    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    while (dir is not null)
    {
        var candidate = Path.Combine(dir.FullName, "packages", "vectors.json");
        if (File.Exists(candidate)) return candidate;
        if (dir.Name == "packages" && File.Exists(Path.Combine(dir.FullName, "vectors.json")))
        {
            return Path.Combine(dir.FullName, "vectors.json");
        }
        dir = dir.Parent;
    }
    throw new FileNotFoundException("packages/vectors.json");
}
