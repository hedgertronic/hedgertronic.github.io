#!/usr/bin/env python3
"""Fetch MiLB pitching stats from the MLB Stats API and write assets/documents/milb_api_stats.csv.

Player: Josh Hejka, MLB Stats API person ID 691196.

For each sportId in [11 (AAA), 12 (AA), 13 (A+), 14 (A), 15 (A- short-season), 16 (Rk)]:
  GET https://statsapi.mlb.com/api/v1/people/691196/stats?stats=yearByYear&group=pitching&sportId=<id>

Aggregate splits (no team.id) are skipped — they represent season rollups when a player
was on multiple teams. Only per-team rows are kept.

Each team's parent MLB org abbreviation is resolved via
  GET https://statsapi.mlb.com/api/v1/teams/<teamId>
and cached in memory to avoid redundant calls.

Output CSV schema matches tools/process_stats.py's expected input columns (same as
bbref_stats.csv) plus MiLB-specific columns: HLD, SVO, NP, GO/AO.
"""

import csv
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from common import PROJECT_ROOT

OUTPUT_FILE = PROJECT_ROOT / "assets" / "documents" / "milb_api_stats.csv"

PERSON_ID = 691196
SPORT_IDS = [11, 12, 13, 14, 15, 16]
STATS_URL = (
    "https://statsapi.mlb.com/api/v1/people/{person_id}/stats"
    "?stats=yearByYear&group=pitching&sportId={sport_id}"
)
TEAMS_URL = "https://statsapi.mlb.com/api/v1/teams/{team_id}"
USER_AGENT = "hedgertronic-portfolio-fetcher/1.0 (milb stats sync)"

# Map from MLB Stats API sportId → bbref-style level code used by process_stats.py
SPORT_LEVEL = {
    11: "AAA",
    12: "AA",
    13: "A+",
    14: "A",
    15: "A-",
    16: "Rk",
}

# Map from parentOrgName (from Teams API) → 3-letter Aff abbreviation
# used by process_stats.py's ORG_MAP
PARENT_ORG_AFF = {
    "New York Mets": "NYM",
    "Philadelphia Phillies": "PHI",
    "Texas Rangers": "TEX",
    "Miami Marlins": "MIA",
    "Los Angeles Dodgers": "LAD",
    "New York Yankees": "NYY",
    "Boston Red Sox": "BOS",
    "Chicago Cubs": "CHC",
    "Chicago White Sox": "CWS",
    "Atlanta Braves": "ATL",
    "Houston Astros": "HOU",
    "Los Angeles Angels": "LAA",
    "Oakland Athletics": "OAK",
    "Seattle Mariners": "SEA",
    "San Francisco Giants": "SF",
    "Cincinnati Reds": "CIN",
    "Cleveland Guardians": "CLE",
    "Colorado Rockies": "COL",
    "Detroit Tigers": "DET",
    "Kansas City Royals": "KC",
    "Milwaukee Brewers": "MIL",
    "Minnesota Twins": "MIN",
    "Pittsburgh Pirates": "PIT",
    "San Diego Padres": "SD",
    "St. Louis Cardinals": "STL",
    "Tampa Bay Rays": "TB",
    "Toronto Blue Jays": "TOR",
    "Washington Nationals": "WSH",
    "Baltimore Orioles": "BAL",
    "Arizona Diamondbacks": "ARI",
}

OUTPUT_COLUMNS = [
    "Year", "Tm", "Lg", "Lev", "Aff",
    "W", "L", "ERA", "G", "GS", "CG", "SHO", "SV",
    "IP", "H", "R", "ER", "HR", "BB", "IBB", "SO", "HBP", "BF", "WHIP",
    "HLD", "SVO", "NP", "GO/AO",
]

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})
_team_cache: dict[int, dict] = {}


def fetch_splits(sport_id: int) -> list[dict]:
    """Fetch yearByYear splits for one sport level. Returns empty list on failure."""
    url = STATS_URL.format(person_id=PERSON_ID, sport_id=sport_id)
    try:
        resp = _session.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        stats_list = data.get("stats", [])
        if not stats_list:
            return []
        return stats_list[0].get("splits", [])
    except Exception as exc:
        print(
            f"WARNING: Failed to fetch sportId={sport_id}: {exc}; skipping",
            file=sys.stderr,
        )
        return []


