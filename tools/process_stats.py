#!/usr/bin/env python3
"""Process Baseball Reference stats CSV into the format used by the website.

This script reads bbref_stats.csv and generates career_stats.csv with:
- Season aggregate rows for each category (College, Summer, Independent, Minors)
- Individual team rows for level badge extraction
- Career totals for each category
- Level totals for minors (Rk+, A-, A+, AA, AAA)
"""

import csv
from pathlib import Path
from collections import defaultdict
from typing import NamedTuple

PROJECT_ROOT = Path(__file__).parent.parent
INPUT_FILE = PROJECT_ROOT / "assets" / "documents" / "bbref_stats.csv"
OUTPUT_FILE = PROJECT_ROOT / "assets" / "documents" / "career_stats.csv"

# Output columns (matching existing format)
OUTPUT_COLUMNS = [
    "Season", "Team", "LG", "Level", "Org", "W", "L", "ERA", "G", "GS", "CG", "SHO",
    "HLD", "SV", "SVO", "IP", "H", "R", "ER", "HR", "NP", "HB", "BB", "IBB",
    "SO", "AVG", "WHIP", "GO/AO"
]

# Level mappings from bbref to our format
LEVEL_MAP = {
    "NCAA": "NCAA",
    "Smr": "Summer",
    "Ind": "Independent",
    "Rk": "Rk+",
    "A-": "A-",
    "A+": "A+",
    "AA": "AA",
    "AAA": "AAA",
}

# Category for each level type (uses bbref level codes)
CATEGORY_MAP = {
    "NCAA": "College",
    "Smr": "Summer",
    "Ind": "Independent",
    "Rk": "Minors",
    "A-": "Minors",
    "A+": "Minors",
    "AA": "Minors",
    "AAA": "Minors",
}

# Order for level totals output
LEVEL_ORDER = ["Rk+", "A-", "A+", "AA", "AAA"]

# Team abbreviation mappings
TEAM_ABBREV = {
    "Johns Hopkins": "JHU",
    "Baltimore Dodgers": "BAL",
    "Westside": "WST",
    "Brooklyn": "BRK",
    "Kingsport": "KNG",
    "Binghamton": "BNG",
    "Syracuse": "SYR",
    "Jersey Shore": "JS",
    "Reading": "REA",
}

# Organization mappings
ORG_MAP = {
    "NYM": "Mets",
    "PHI": "Phillies",
}

# Default org for non-affiliated categories
CATEGORY_ORG = {
    "College": "Johns Hopkins",
    "Summer": "Baltimore",
    "Independent": "Westside",
}


class StatsRow(NamedTuple):
    """Represents a row of pitching statistics."""
    year: str
    team: str
    league: str
    level: str
    category: str
    org: str
    w: int
    l: int
    era: float
    g: int
    gs: int
    cg: int
    sho: int
    sv: int
    ip: float
    h: int
    r: int
    er: int
    hr: int
    bb: int
    ibb: int
    so: int
    hbp: int
    bf: int
    whip: float


def parse_ip(ip_str: str) -> float:
    """Convert baseball IP notation to decimal (e.g., '20.1' -> 20.333)."""
    if not ip_str or ip_str == "-":
        return 0.0
    ip = float(ip_str)
    whole = int(ip)
    fraction = ip - whole
    # .1 = 1/3, .2 = 2/3
    if abs(fraction - 0.1) < 0.01:
        return whole + 1/3
    elif abs(fraction - 0.2) < 0.01:
        return whole + 2/3
    return ip


def format_ip(ip_decimal: float) -> str:
    """Convert decimal IP back to baseball notation."""
    whole = int(ip_decimal)
    fraction = ip_decimal - whole
    if abs(fraction - 1/3) < 0.01:
        return f"{whole}.1"
    elif abs(fraction - 2/3) < 0.01:
        return f"{whole}.2"
    return f"{whole}.0"


def safe_int(val: str, default: int = 0) -> int:
    """Safely convert string to int."""
    try:
        return int(val) if val and val != "-" else default
    except ValueError:
        return default


def safe_float(val: str, default: float = 0.0) -> float:
    """Safely convert string to float."""
    try:
        return float(val) if val and val != "-" else default
    except ValueError:
        return default


def calculate_era(er: int, ip: float) -> float:
    """Calculate ERA from earned runs and innings pitched."""
    if ip == 0:
        return 0.0
    return (er * 9) / ip


def calculate_whip(h: int, bb: int, ip: float) -> float:
    """Calculate WHIP from hits, walks, and innings pitched."""
    if ip == 0:
        return 0.0
    return (h + bb) / ip


def calculate_avg(h: int, bf: int, bb: int, hbp: int) -> str:
    """Calculate opponent batting average."""
    ab = bf - bb - hbp
    if ab <= 0:
        return "-"
    avg = h / ab
    return f".{int(avg * 1000):03d}"


