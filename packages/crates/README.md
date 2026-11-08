# hisab-age-calculator

Rust library and CLI for [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/).

```rust
let report = hisab_age_calculator::calculate_age(
    "1990-05-15",
    "gregorian",
    Some("2026-11-08"),
    "gregorian",
)?;
```

When `--as-of` is omitted, the CLI uses today's UTC date. `homepage` in `Cargo.toml` is `https://hisabaleumr.com/`. Tabular civil Hijri (Kuwaiti algorithm). A date can differ by ±1 day from crescent sighting and from Umm al-Qura. 29 February is observed on 1 March in a common year. This package is not published from this repository.

## Links

- [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/)
- Privacy: [سياسة الخصوصية](https://hisabaleumr.com/سياسة-الخصوصية/)
- Contact: [اتصل بنا](https://hisabaleumr.com/اتصل-بنا/)

