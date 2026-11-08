# HisabAlUmr.AgeCalculator

.NET library for [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/).

```csharp
using HisabAlUmr.AgeCalculator;

var result = AgeCalculator.Calculate("1990-05-15", asOf: "2026-11-08");
```

`PackageProjectUrl` is `https://hisabaleumr.com/`. Run the CLI with `dotnet run --project packages/nuget/cli -- --birth 1990-05-15 --as-of 2026-11-08`. Tabular civil Hijri (Kuwaiti algorithm). A date can differ by ±1 day from crescent sighting and from Umm al-Qura. 29 February is observed on 1 March in a common year. This package is not published from this repository.

## Links

- [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/)
- Privacy: [سياسة الخصوصية](https://hisabaleumr.com/سياسة-الخصوصية/)
- Contact: [اتصل بنا](https://hisabaleumr.com/اتصل-بنا/)

