using System.Text.Json;
using HisabAlUmr.AgeCalculator;

var birth = (string?)null;
var calendar = "gregorian";
var asOf = (string?)null;
var asOfCalendar = "gregorian";
var json = false;
var argv = Environment.GetCommandLineArgs().Skip(1).ToList();
for (var i = 0; i < argv.Count; i++)
{
    var arg = argv[i];
    string? Next() => i + 1 < argv.Count ? argv[++i] : null;
    switch (arg)
    {
        case "--help":
        case "-h":
            Console.WriteLine("""
            hisab-age-calculator — Gregorian and tabular civil Hijri age

            Usage:
              hisab-age-calculator --birth 1990-05-15 [--as-of 2026-11-08] [--json]
              hisab-age-calculator --birth 1420-09-01 --calendar hijri
            """);
            return;
        case "--version":
            Console.WriteLine($"hisab-age-calculator {AgeCalculator.Version}");
            return;
        case "--json":
            json = true;
            break;
        case "--birth":
            birth = Next();
            break;
        case "--calendar":
        case "--birth-calendar":
            calendar = Next() ?? calendar;
            break;
        case "--as-of":
            asOf = Next();
            break;
        case "--as-of-calendar":
            asOfCalendar = Next() ?? asOfCalendar;
            break;
        default:
            if (!arg.StartsWith('-') && birth is null) birth = arg;
            else
            {
                Console.Error.WriteLine($"Unknown argument {arg}.");
                Environment.Exit(1);
            }
            break;
    }
}

if (birth is null)
{
    Console.Error.WriteLine("Pass a birth date, for example: hisab-age-calculator --birth 1990-05-15");
    Environment.Exit(1);
}

try
{
    var result = AgeCalculator.Calculate(birth, calendar, asOf, asOfCalendar);
    if (json)
    {
        Console.WriteLine(JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
    }
    else
    {
        Console.WriteLine(AgeCalculator.Format(result));
    }
}
catch (AgeException ex)
{
    Console.Error.WriteLine(ex.Message);
    Environment.Exit(1);
}
