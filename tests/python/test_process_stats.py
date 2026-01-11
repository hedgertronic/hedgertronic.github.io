"""Tests for the process_stats.py module."""

import sys
from pathlib import Path

# Add tools directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "tools"))

from process_stats import (
    parse_ip,
    format_ip,
    safe_int,
    safe_float,
    calculate_era,
    calculate_whip,
    calculate_avg,
    LEVEL_MAP,
    CATEGORY_MAP,
)


class TestParseIP:
    """Tests for baseball IP notation parsing."""

    def test_whole_innings(self):
        assert parse_ip("5.0") == 5.0

    def test_one_third_inning(self):
        result = parse_ip("5.1")
        assert abs(result - 5.333) < 0.01

    def test_two_thirds_inning(self):
        result = parse_ip("5.2")
        assert abs(result - 5.667) < 0.01

    def test_empty_string(self):
        assert parse_ip("") == 0.0

    def test_dash(self):
        assert parse_ip("-") == 0.0

    def test_zero(self):
        assert parse_ip("0") == 0.0


class TestFormatIP:
    """Tests for converting decimal IP back to baseball notation."""

    def test_whole_innings(self):
        assert format_ip(5.0) == "5.0"

    def test_one_third_inning(self):
        assert format_ip(5 + 1 / 3) == "5.1"

    def test_two_thirds_inning(self):
        assert format_ip(5 + 2 / 3) == "5.2"

    def test_zero(self):
        assert format_ip(0.0) == "0.0"


class TestSafeConversions:
    """Tests for safe type conversions."""

    def test_safe_int_valid(self):
        assert safe_int("42") == 42

    def test_safe_int_empty(self):
        assert safe_int("") == 0

    def test_safe_int_dash(self):
        assert safe_int("-") == 0

    def test_safe_int_invalid(self):
        assert safe_int("abc") == 0

    def test_safe_int_custom_default(self):
        assert safe_int("", default=-1) == -1

    def test_safe_float_valid(self):
        assert safe_float("3.14") == 3.14

    def test_safe_float_empty(self):
        assert safe_float("") == 0.0

    def test_safe_float_dash(self):
        assert safe_float("-") == 0.0


class TestCalculateERA:
    """Tests for ERA calculation."""

    def test_standard_era(self):
        # 3 ER in 9 IP = 3.00 ERA
        assert calculate_era(3, 9.0) == 3.0

    def test_zero_innings(self):
        assert calculate_era(5, 0.0) == 0.0

    def test_no_runs(self):
        assert calculate_era(0, 10.0) == 0.0

    def test_fractional_innings(self):
        # 2 ER in 6.1 IP
        result = calculate_era(2, 6 + 1 / 3)
        assert abs(result - 2.84) < 0.1


class TestCalculateWHIP:
    """Tests for WHIP calculation."""

    def test_standard_whip(self):
        # 9 H + 3 BB in 9 IP = 1.33 WHIP
        result = calculate_whip(9, 3, 9.0)
        assert abs(result - 1.333) < 0.01

    def test_zero_innings(self):
        assert calculate_whip(5, 2, 0.0) == 0.0

    def test_perfect_whip(self):
        # 9 H + 0 BB in 9 IP = 1.00 WHIP
        assert calculate_whip(9, 0, 9.0) == 1.0


class TestCalculateAVG:
    """Tests for opponent batting average calculation."""

    def test_standard_avg(self):
        # 25 H in 100 AB (BF=110, BB=8, HBP=2)
        result = calculate_avg(25, 110, 8, 2)
        assert result == ".250"

    def test_zero_at_bats(self):
        # All BB and HBP, no AB
        result = calculate_avg(0, 10, 8, 2)
        assert result == "-"

    def test_high_avg(self):
        # 30 H in 100 AB
        result = calculate_avg(30, 100, 0, 0)
        assert result == ".300"


class TestLevelMappings:
    """Tests for level and category mappings."""

    def test_level_map_contains_all_levels(self):
        expected_levels = ["NCAA", "Smr", "Ind", "Rk", "A-", "A+", "AA", "AAA"]
        for level in expected_levels:
            assert level in LEVEL_MAP

    def test_category_map_minors_levels(self):
        minors_levels = ["Rk", "A-", "A+", "AA", "AAA"]
        for level in minors_levels:
            assert CATEGORY_MAP[level] == "Minors"

    def test_category_map_college(self):
        assert CATEGORY_MAP["NCAA"] == "College"

    def test_category_map_summer(self):
        assert CATEGORY_MAP["Smr"] == "Summer"
