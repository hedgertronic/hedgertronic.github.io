"""Tests for the process_stats.py module."""

import csv
import sys
from pathlib import Path

import pytest

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
    ORG_MAP,
    StatsRow,
    aggregate_stats,
    get_covered_seasons,
    merge_bbref_milb_rows,
    read_bbref_stats,
    read_milb_stats,
    process_stats,
    INPUT_FILE,
    MILB_API_FILE,
    OUTPUT_FILE,
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

    def test_level_map_includes_single_a(self):
        assert "A" in LEVEL_MAP

    def test_category_map_minors_levels(self):
        minors_levels = ["Rk", "A-", "A+", "AA", "AAA"]
        for level in minors_levels:
            assert CATEGORY_MAP[level] == "Minors"

    def test_category_map_single_a_is_minors(self):
        assert CATEGORY_MAP["A"] == "Minors"

    def test_category_map_college(self):
        assert CATEGORY_MAP["NCAA"] == "College"

    def test_category_map_summer(self):
        assert CATEGORY_MAP["Smr"] == "Summer"


class TestOrgMap:
    """Tests for organization mappings."""

    def test_org_map_has_mets(self):
        assert ORG_MAP["NYM"] == "Mets"

    def test_org_map_has_phillies(self):
        assert ORG_MAP["PHI"] == "Phillies"

    def test_org_map_has_rangers(self):
        assert ORG_MAP["TEX"] == "Rangers"

    def test_org_map_has_marlins(self):
        assert ORG_MAP["MIA"] == "Marlins"


class TestStatsRowDefaults:
    """Tests for StatsRow optional field defaults (MiLB-only fields)."""

    def _make_row(self, **overrides) -> StatsRow:
        defaults = dict(
            year="2024", team="SYR", league="IL", level="AAA",
            category="Minors", org="Mets",
            w=0, l=0, era=3.00, g=10, gs=0, cg=0, sho=0, sv=0,
            ip=15.0, h=12, r=5, er=5, hr=1, bb=3, ibb=0, so=18,
            hbp=1, bf=60, whip=1.00,
        )
        defaults.update(overrides)
        return StatsRow(**defaults)

    def test_hld_defaults_to_zero(self):
        row = self._make_row()
        assert row.hld == 0

    def test_svo_defaults_to_zero(self):
        row = self._make_row()
        assert row.svo == 0

    def test_np_defaults_to_zero(self):
        row = self._make_row()
        assert row.np == 0

    def test_goao_defaults_to_dash(self):
        row = self._make_row()
        assert row.goao == "-"

    def test_explicit_hld_value(self):
        row = self._make_row(hld=3)
        assert row.hld == 3

    def test_explicit_goao_value(self):
        row = self._make_row(goao="2.50")
        assert row.goao == "2.50"


class TestGetCoveredSeasons:
    """Tests for get_covered_seasons()."""

    def _make_milb_row(self, year: str, level: str) -> StatsRow:
        return StatsRow(
            year=year, team="SYR", league="IL", level=level,
            category="Minors", org="Mets",
            w=0, l=0, era=3.00, g=5, gs=0, cg=0, sho=0, sv=0,
            ip=5.0, h=4, r=2, er=2, hr=0, bb=1, ibb=0, so=6,
            hbp=0, bf=20, whip=1.00,
        )

    def test_empty_milb_returns_empty_set(self):
        assert get_covered_seasons([]) == set()

    def test_returns_year_level_tuples(self):
        rows = [
            self._make_milb_row("2024", "AAA"),
            self._make_milb_row("2024", "AA"),
            self._make_milb_row("2025", "AA"),
        ]
        covered = get_covered_seasons(rows)
        assert ("2024", "AAA") in covered
        assert ("2024", "AA") in covered
        assert ("2025", "AA") in covered
        assert len(covered) == 3

    def test_deduplicates_same_year_level(self):
        rows = [
            self._make_milb_row("2026", "AAA"),
            self._make_milb_row("2026", "AAA"),
        ]
        assert len(get_covered_seasons(rows)) == 1


