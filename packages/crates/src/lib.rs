//! Gregorian and tabular civil (Kuwaiti) Hijri ages.
//!
//! Years, months and days are borrowed across real month lengths. 29 February
//! is observed on 1 March in a common year. Hijri leap years in each 30-year
//! cycle are 2, 5, 7, 10, 13, 16, 18, 21, 24, 26 and 29. The table can differ
//! by ±1 day from crescent sighting and from Umm al-Qura.

use std::fmt;

pub const VERSION: &str = "1.0.0";
pub const HOMEPAGE: &str = "https://hisabaleumr.com/";
pub const HIJRI_EPOCH_JDN: i64 = 1_948_440;
pub const LEAP_YEARS_IN_CYCLE: [i64; 11] = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];

pub const MONTHS_EN: [&str; 12] = [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Ula",
    "Jumada al-Thani",
    "Rajab",
    "Shaban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qidah",
    "Dhu al-Hijjah",
];
pub const MONTHS_AR: [&str; 12] = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الآخر",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
];
const WEEKDAYS_EN: [&str; 7] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
const WEEKDAYS_AR: [&str; 7] = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
];

pub const LIMITATION_EN: &str = "Tabular civil Hijri (Kuwaiti algorithm) counted with the Julian day number. It is not crescent sighting and not the Umm al-Qura calendar, so a date can differ by ±1 day.";
pub const LIMITATION_AR: &str = "التقويم الهجري هنا جدولي مدني (الخوارزمية الكويتية) بحساب رقم اليوم اليولياني، وليس رؤية الهلال ولا تقويم أم القرى، لذلك قد يختلف التاريخ بمقدار ±1 يوم.";

pub type Date = (i64, i64, i64);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AgeError {
    pub message: String,
    pub code: &'static str,
    pub field: Option<&'static str>,
}

impl fmt::Display for AgeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for AgeError {}

