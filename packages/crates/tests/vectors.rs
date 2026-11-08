use hisab_age_calculator::{
    calculate_age, gregorian_to_jdn, hijri_to_jdn, is_hijri_leap, jdn_to_gregorian, jdn_to_hijri,
    weekday_from_jdn, HOMEPAGE, LEAP_YEARS_IN_CYCLE,
};
use serde_json::Value;

#[test]
fn shared_vectors() {
    let data: Value = serde_json::from_str(include_str!("../../vectors.json")).unwrap();
    assert_eq!(
        data["leapYearsInCycle"].as_array().unwrap().len(),
        LEAP_YEARS_IN_CYCLE.len()
    );
    let leaps: Vec<i64> = (1..=30).filter(|year| is_hijri_leap(*year)).collect();
    assert_eq!(leaps, LEAP_YEARS_IN_CYCLE);
    assert_eq!(gregorian_to_jdn(2000, 1, 1), 2_451_545);
    assert_eq!(jdn_to_gregorian(hijri_to_jdn(1420, 9, 1)), (1999, 12, 9));
    assert_eq!(jdn_to_hijri(gregorian_to_jdn(2000, 1, 1)).unwrap(), (1420, 9, 24));
    assert_eq!(HOMEPAGE, "https://hisabaleumr.com/");

    for row in data["conversions"].as_array().unwrap() {
        let greg = split(row["gregorian"].as_str().unwrap());
        let hijri = split(row["hijri"].as_str().unwrap());
        let jdn = row["jdn"].as_i64().unwrap();
        assert_eq!(gregorian_to_jdn(greg.0, greg.1, greg.2), jdn);
        assert_eq!(hijri_to_jdn(hijri.0, hijri.1, hijri.2), jdn);
        assert_eq!(weekday_from_jdn(jdn), row["weekday"].as_i64().unwrap());
    }

    for row in data["ages"].as_array().unwrap() {
        let report = calculate_age(
            row["birth"].as_str().unwrap(),
            row["birthCalendar"].as_str().unwrap(),
            Some(row["asOf"].as_str().unwrap()),
            row["asOfCalendar"].as_str().unwrap(),
        )
        .unwrap();
        assert_eq!(report.gregorian_age.years, row["gregorianAge"]["years"].as_i64().unwrap());
        assert_eq!(report.gregorian_age.months, row["gregorianAge"]["months"].as_i64().unwrap());
        assert_eq!(report.gregorian_age.days, row["gregorianAge"]["days"].as_i64().unwrap());
        assert_eq!(report.hijri_age.years, row["hijriAge"]["years"].as_i64().unwrap());
        assert_eq!(report.hijri_age.months, row["hijriAge"]["months"].as_i64().unwrap());
        assert_eq!(report.hijri_age.days, row["hijriAge"]["days"].as_i64().unwrap());
        assert_eq!(report.total_days, row["totalDays"].as_i64().unwrap());
        assert_eq!(report.birth.gregorian, row["birthGregorian"].as_str().unwrap());
        assert_eq!(report.birth.hijri, row["birthHijri"].as_str().unwrap());
        assert_eq!(report.next_gregorian_birthday, row["nextGregorianBirthday"].as_str().unwrap());
        assert_eq!(report.next_hijri_birthday, row["nextHijriBirthday"].as_str().unwrap());
        assert_eq!(
            report.next_hijri_birthday_gregorian,
            row["nextHijriBirthdayGregorian"].as_str().unwrap()
        );
    }
}

fn split(value: &str) -> (i64, i64, i64) {
    let mut parts = value.split('-').map(|part| part.parse::<i64>().unwrap());
    (parts.next().unwrap(), parts.next().unwrap(), parts.next().unwrap())
}
