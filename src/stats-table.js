/**
 * Shared stats table builder: lookup tables and DOM construction used by both
 * the main-page stats section and the evolution-page stats subsection.
 */

import { createElement } from "./dom.js";

export const LEVEL_CLASSES = {
  "Rk+": "level-roa",
  "A-": "level-a-short",
  "A+": "level-a-plus",
  AA: "level-aa",
  AAA: "level-aaa",
  NCAA: "level-ncaa",
  Independent: "level-independent",
};

export const ORG_CLASSES = {
  Mets: "org-mets",
  Phillies: "org-phillies",
  Rangers: "org-rangers",
  Marlins: "org-marlins",
  "Johns Hopkins": "org-hopkins",
  Westside: "org-westside",
  Baltimore: "org-baltimore",
};

export const ORG_DISPLAY_NAMES = {
  Mets: "NYM",
  Phillies: "PHI",
  Rangers: "TEX",
  Marlins: "MIA",
  "Johns Hopkins": "JHU",
  Westside: "WWM",
  Baltimore: "Baltimore Dodgers",
};

export const LEVEL_TO_CATEGORY = {
  NCAA: "College",
  Independent: "Independent",
  "Rk+": "Minors",
  "A-": "Minors",
  "A+": "Minors",
  AA: "Minors",
  AAA: "Minors",
};

/**
 * Builds the career stats category selector, optional overview cards, and
 * stats table into a container element. Also appends the view-stats link into
 * the provided header element.
 *
 * @param {HTMLElement} container - Subsection element to receive the controls
 * @param {Array} statsData - Parsed CSV rows from the stats file
 * @param {Array|undefined} statsLinks - Array of { name, url } link configs
 * @param {Object} [options]
 * @param {HTMLElement} [options.headerEl] - Subsection header to receive the view link
 * @param {string[]} [options.statsHighlights] - Stat keys for overview cards (main-page only)
 * @param {Object} [options.highlightLabels] - Display labels for overview cards (main-page only)
 */