fn err(message: &str, code: &'static str, field: Option<&'static str>) -> AgeError {
    AgeError {
        message: message.to_string(),
        code,
        field,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DateParts {
    pub gregorian: String,
    pub hijri: String,
    pub hijri_month_en: String,
    pub hijri_month_ar: String,
    pub weekday: i64,
    pub weekday_en: String,
    pub weekday_ar: String,
    pub jdn: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ymd {
    pub years: i64,
    pub months: i64,
    pub days: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AgeReport {
    pub birth: DateParts,
    pub as_of: DateParts,
    pub gregorian_age: Ymd,
    pub hijri_age: Ymd,
    pub total_days: i64,
    pub next_gregorian_birthday: String,
    pub days_until_gregorian_birthday: i64,
    pub next_hijri_birthday: String,
    pub next_hijri_birthday_gregorian: String,
    pub days_until_hijri_birthday: i64,
    pub leap_day_birth: bool,
}

pub fn normalize_digits(value: &str) -> String {
    value
        .chars()
        .map(|ch| match ch {
            '٠' | '۰' => '0',
            '١' | '۱' => '1',
            '٢' | '۲' => '2',
            '٣' | '۳' => '3',
            '٤' | '۴' => '4',
            '٥' | '۵' => '5',
            '٦' | '۶' => '6',
            '٧' | '۷' => '7',
            '٨' | '۸' => '8',
            '٩' | '۹' => '9',
            other => other,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

pub fn is_gregorian_leap(year: i64) -> bool {
    year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
}

pub fn is_hijri_leap(year: i64) -> bool {
    year >= 1 && LEAP_YEARS_IN_CYCLE.contains(&(year % 30))
}

pub fn days_in_gregorian_month(year: i64, month: i64) -> i64 {
    if month == 2 && is_gregorian_leap(year) {
        return 29;
    }
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => 28,
        _ => 0,
    }
}

pub fn days_in_hijri_month(year: i64, month: i64) -> i64 {
    if !(1..=12).contains(&month) {
        return 0;
    }
    if month % 2 == 1 {
        return 30;
    }
    if month == 12 && is_hijri_leap(year) {
        return 30;
    }
    29
}

pub fn gregorian_to_jdn(year: i64, month: i64, day: i64) -> i64 {
    let a = (14 - month).div_euclid(12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    day + (153 * m + 2).div_euclid(5) + 365 * y + y.div_euclid(4) - y.div_euclid(100) + y.div_euclid(400) - 32045
}

pub fn jdn_to_gregorian(jdn: i64) -> Date {
    let a = jdn + 32044;
    let b = (4 * a + 3).div_euclid(146097);
    let c = a - (146097 * b).div_euclid(4);
    let d = (4 * c + 3).div_euclid(1461);
    let e = c - (1461 * d).div_euclid(4);
    let m = (5 * e + 2).div_euclid(153);
    let day = e - (153 * m + 2).div_euclid(5) + 1;
    let month = m + 3 - 12 * m.div_euclid(10);
    let year = 100 * b + d - 4800 + m.div_euclid(10);
    (year, month, day)
}

pub fn hijri_to_jdn(year: i64, month: i64, day: i64) -> i64 {
    let month_offset = 29 * (month - 1) + month.div_euclid(2);
    let rd = day + month_offset + (year - 1) * 354 + (3 + 11 * year).div_euclid(30) + 227015 - 1;
    rd + 1_721_425
}

pub fn jdn_to_hijri(jdn: i64) -> Result<Date, AgeError> {
    if jdn < HIJRI_EPOCH_JDN {
        return Err(err(
            "Date is before the Hijri epoch (19 July 622 CE).",
            "before-hijri-epoch",
            None,
        ));
    }
    let days = jdn - HIJRI_EPOCH_JDN;
    let mut year = (30 * days + 10646).div_euclid(10631);
    if year < 1 {
        year = 1;
    }
    while year > 1 && hijri_to_jdn(year, 1, 1) > jdn {
        year -= 1;
    }
    while hijri_to_jdn(year + 1, 1, 1) <= jdn {
        year += 1;
    }
    let mut month = 1;
    while month < 12 && hijri_to_jdn(year, month + 1, 1) <= jdn {
        month += 1;
    }
    let day = jdn - hijri_to_jdn(year, month, 1) + 1;
    Ok((year, month, day))
}

pub fn weekday_from_jdn(jdn: i64) -> i64 {
    (jdn + 1).rem_euclid(7)
}

pub fn iso(date: Date) -> String {
    format!("{:04}-{:02}-{:02}", date.0, date.1, date.2)
}

pub fn canonical_calendar(name: &str) -> Result<&'static str, AgeError> {
    match normalize_digits(name).to_lowercase().as_str() {
        "gregorian" | "g" | "ce" | "miladi" | "ميلادي" => Ok("gregorian"),
        "hijri" | "h" | "ah" | "islamic" | "هجري" => Ok("hijri"),
        _ => Err(err(
            "Calendar must be gregorian or hijri.",
            "invalid-calendar",
            Some("calendar"),
        )),
    }
}

pub fn parse_date(value: &str, calendar: &str, field: &'static str) -> Result<Date, AgeError> {
    let cleaned = normalize_digits(value);
    let parts: Vec<&str> = cleaned.split('-').collect();
    if parts.len() != 3
        || parts.iter().any(|part| part.is_empty() || !part.chars().all(|ch| ch.is_ascii_digit()))
    {
        return Err(err(
            &format!("Could not read {field} as YYYY-MM-DD."),
            "invalid-date",
            Some(field),
        ));
    }
    let year: i64 = parts[0].parse().unwrap_or(0);
    let month: i64 = parts[1].parse().unwrap_or(0);
    let day: i64 = parts[2].parse().unwrap_or(0);
    let limit = if calendar == "gregorian" {
        days_in_gregorian_month(year, month)
    } else {
        days_in_hijri_month(year, month)
    };
    if !(1..=9999).contains(&year) || !(1..=12).contains(&month) || day < 1 || day > limit {
        return Err(err(
            &format!("{field} is not a real {calendar} date."),
            "invalid-date",
            Some(field),
        ));
    }
    Ok((year, month, day))
}

fn to_jdn(date: Date, calendar: &str) -> i64 {
    if calendar == "gregorian" {
        gregorian_to_jdn(date.0, date.1, date.2)
    } else {
        hijri_to_jdn(date.0, date.1, date.2)
    }
}

fn gregorian_date(date: Date, calendar: &str) -> Date {
    if calendar == "gregorian" {
        date
    } else {
        jdn_to_gregorian(hijri_to_jdn(date.0, date.1, date.2))
    }
}

fn hijri_date(date: Date, calendar: &str) -> Result<Date, AgeError> {
    if calendar == "hijri" {
        Ok(date)
    } else {
        jdn_to_hijri(gregorian_to_jdn(date.0, date.1, date.2))
    }
}

fn period_between(start: Date, end: Date, days_in_month: fn(i64, i64) -> i64) -> Result<Ymd, AgeError> {
    let mut years = end.0 - start.0;
    let mut months = end.1 - start.1;
    let mut days = end.2 - start.2;
    let mut cursor_year = end.0;
    let mut cursor_month = end.1;
    let mut guard = 0;
    while days < 0 {
        if guard > 5 {
            return Err(err("Could not resolve the year/month/day age.", "internal", None));
        }
        guard += 1;
        months -= 1;
        if cursor_month == 1 {
            cursor_year -= 1;
            cursor_month = 12;
        } else {
            cursor_month -= 1;
        }
        days += days_in_month(cursor_year, cursor_month);
    }
    while months < 0 {
        years -= 1;
        months += 12;
    }
    Ok(Ymd { years, months, days })
}

fn anniversary(birth: Date, year: i64, days_in_month: fn(i64, i64) -> i64) -> Date {
    if birth.2 <= days_in_month(year, birth.1) {
        return (year, birth.1, birth.2);
    }
    let overflow = birth.2 - days_in_month(year, birth.1);
    if birth.1 == 12 {
        (year + 1, 1, overflow)
    } else {
        (year, birth.1 + 1, overflow)
    }
}

fn next_anniversary(birth: Date, as_of: Date, days_in_month: fn(i64, i64) -> i64) -> Result<Date, AgeError> {
    let mut best: Option<Date> = None;
    for year in (as_of.0 - 1)..=(as_of.0 + 2) {
        if year < 1 {
            continue;
        }
        let candidate = anniversary(birth, year, days_in_month);
        if candidate >= as_of && best.map(|current| candidate < current).unwrap_or(true) {
            best = Some(candidate);
        }
    }
    best.ok_or_else(|| err("Could not find the next birthday.", "internal", None))
}

fn parts(date: Date, calendar: &str) -> Result<DateParts, AgeError> {
    let greg = gregorian_date(date, calendar);
    let hijri = hijri_date(date, calendar)?;
    let jdn = gregorian_to_jdn(greg.0, greg.1, greg.2);
    let weekday = weekday_from_jdn(jdn);
    Ok(DateParts {
        gregorian: iso(greg),
        hijri: iso(hijri),
        hijri_month_en: MONTHS_EN[(hijri.1 - 1) as usize].to_string(),
        hijri_month_ar: MONTHS_AR[(hijri.1 - 1) as usize].to_string(),
        weekday,
        weekday_en: WEEKDAYS_EN[weekday as usize].to_string(),
        weekday_ar: WEEKDAYS_AR[weekday as usize].to_string(),
        jdn,
    })
}

/// Today's UTC date. The other language packages use the local civil date.
pub fn today_utc() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0);
    iso(jdn_to_gregorian(2_440_588 + secs.div_euclid(86_400)))
}

pub fn calculate_age(
    birth: &str,
    birth_calendar: &str,
    as_of: Option<&str>,
    as_of_calendar: &str,
) -> Result<AgeReport, AgeError> {
    let birth_cal = canonical_calendar(birth_calendar)?;
    let birth_date = parse_date(birth, birth_cal, "birth")?;
    let today_holder: String;
    let as_of_text: &str;
    let as_of_cal: &str;
    if let Some(value) = as_of {
        as_of_text = value;
        as_of_cal = canonical_calendar(as_of_calendar)?;
    } else {
        today_holder = today_utc();
        as_of_text = &today_holder;
        as_of_cal = "gregorian";
    }
    let as_of_date = parse_date(as_of_text, as_of_cal, "asOf")?;
    let birth_jdn = to_jdn(birth_date, birth_cal);
    let as_of_jdn = to_jdn(as_of_date, as_of_cal);
    if as_of_jdn < birth_jdn {
        return Err(err(
            "The as-of date is before the birth date.",
            "future-birth",
            Some("asOf"),
        ));
    }
    let birth_g = gregorian_date(birth_date, birth_cal);
    let as_of_g = gregorian_date(as_of_date, as_of_cal);
    let birth_h = hijri_date(birth_date, birth_cal)?;
    let as_of_h = hijri_date(as_of_date, as_of_cal)?;
    let gregorian_age = period_between(birth_g, as_of_g, days_in_gregorian_month)?;
    let hijri_age = period_between(birth_h, as_of_h, days_in_hijri_month)?;
    let next_g = next_anniversary(birth_g, as_of_g, days_in_gregorian_month)?;
    let next_h = next_anniversary(birth_h, as_of_h, days_in_hijri_month)?;
    let next_h_g = jdn_to_gregorian(hijri_to_jdn(next_h.0, next_h.1, next_h.2));
    Ok(AgeReport {
        birth: parts(birth_date, birth_cal)?,
        as_of: parts(as_of_date, as_of_cal)?,
        gregorian_age,
        hijri_age,
        total_days: as_of_jdn - birth_jdn,
        next_gregorian_birthday: iso(next_g),
        days_until_gregorian_birthday: gregorian_to_jdn(next_g.0, next_g.1, next_g.2) - as_of_jdn,
        next_hijri_birthday: iso(next_h),
        next_hijri_birthday_gregorian: iso(next_h_g),
        days_until_hijri_birthday: hijri_to_jdn(next_h.0, next_h.1, next_h.2) - as_of_jdn,
        leap_day_birth: birth_g.1 == 2 && birth_g.2 == 29,
    })
}

fn json_string(value: &str) -> String {
    let mut out = String::from("\"");
    for ch in value.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            other => out.push(other),
        }
    }
    out.push('"');
    out
}

impl AgeReport {
    pub fn to_json(&self) -> String {
        format!(
            concat!(
                "{{\n",
                "  \"version\": \"1.0.0\",\n",
                "  \"homepage\": \"https://hisabaleumr.com/\",\n",
                "  \"gregorianAge\": {{\"years\": {gy}, \"months\": {gm}, \"days\": {gd}}},\n",
                "  \"hijriAge\": {{\"years\": {hy}, \"months\": {hm}, \"days\": {hd}}},\n",
                "  \"totalDays\": {total},\n",
                "  \"birth\": {{\"gregorian\": {bg}, \"hijri\": {bh}}},\n",
                "  \"asOf\": {{\"gregorian\": {ag}, \"hijri\": {ah}}},\n",
                "  \"nextGregorianBirthday\": {{\"date\": {ng}, \"daysUntil\": {ngd}}},\n",
                "  \"nextHijriBirthday\": {{\"hijri\": {nh}, \"gregorian\": {nhg}, \"daysUntil\": {nhd}}},\n",
                "  \"limitationEn\": {lim}\n",
                "}}"
            ),
            gy = self.gregorian_age.years,
            gm = self.gregorian_age.months,
            gd = self.gregorian_age.days,
            hy = self.hijri_age.years,
            hm = self.hijri_age.months,
            hd = self.hijri_age.days,
            total = self.total_days,
            bg = json_string(&self.birth.gregorian),
            bh = json_string(&self.birth.hijri),
            ag = json_string(&self.as_of.gregorian),
            ah = json_string(&self.as_of.hijri),
            ng = json_string(&self.next_gregorian_birthday),
            ngd = self.days_until_gregorian_birthday,
            nh = json_string(&self.next_hijri_birthday),
            nhg = json_string(&self.next_hijri_birthday_gregorian),
            nhd = self.days_until_hijri_birthday,
            lim = json_string(LIMITATION_EN),
        )
    }

    pub fn format_report(&self) -> String {
        format!(
            "Hisab Al-Umr {VERSION}\nBirth: {bg}  ·  {bh} {bme} / {bma}  ·  {bwe}\nAs of: {ag}  ·  {ah} {ame} / {ama}  ·  {awe}\nGregorian age: {gy} years, {gm} months, {gd} days\nHijri age: {hy} years, {hm} months, {hd} days\nTotal days: {total}\nNext Gregorian birthday: {ng} ({ngd} days)\nNext Hijri birthday: {nh} = {nhg} ({nhd} days)\n{lim}",
            bg = self.birth.gregorian,
            bh = self.birth.hijri,
            bme = self.birth.hijri_month_en,
            bma = self.birth.hijri_month_ar,
            bwe = self.birth.weekday_en,
            ag = self.as_of.gregorian,
            ah = self.as_of.hijri,
            ame = self.as_of.hijri_month_en,
            ama = self.as_of.hijri_month_ar,
            awe = self.as_of.weekday_en,
            gy = self.gregorian_age.years,
            gm = self.gregorian_age.months,
            gd = self.gregorian_age.days,
            hy = self.hijri_age.years,
            hm = self.hijri_age.months,
            hd = self.hijri_age.days,
            total = self.total_days,
            ng = self.next_gregorian_birthday,
            ngd = self.days_until_gregorian_birthday,
            nh = self.next_hijri_birthday,
            nhg = self.next_hijri_birthday_gregorian,
            nhd = self.days_until_hijri_birthday,
            lim = LIMITATION_EN,
        )
    }
}