class TestMergeBbrefMilbRows:
    """Tests for merge_bbref_milb_rows() — the core deduplication logic."""

    def _row(
        self, year: str, level: str, category: str, team: str = "TST",
        ip: float = 10.0
    ) -> StatsRow:
        return StatsRow(
            year=year, team=team, league="TST", level=level,
            category=category, org="Mets",
            w=1, l=0, era=3.00, g=5, gs=0, cg=0, sho=0, sv=0,
            ip=ip, h=8, r=3, er=3, hr=0, bb=2, ibb=0, so=10,
            hbp=0, bf=35, whip=1.00,
        )

    def test_no_milb_returns_all_bbref(self):
        bbref = [
            self._row("2024", "AAA", "Minors"),
            self._row("2024", "NCAA", "College"),
        ]
        result = merge_bbref_milb_rows(bbref, [])
        assert result == bbref

    def test_milb_replaces_covered_bbref_minors(self):
        bbref_minors = self._row("2024", "AAA", "Minors", team="BBREF", ip=20.0)
        milb_minors = self._row("2024", "AAA", "Minors", team="MILB", ip=22.0)
        result = merge_bbref_milb_rows([bbref_minors], [milb_minors])
        teams = [r.team for r in result]
        assert "MILB" in teams
        assert "BBREF" not in teams

    def test_uncovered_bbref_minors_row_is_kept(self):
        # Kingsport Rk (2019): not covered by milb API (sport 16 returns nothing)
        kingsport_rk = self._row("2019", "Rk+", "Minors", team="KNG", ip=8.1)
        brooklyn_ams = self._row("2019", "A-", "Minors", team="MILB_BRK", ip=12.0)
        # API covers A- for 2019 but not Rk+
        milb_rows = [brooklyn_ams]
        result = merge_bbref_milb_rows([kingsport_rk], milb_rows)
        teams = [r.team for r in result]
        assert "KNG" in teams, "Kingsport Rk row should be preserved when API has no Rk+ data"
        assert "MILB_BRK" in teams

    def test_college_row_always_kept(self):
        bbref_college = self._row("2024", "NCAA", "College", team="JHU")
        milb_row = self._row("2024", "AAA", "Minors", team="MILB")
        result = merge_bbref_milb_rows([bbref_college], [milb_row])
        teams = [r.team for r in result]
        assert "JHU" in teams
        assert "MILB" in teams

    def test_summer_row_always_kept(self):
        bbref_summer = self._row("2017", "Summer", "Summer", team="BAL")
        milb_row = self._row("2021", "AAA", "Minors", team="SYR")
        result = merge_bbref_milb_rows([bbref_summer], [milb_row])
        teams = [r.team for r in result]
        assert "BAL" in teams

    def test_independent_row_always_kept(self):
        bbref_ind = self._row("2019", "Independent", "Independent", team="WST")
        milb_row = self._row("2019", "A-", "Minors", team="BRK")
        result = merge_bbref_milb_rows([bbref_ind], [milb_row])
        teams = [r.team for r in result]
        assert "WST" in teams

    def test_both_sources_combined_when_no_overlap(self):
        bbref_college = self._row("2024", "NCAA", "College", team="JHU")
        milb_aaa = self._row("2024", "AAA", "Minors", team="SYR")
        result = merge_bbref_milb_rows([bbref_college], [milb_aaa])
        assert len(result) == 2

    def test_2026_new_orgs_included(self):
        """2026 data adds TEX (Round Rock) and MIA (Jacksonville) at AAA."""
        milb_rr = self._row("2026", "AAA", "Minors", team="RR")
        milb_jax = self._row("2026", "AAA", "Minors", team="JAX")
        result = merge_bbref_milb_rows([], [milb_rr, milb_jax])
        teams = [r.team for r in result]
        assert "RR" in teams
        assert "JAX" in teams


# ---------------------------------------------------------------------------
# End-to-end file-based tests using temporary fixture CSVs
# ---------------------------------------------------------------------------

BBREF_HEADER = (
    "Year,Age,AgeDif,Tm,Lg,Lev,Aff,W,L,W-L%,ERA,RA9,G,GS,GF,CG,SHO,SV,"
    "IP,H,R,ER,HR,BB,IBB,SO,HBP,BK,WP,BF,WHIP,H9,HR9,BB9,SO9,SO/W"
)

MILB_HEADER = (
    "Year,Tm,Lg,Lev,Aff,W,L,ERA,G,GS,CG,SHO,SV,IP,H,R,ER,HR,BB,IBB,SO,"
    "HBP,BF,WHIP,HLD,SVO,NP,GO/AO"
)


@pytest.fixture()
def fixture_dir(tmp_path: Path) -> Path:
    """Return a temporary directory pre-populated with fixture CSVs."""
    # bbref: one college row + one Rk minors row (pre-restructuring era)
    bbref_content = "\n".join([
        BBREF_HEADER,
        "2019,22,1.7,Johns Hopkins,CENT,NCAA,,6,2,0.750,2.91,4.07,25,3,,2,0,7,77.1,76,35,25,5,8,0,60,11,2,0,318,1.086,8.8,0.6,0.9,7.0,7.50",
        "2019,22,1.3,Kingsport,APPY,Rk,NYM,0,0,,0.00,0.00,11,0,10,0,0,3,8.1,4,0,0,0,2,0,10,0,0,0,33,0.720,4.3,0.0,2.2,10.8,5.00",
        "2021,24,-0.7,Brooklyn,HAE,A+,NYM,2,1,0.667,3.28,5.47,24,0,6,0,0,1,49.1,58,30,18,1,11,1,40,5,0,1,215,1.399,10.6,0.2,2.0,7.3,3.64",
    ]) + "\n"

    # milb API: covers A+ for 2021 — but NOT Rk+ for 2019
    milb_content = "\n".join([
        MILB_HEADER,
        "2021,BRK,HAE,A+,NYM,2,1,3.28,24,0,0,0,1,49.1,58,30,18,1,11,1,40,5,215,1.40,0,0,850,2.00",
    ]) + "\n"

    (tmp_path / "bbref_stats.csv").write_text(bbref_content)
    (tmp_path / "milb_api_stats.csv").write_text(milb_content)
    return tmp_path