def fetch_team(team_id: int) -> dict:
    """Fetch team info (cached). Returns {} on failure."""
    if team_id in _team_cache:
        return _team_cache[team_id]
    url = TEAMS_URL.format(team_id=team_id)
    try:
        resp = _session.get(url, timeout=10)
        resp.raise_for_status()
        teams = resp.json().get("teams", [])
        info = teams[0] if teams else {}
        _team_cache[team_id] = info
        return info
    except Exception as exc:
        print(f"WARNING: Failed to fetch team {team_id}: {exc}", file=sys.stderr)
        _team_cache[team_id] = {}
        return {}


def split_to_row(split: dict, sport_id: int) -> dict | None:
    """Convert one API split to an output CSV row dict. Returns None to skip."""
    team = split.get("team", {})
    team_id = team.get("id")

    # Skip aggregate rows (no team id = season rollup across multiple teams)
    if not team_id:
        return None

    stat = split.get("stat", {})
    season = split.get("season", "")
    league_name = split.get("league", {}).get("name", "")
    level_code = SPORT_LEVEL.get(sport_id, "")

    # Resolve team details (abbreviation + parent org) from Teams API
    team_info = fetch_team(team_id)
    # Prefer the API abbreviation; fall back to the split's name
    team_abbrev = team_info.get("abbreviation") or team.get("name", "")
    parent_org = team_info.get("parentOrgName", "")
    aff = PARENT_ORG_AFF.get(parent_org, "")
    if not aff:
        print(
            f"WARNING: Unknown parentOrg '{parent_org}' for team {team_id}; "
            "Aff will be blank",
            file=sys.stderr,
        )

    ip = stat.get("inningsPitched", "0.0")
    whip = stat.get("whip", "")
    era = stat.get("era", "")
    goao = stat.get("groundOutsToAirouts", "")

    # Normalize "-" and missing values
    if whip in ("-.--", "", None):
        whip = "-"
    if era in ("-.--", "", None):
        era = "-"
    if goao in ("-.--", "", None):
        goao = "-"

    return {
        "Year": season,
        "Tm": team_abbrev,
        "Lg": league_name,
        "Lev": level_code,
        "Aff": aff,
        "W": stat.get("wins", 0),
        "L": stat.get("losses", 0),
        "ERA": era,
        "G": stat.get("gamesPlayed", 0),
        "GS": stat.get("gamesStarted", 0),
        "CG": stat.get("completeGames", 0),
        "SHO": stat.get("shutouts", 0),
        "SV": stat.get("saves", 0),
        "IP": ip,
        "H": stat.get("hits", 0),
        "R": stat.get("runs", 0),
        "ER": stat.get("earnedRuns", 0),
        "HR": stat.get("homeRuns", 0),
        "BB": stat.get("baseOnBalls", 0),
        "IBB": stat.get("intentionalWalks", 0),
        "SO": stat.get("strikeOuts", 0),
        "HBP": stat.get("hitBatsmen", stat.get("hitByPitch", 0)),
        "BF": stat.get("battersFaced", 0),
        "WHIP": whip,
        "HLD": stat.get("holds", 0),
        "SVO": stat.get("saveOpportunities", 0),
        "NP": stat.get("numberOfPitches", 0),
        "GO/AO": goao,
    }


def main() -> None:
    all_rows: list[dict] = []

    for sport_id in SPORT_IDS:
        splits = fetch_splits(sport_id)
        for split in splits:
            row = split_to_row(split, sport_id)
            if row is not None:
                all_rows.append(row)
        time.sleep(0.2)

    if not all_rows:
        print(
            "WARNING: MiLB API returned no rows; leaving existing CSV unchanged",
            file=sys.stderr,
        )
        return

    # Sort by year then level then team for deterministic output
    level_order = {v: i for i, v in enumerate(["Rk", "A-", "A", "A+", "AA", "AAA"])}
    all_rows.sort(key=lambda r: (r["Year"], level_order.get(r["Lev"], 99), r["Tm"]))

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Check if content changed before writing
    new_lines = []
    new_lines.append(",".join(OUTPUT_COLUMNS))
    for row in all_rows:
        new_lines.append(",".join(str(row.get(col, "")) for col in OUTPUT_COLUMNS))
    new_content = "\n".join(new_lines) + "\n"

    if OUTPUT_FILE.exists() and OUTPUT_FILE.read_text() == new_content:
        print("milb_api_stats.csv: no changes")
        return

    OUTPUT_FILE.write_text(new_content)
    print(
        f"Updated {OUTPUT_FILE.relative_to(PROJECT_ROOT)} "
        f"({len(all_rows)} per-team rows)"
    )


if __name__ == "__main__":
    main()