export function buildStatsTable(container, statsData, statsLinks, options = {}) {
  const { headerEl, statsHighlights, highlightLabels } = options;

  const careerRows = {
    College: statsData.find((row) => row.Season === "College Career"),
    Independent: statsData.find((row) => row.Season === "Independent Career"),
    Minors: statsData.find((row) => row.Season === "Minors Career"),
  };

  const seasonRows = statsData.filter(
    (row) => /^\d{4}$/.test(row.Season) && /\d+\s*teams?$/i.test(row.Team)
  );

  const statsLinkConfig = {
    Minors: statsLinks?.find((l) => l.name === "MiLB"),
    College: statsLinks?.find((l) => l.name === "BBRef"),
    Independent: statsLinks?.find((l) => l.name === "BBRef"),
  };

  const viewStatsLink = createElement("a", {
    href: statsLinkConfig.Minors?.url || "#",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "view-all-link",
    textContent: "View MiLB",
  });

  if (headerEl) {
    headerEl.appendChild(viewStatsLink);
  }

  const seasonCategoryLevels = {};
  statsData.forEach((row) => {
    if (/^\d{4}$/.test(row.Season) && !/\d+\s*teams?$/i.test(row.Team)) {
      const category = LEVEL_TO_CATEGORY[row.Level] || row.Level;
      const key = `${row.Season}-${category}`;
      if (!seasonCategoryLevels[key]) {
        seasonCategoryLevels[key] = [];
      }
      if (!seasonCategoryLevels[key].includes(row.Level)) {
        seasonCategoryLevels[key].push(row.Level);
      }
    }
  });

  const categoryYears = {};
  seasonRows.forEach((row) => {
    const category = row.Level;
    const year = parseInt(row.Season, 10);
    if (!categoryYears[category]) {
      categoryYears[category] = [];
    }
    categoryYears[category].push(year);
  });

  const getCategoryYearRange = (category) => {
    const years = categoryYears[category] || [];
    if (years.length === 0) return "";
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    if (minYear === maxYear) return `${minYear}`;
    return `${minYear}-${String(maxYear).slice(-2)}`;
  };

  const categorySelector = createElement("div", { className: "stats-category-selector" });
  const categoryOrder = ["College", "Independent", "Minors"];
  categoryOrder.forEach((category) => {
    const btn = createElement("button", {
      className: `stats-category-btn${category === "Minors" ? " active" : ""}`,
    });
    btn.dataset.category = category;
    btn.appendChild(createElement("span", {
      className: "stats-category-name",
      textContent: category,
    }));
    btn.appendChild(createElement("span", {
      className: "stats-category-years",
      textContent: getCategoryYearRange(category),
    }));
    categorySelector.appendChild(btn);
  });
  container.appendChild(categorySelector);

  // Overview highlight cards (main-page only)
  let statsOverview = null;
  let getHighlightValues = null;

  if (statsHighlights && highlightLabels) {
    getHighlightValues = (category) => {
      const careerRow = careerRows[category];
      return {
        ERA: careerRow?.ERA || "-",
        "W-L": careerRow ? `${careerRow.W}-${careerRow.L}` : "-",
        G: careerRow?.G || "-",
        IP: careerRow?.IP || "-",
        SO: careerRow?.SO || "-",
        WHIP: careerRow?.WHIP || "-",
      };
    };

    statsOverview = createElement("div", { className: "stats-overview" });
    const initialHighlights = getHighlightValues("Minors");
    statsHighlights.forEach((stat) => {
      const card = createElement("div", { className: "stat-card-large" });
      const statValue = createElement("div", {
        className: "stat-value",
        textContent: initialHighlights[stat],
      });
      statValue.dataset.stat = stat;
      card.appendChild(statValue);
      card.appendChild(createElement("div", {
        className: "stat-label",
        textContent: highlightLabels[stat],
      }));
      statsOverview.appendChild(card);
    });
    container.appendChild(statsOverview);
  }

  const categoryLeagues = {
    College: { name: "NCAA D3", className: "league-ncaa" },
    Independent: { name: "USPBL", className: "league-independent" },
  };

  const tableWrapper = createElement("div", { className: "stats-table-wrapper" });
  const table = createElement("table", { className: "stats-table" });

  const thead = createElement("thead");
  const headerRow = createElement("tr");
  const headers = [
    "Year", "Org", "Levels", "W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP",
  ];
  headers.forEach((header) => {
    const th = createElement("th", { textContent: header });
    if (header === "Org") th.dataset.column = "team";
    if (header === "Levels") th.dataset.column = "levels";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = createElement("tbody");
  seasonRows.forEach((row) => {
    const tr = createElement("tr");
    const category = row.Level;
    tr.dataset.category = category;
    if (category !== "Minors") {
      tr.style.display = "none";
    }
    tr.appendChild(createElement("td", { textContent: row.Season }));

    const teamCell = createElement("td");
    if (row.Org && row.Org !== "-") {
      // Multi-org seasons arrive slash-joined (e.g. "Rangers/Marlins"); one badge per org
      for (const org of row.Org.split("/")) {
        teamCell.appendChild(createElement("span", {
          className: `org-badge ${ORG_CLASSES[org] || ""}`,
          textContent: ORG_DISPLAY_NAMES[org] || org,
        }));
      }
    }
    tr.appendChild(teamCell);

    const levelsCell = createElement("td");
    if (category === "Minors") {
      const levelKey = `${row.Season}-${category}`;
      (seasonCategoryLevels[levelKey] || []).forEach((level) => {
        levelsCell.appendChild(createElement("span", {
          className: `level-badge ${LEVEL_CLASSES[level] || ""}`,
          textContent: level,
        }));
        levelsCell.appendChild(document.createTextNode(" "));
      });
    } else {
      const leagueInfo = categoryLeagues[category];
      if (leagueInfo) {
        levelsCell.appendChild(createElement("span", {
          className: `league-badge ${leagueInfo.className}`,
          textContent: leagueInfo.name,
        }));
      }
    }
    tr.appendChild(levelsCell);

    ["W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"].forEach((col) => {
      let value = row[col];
      if (col === "SV" && (value === "-" || value === "")) {
        value = "0";
      }
      tr.appendChild(createElement("td", { textContent: value }));
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const tfoot = createElement("tfoot");
  categoryOrder.forEach((category) => {
    const careerRow = careerRows[category];
    if (!careerRow) return;

    const footerRow = createElement("tr");
    footerRow.dataset.category = category;
    if (category !== "Minors") {
      footerRow.style.display = "none";
    }

    footerRow.appendChild(createElement("td"));
    footerRow.appendChild(createElement("td"));
    footerRow.appendChild(createElement("td"));

    ["W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"].forEach((col) => {
      let value = careerRow?.[col] || "-";
      if (col === "SV" && (value === "-" || value === "")) {
        value = "0";
      }
      const cell = createElement("td");
      cell.appendChild(createElement("strong", { textContent: value }));
      footerRow.appendChild(cell);
    });
    tfoot.appendChild(footerRow);
  });

  table.appendChild(tfoot);
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);

  // Category selector click handler
  categorySelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".stats-category-btn");
    if (!btn) return;

    const selectedCategory = btn.dataset.category;

    categorySelector.querySelectorAll(".stats-category-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    const teamHeader = thead.querySelector('th[data-column="team"]');
    const levelsHeader = thead.querySelector('th[data-column="levels"]');
    if (teamHeader) {
      teamHeader.textContent = selectedCategory === "Minors" ? "Org" : "Team";
    }
    if (levelsHeader) {
      levelsHeader.textContent = selectedCategory === "Minors" ? "Levels" : "League";
    }

    if (statsOverview && getHighlightValues) {
      const newHighlights = getHighlightValues(selectedCategory);
      statsOverview.querySelectorAll(".stat-value").forEach((el) => {
        el.textContent = newHighlights[el.dataset.stat];
      });
    }

    const linkConfig = statsLinkConfig[selectedCategory];
    if (linkConfig) {
      viewStatsLink.href = linkConfig.url;
      viewStatsLink.textContent = selectedCategory === "Minors" ? "View MiLB" : "View BBRef";
    }

    tbody.querySelectorAll("tr").forEach((row) => {
      row.style.display = row.dataset.category === selectedCategory ? "" : "none";
    });

    tfoot.querySelectorAll("tr").forEach((row) => {
      row.style.display = row.dataset.category === selectedCategory ? "" : "none";
    });
  });
}