def read_bbref_stats() -> list[StatsRow]:
    """Read and parse the bbref stats CSV."""
    rows = []

    with open(INPUT_FILE, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip empty rows
            if not row.get("Year") or not row["Year"].strip():
                continue

            # Skip aggregate rows (we'll calculate our own)
            team = row.get("Tm", "")
            if "Teams" in team or "teams" in team:
                continue

            level = row.get("Lev", "")
            if level not in LEVEL_MAP:
                continue

            # Determine organization
            category = CATEGORY_MAP[level]
            aff = row.get("Aff", "").strip()
            if aff and aff in ORG_MAP:
                org = ORG_MAP[aff]
            else:
                org = CATEGORY_ORG.get(category, "-")

            stats = StatsRow(
                year=row["Year"],
                team=team,
                league=row.get("Lg", ""),
                level=LEVEL_MAP[level],
                category=category,
                org=org,
                w=safe_int(row.get("W")),
                l=safe_int(row.get("L")),
                era=safe_float(row.get("ERA")),
                g=safe_int(row.get("G")),
                gs=safe_int(row.get("GS")),
                cg=safe_int(row.get("CG")),
                sho=safe_int(row.get("SHO")),
                sv=safe_int(row.get("SV")),
                ip=parse_ip(row.get("IP", "0")),
                h=safe_int(row.get("H")),
                r=safe_int(row.get("R")),
                er=safe_int(row.get("ER")),
                hr=safe_int(row.get("HR")),
                bb=safe_int(row.get("BB")),
                ibb=safe_int(row.get("IBB")),
                so=safe_int(row.get("SO")),
                hbp=safe_int(row.get("HBP")),
                bf=safe_int(row.get("BF")),
                whip=safe_float(row.get("WHIP")),
            )
            rows.append(stats)

    return rows


def aggregate_stats(rows: list[StatsRow]) -> StatsRow:
    """Aggregate multiple stat rows into a single row."""
    if not rows:
        raise ValueError("Cannot aggregate empty list")

    total_ip = sum(r.ip for r in rows)
    total_er = sum(r.er for r in rows)
    total_h = sum(r.h for r in rows)
    total_bb = sum(r.bb for r in rows)
    total_bf = sum(r.bf for r in rows)
    total_hbp = sum(r.hbp for r in rows)

    return StatsRow(
        year=rows[0].year,
        team=f"{len(rows)} team{'s' if len(rows) > 1 else ''}",
        league="-",
        level=rows[0].category,
        category=rows[0].category,
        org=rows[0].org,
        w=sum(r.w for r in rows),
        l=sum(r.l for r in rows),
        era=calculate_era(total_er, total_ip),
        g=sum(r.g for r in rows),
        gs=sum(r.gs for r in rows),
        cg=sum(r.cg for r in rows),
        sho=sum(r.sho for r in rows),
        sv=sum(r.sv for r in rows),
        ip=total_ip,
        h=total_h,
        r=sum(r.r for r in rows),
        er=total_er,
        hr=sum(r.hr for r in rows),
        bb=total_bb,
        ibb=sum(r.ibb for r in rows),
        so=sum(r.so for r in rows),
        hbp=total_hbp,
        bf=total_bf,
        whip=calculate_whip(total_h, total_bb, total_ip),
    )


def format_output_row(stats: StatsRow, team_override: str = None,
                      level_override: str = None, season_override: str = None,
                      org_override: str = None) -> dict:
    """Format a StatsRow into an output dictionary."""
    team = team_override or TEAM_ABBREV.get(stats.team, stats.team)

    # Calculate AVG
    avg = calculate_avg(stats.h, stats.bf, stats.bb, stats.hbp)

    return {
        "Season": season_override if season_override is not None else stats.year,
        "Team": team,
        "LG": stats.league,
        "Level": level_override or stats.level,
        "Org": org_override if org_override is not None else stats.org,
        "W": stats.w,
        "L": stats.l,
        "ERA": f"{stats.era:.2f}",
        "G": stats.g,
        "GS": stats.gs,
        "CG": stats.cg,
        "SHO": stats.sho,
        "HLD": "-",  # Not in bbref data
        "SV": stats.sv if stats.sv else "-",
        "SVO": "-",  # Not in bbref data
        "IP": format_ip(stats.ip),
        "H": stats.h,
        "R": stats.r,
        "ER": stats.er,
        "HR": stats.hr,
        "NP": "-",  # Not in bbref data
        "HB": stats.hbp,
        "BB": stats.bb,
        "IBB": stats.ibb,
        "SO": stats.so,
        "AVG": avg,
        "WHIP": f"{stats.whip:.2f}",
        "GO/AO": "-",  # Not in bbref data
    }


def process_stats():
    """Main processing function."""
    all_rows = read_bbref_stats()
    output_rows = []

    # Group by year and category
    year_category_groups = defaultdict(list)
    for row in all_rows:
        key = (row.year, row.category)
        year_category_groups[key].append(row)

    # Sort years
    years = sorted(set(r.year for r in all_rows))
    categories = ["College", "Summer", "Independent", "Minors"]

    # Generate season rows (aggregate + individual)
    for year in years:
        for category in categories:
            key = (year, category)
            if key not in year_category_groups:
                continue

            rows = year_category_groups[key]

            # Add aggregate row
            agg = aggregate_stats(rows)
            output_rows.append(format_output_row(agg))

            # Add individual team rows
            for row in rows:
                output_rows.append(format_output_row(row))

    # Generate career totals for each category
    category_groups = defaultdict(list)
    for row in all_rows:
        category_groups[row.category].append(row)

    for category in categories:
        if category not in category_groups:
            continue

        rows = category_groups[category]
        agg = aggregate_stats(rows)
        output_rows.append(format_output_row(
            agg,
            team_override="-",
            level_override=category,
            season_override=f"{category} Career",
            org_override="-"
        ))

    # Generate level totals for minors
    minors_rows = [r for r in all_rows if r.category == "Minors"]
    level_groups = defaultdict(list)
    for row in minors_rows:
        level_groups[row.level].append(row)

    # Order levels from lowest to highest
    for level in LEVEL_ORDER:
        if level not in level_groups:
            continue

        rows = level_groups[level]
        agg = aggregate_stats(rows)
        output_rows.append(format_output_row(
            agg,
            team_override="-",
            level_override=level,
            season_override="",
            org_override="-"
        ))

    # Write output
    with open(OUTPUT_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"Processed {len(all_rows)} individual rows")
    print(f"Generated {len(output_rows)} output rows")
    print(f"Output written to {OUTPUT_FILE}")


if __name__ == "__main__":
    process_stats()
