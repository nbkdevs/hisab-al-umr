# frozen_string_literal: true

require "json"
require "minitest/autorun"
require_relative "../lib/hisab_age_calculator"

class TestHisabAgeCalculator < Minitest::Test
  VECTORS = JSON.parse(File.read(File.expand_path("../../vectors.json", __dir__)))

  def test_anchors
    assert_equal [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29], (1..30).select { |year| HisabAgeCalculator.hijri_leap?(year) }
    assert_equal 2_451_545, HisabAgeCalculator.gregorian_to_jdn(2000, 1, 1)
    assert_equal [1999, 12, 9], HisabAgeCalculator.jdn_to_gregorian(HisabAgeCalculator.hijri_to_jdn(1420, 9, 1))
    assert_equal [1420, 9, 24], HisabAgeCalculator.jdn_to_hijri(HisabAgeCalculator.gregorian_to_jdn(2000, 1, 1))
    assert_equal "https://hisabaleumr.com/", HisabAgeCalculator::HOMEPAGE
    assert_includes HisabAgeCalculator::LIMITATION_EN, "Umm al-Qura"
  end

  def test_vectors
    VECTORS["conversions"].each do |row|
      gy, gm, gd = row["gregorian"].split("-").map(&:to_i)
      hy, hm, hd = row["hijri"].split("-").map(&:to_i)
      assert_equal row["jdn"], HisabAgeCalculator.gregorian_to_jdn(gy, gm, gd)
      assert_equal row["jdn"], HisabAgeCalculator.hijri_to_jdn(hy, hm, hd)
    end
    VECTORS["ages"].each do |row|
      result = HisabAgeCalculator.calculate(
        row["birth"],
        birth_calendar: row["birthCalendar"],
        as_of: row["asOf"],
        as_of_calendar: row["asOfCalendar"]
      )
      assert_equal row["gregorianAge"], result["gregorianAge"]
      assert_equal row["hijriAge"], result["hijriAge"]
      assert_equal row["totalDays"], result["totalDays"]
      assert_equal row["birthGregorian"], result["birth"]["gregorian"]
      assert_equal row["birthHijri"], result["birth"]["hijri"]
      assert_equal row["nextGregorianBirthday"], result["nextGregorianBirthday"]["date"]
      assert_equal row["nextHijriBirthday"], result["nextHijriBirthday"]["hijri"]
      assert_equal "https://hisabaleumr.com/", result["homepage"]
    end
  end

  def test_arabic_digits
    result = HisabAgeCalculator.calculate("١٩٩٠-٠٥-١٥", as_of: "٢٠٢٦-١١-٠٨")
    assert_equal({ "years" => 36, "months" => 5, "days" => 24 }, result["gregorianAge"])
  end
end
