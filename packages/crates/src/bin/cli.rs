use hisab_age_calculator::{calculate_age, AgeError, VERSION};
use std::env;
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    match run(&args) {
        Ok(code) => ExitCode::from(code),
        Err(error) => {
            eprintln!("{error}");
            ExitCode::from(1)
        }
    }
}

fn run(args: &[String]) -> Result<u8, AgeError> {
    let mut birth: Option<String> = None;
    let mut calendar = "gregorian".to_string();
    let mut as_of: Option<String> = None;
    let mut as_of_calendar = "gregorian".to_string();
    let mut json = false;
    let mut index = 0;
    while index < args.len() {
        let arg = &args[index];
        if arg == "--help" || arg == "-h" {
            println!("hisab-age-calculator — Gregorian and tabular civil Hijri age\n\nUsage:\n  hisab-age-calculator --birth 1990-05-15 [--as-of 2026-11-08] [--json]\n  hisab-age-calculator --birth 1420-09-01 --calendar hijri");
            return Ok(0);
        }
        if arg == "--version" {
            println!("hisab-age-calculator {VERSION}");
            return Ok(0);
        }
        if arg == "--json" {
            json = true;
            index += 1;
            continue;
        }
        if matches!(arg.as_str(), "--birth" | "--calendar" | "--birth-calendar" | "--as-of" | "--as-of-calendar") {
            let Some(value) = args.get(index + 1) else {
                eprintln!("Missing value for {arg}.");
                return Ok(1);
            };
            match arg.as_str() {
                "--birth" => birth = Some(value.clone()),
                "--calendar" | "--birth-calendar" => calendar = value.clone(),
                "--as-of" => as_of = Some(value.clone()),
                _ => as_of_calendar = value.clone(),
            }
            index += 2;
            continue;
        }
        if !arg.starts_with('-') && birth.is_none() {
            birth = Some(arg.clone());
            index += 1;
            continue;
        }
        eprintln!("Unknown argument {arg}.");
        return Ok(1);
    }
    let Some(birth) = birth else {
        eprintln!("Pass a birth date, for example: hisab-age-calculator --birth 1990-05-15");
        return Ok(1);
    };
    let report = calculate_age(&birth, &calendar, as_of.as_deref(), &as_of_calendar)?;
    if json {
        println!("{}", report.to_json());
    } else {
        println!("{}", report.format_report());
    }
    Ok(0)
}
