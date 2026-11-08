# frozen_string_literal: true

require_relative "lib/hisab_age_calculator"

Gem::Specification.new do |spec|
  spec.name = "hisab-age-calculator"
  spec.version = HisabAgeCalculator::VERSION
  spec.summary = "Gregorian and tabular civil Hijri age calculator."
  spec.description = "Years, months and days in the Gregorian calendar and the Kuwaiti tabular Hijri calendar, " \
                     "total days lived, and the next birthday. 29 February is observed on 1 March in a common year. " \
                     "Accepts Arabic-Indic digits. Library and CLI, no network."
  spec.authors = ["Hisab Al-Umr"]
  spec.license = "MIT"
  spec.homepage = "https://hisabaleumr.com/"
  spec.files = Dir["lib/**/*.rb", "exe/*", "README.md", "LICENSE"]
  spec.bindir = "exe"
  spec.executables = ["hisab-age-calculator"]
  spec.required_ruby_version = ">= 2.7"
  spec.metadata = {
    "homepage_uri" => "https://hisabaleumr.com/",
    "source_code_uri" => "https://github.com/nbkdevs/hisab-al-umr",
    "bug_tracker_uri" => "https://github.com/nbkdevs/hisab-al-umr/issues",
    "rubygems_mfa_required" => "true"
  }
end