class TestEndToEndMerge:
    """End-to-end tests using temporary fixture CSV files.

    Monkeypatches the module-level path constants so no real data files are
    touched — no network access occurs.
    """

    def test_rk_row_preserved_when_api_has_no_rk_data(
        self, fixture_dir: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Kingsport Rk 2019 must survive the merge when milb_api has no Rk rows."""
        import process_stats as ps

        monkeypatch.setattr(ps, "INPUT_FILE", fixture_dir / "bbref_stats.csv")
        monkeypatch.setattr(ps, "MILB_API_FILE", fixture_dir / "milb_api_stats.csv")
        monkeypatch.setattr(ps, "OUTPUT_FILE", fixture_dir / "career_stats.csv")

        bbref_rows = ps.read_bbref_stats()
        milb_rows = ps.read_milb_stats()
        merged = ps.merge_bbref_milb_rows(bbref_rows, milb_rows)

        rk_rows = [r for r in merged if r.level == "Rk+"]
        assert rk_rows, "Kingsport Rk+ row should be preserved in merge output"
        assert rk_rows[0].team == "Kingsport"

    def test_covered_a_plus_row_is_not_doubled(
        self, fixture_dir: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A+ 2021 Brooklyn appears in both bbref and milb — only milb version kept."""
        import process_stats as ps

        monkeypatch.setattr(ps, "INPUT_FILE", fixture_dir / "bbref_stats.csv")
        monkeypatch.setattr(ps, "MILB_API_FILE", fixture_dir / "milb_api_stats.csv")
        monkeypatch.setattr(ps, "OUTPUT_FILE", fixture_dir / "career_stats.csv")

        bbref_rows = ps.read_bbref_stats()
        milb_rows = ps.read_milb_stats()
        merged = ps.merge_bbref_milb_rows(bbref_rows, milb_rows)

        aplus_rows = [r for r in merged if r.level == "A+" and r.year == "2021"]
        assert len(aplus_rows) == 1, "A+ 2021 should appear exactly once after merge"
        # milb row preserves team abbreviation from API ("BRK")
        assert aplus_rows[0].team == "BRK"

    def test_college_row_always_comes_from_bbref(
        self, fixture_dir: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import process_stats as ps

        monkeypatch.setattr(ps, "INPUT_FILE", fixture_dir / "bbref_stats.csv")
        monkeypatch.setattr(ps, "MILB_API_FILE", fixture_dir / "milb_api_stats.csv")
        monkeypatch.setattr(ps, "OUTPUT_FILE", fixture_dir / "career_stats.csv")

        bbref_rows = ps.read_bbref_stats()
        milb_rows = ps.read_milb_stats()
        merged = ps.merge_bbref_milb_rows(bbref_rows, milb_rows)

        college_rows = [r for r in merged if r.category == "College"]
        assert college_rows, "College rows from bbref should always be present"

    def test_process_stats_writes_output_file(
        self, fixture_dir: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import process_stats as ps

        monkeypatch.setattr(ps, "INPUT_FILE", fixture_dir / "bbref_stats.csv")
        monkeypatch.setattr(ps, "MILB_API_FILE", fixture_dir / "milb_api_stats.csv")
        monkeypatch.setattr(ps, "OUTPUT_FILE", fixture_dir / "career_stats.csv")

        ps.process_stats()

        out = fixture_dir / "career_stats.csv"
        assert out.exists(), "career_stats.csv should be written"
        rows = list(csv.DictReader(out.read_text().splitlines()))
        assert rows, "Output file should have data rows"

        # Verify Rk+ level total row exists (means Kingsport survived the merge)
        rk_totals = [r for r in rows if r.get("Season") == "" and r.get("Level") == "Rk+"]
        assert rk_totals, "Rk+ level total row should appear in output"

    def test_no_milb_file_falls_back_to_bbref_only(
        self, fixture_dir: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """When milb_api_stats.csv is absent, all rows come from bbref."""
        import process_stats as ps

        monkeypatch.setattr(ps, "INPUT_FILE", fixture_dir / "bbref_stats.csv")
        # Point to a non-existent file so milb_rows == []
        monkeypatch.setattr(ps, "MILB_API_FILE", fixture_dir / "no_such_file.csv")
        monkeypatch.setattr(ps, "OUTPUT_FILE", fixture_dir / "career_stats_no_milb.csv")

        ps.process_stats()

        out = fixture_dir / "career_stats_no_milb.csv"
        assert out.exists()
        rows = list(csv.DictReader(out.read_text().splitlines()))
        # All three original bbref rows (college, Rk, A+) should produce output
        assert rows
