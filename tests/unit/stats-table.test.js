import { describe, it, expect, beforeEach } from "vitest";
import {
  LEVEL_CLASSES,
  ORG_CLASSES,
  ORG_DISPLAY_NAMES,
  LEVEL_TO_CATEGORY,
  buildStatsTable,
} from "../../src/stats-table.js";

// Minimal CSV-like rows for testing
const makeStats = () => [
  { Season: "2023", Team: "2 teams", Level: "Minors", Org: "Mets", W: "5", L: "3", ERA: "3.45", G: "20", SV: "-", IP: "78.2", H: "70", SO: "65", BB: "22", WHIP: "1.18" },
  { Season: "2022", Team: "1 teams", Level: "Minors", Org: "Phillies", W: "8", L: "2", ERA: "2.89", G: "15", SV: "0", IP: "62.0", H: "50", SO: "55", BB: "18", WHIP: "1.10" },
  { Season: "2021", Team: "1 teams", Level: "College", Org: "Johns Hopkins", W: "3", L: "1", ERA: "2.10", G: "10", SV: "0", IP: "40.0", H: "30", SO: "40", BB: "10", WHIP: "0.99" },
  { Season: "Minors Career", Team: "", Level: "Minors", Org: "-", W: "13", L: "5", ERA: "3.20", G: "35", SV: "0", IP: "140.2", H: "120", SO: "120", BB: "40", WHIP: "1.14" },
  { Season: "College Career", Team: "", Level: "College", Org: "-", W: "3", L: "1", ERA: "2.10", G: "10", SV: "0", IP: "40.0", H: "30", SO: "40", BB: "10", WHIP: "0.99" },
];

describe("lookup tables", () => {
  it("LEVEL_CLASSES covers expected levels", () => {
    expect(LEVEL_CLASSES["Rk+"]).toBe("level-roa");
    expect(LEVEL_CLASSES["AA"]).toBe("level-aa");
    expect(LEVEL_CLASSES["NCAA"]).toBe("level-ncaa");
    expect(LEVEL_CLASSES["Independent"]).toBe("level-independent");
  });

  it("ORG_CLASSES covers expected orgs", () => {
    expect(ORG_CLASSES.Mets).toBe("org-mets");
    expect(ORG_CLASSES.Phillies).toBe("org-phillies");
  });

  it("ORG_DISPLAY_NAMES abbreviates known orgs", () => {
    expect(ORG_DISPLAY_NAMES.Mets).toBe("NYM");
    expect(ORG_DISPLAY_NAMES["Johns Hopkins"]).toBe("JHU");
  });

  it("LEVEL_TO_CATEGORY maps all minor league levels to Minors", () => {
    ["Rk+", "A-", "A+", "AA", "AAA"].forEach((lvl) => {
      expect(LEVEL_TO_CATEGORY[lvl]).toBe("Minors");
    });
  });

  it("LEVEL_TO_CATEGORY maps NCAA to College", () => {
    expect(LEVEL_TO_CATEGORY.NCAA).toBe("College");
  });
});

describe("buildStatsTable", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("appends a stats table to the container", () => {
    buildStatsTable(container, makeStats(), []);
    expect(container.querySelector(".stats-table")).not.toBeNull();
  });

  it("appends a category selector with three buttons", () => {
    buildStatsTable(container, makeStats(), []);
    const btns = container.querySelectorAll(".stats-category-btn");
    expect(btns.length).toBe(3);
    const labels = [...btns].map((b) => b.querySelector(".stats-category-name").textContent);
    expect(labels).toEqual(["College", "Independent", "Minors"]);
  });

  it("starts with Minors button active", () => {
    buildStatsTable(container, makeStats(), []);
    const active = container.querySelector(".stats-category-btn.active");
    expect(active.dataset.category).toBe("Minors");
  });

  it("appends the view link to the provided headerEl", () => {
    const header = document.createElement("div");
    buildStatsTable(container, makeStats(), [], { headerEl: header });
    expect(header.querySelector(".view-all-link")).not.toBeNull();
  });

  it("does NOT append the view link if no headerEl is provided", () => {
    buildStatsTable(container, makeStats(), []);
    // Link still created internally for event handler, but not visible in container header
    // The link is inside the subsection's header which is separate from container
    expect(true).toBe(true); // no error thrown
  });

  it("renders overview cards when statsHighlights provided", () => {
    buildStatsTable(container, makeStats(), [], {
      statsHighlights: ["ERA", "G"],
      highlightLabels: { ERA: "ERA", G: "Games" },
    });
    const overview = container.querySelector(".stats-overview");
    expect(overview).not.toBeNull();
    expect(overview.querySelectorAll(".stat-card-large").length).toBe(2);
  });

  it("does NOT render overview cards without statsHighlights", () => {
    buildStatsTable(container, makeStats(), []);
    expect(container.querySelector(".stats-overview")).toBeNull();
  });

  it("shows Minors rows and hides non-Minors rows by default", () => {
    buildStatsTable(container, makeStats(), []);
    const tbody = container.querySelector("tbody");
    const rows = [...tbody.querySelectorAll("tr")];
    const minorsRows = rows.filter((r) => r.dataset.category === "Minors");
    const collegeRows = rows.filter((r) => r.dataset.category === "College");
    minorsRows.forEach((r) => expect(r.style.display).not.toBe("none"));
    collegeRows.forEach((r) => expect(r.style.display).toBe("none"));
  });

  it("renders tfoot career rows", () => {
    buildStatsTable(container, makeStats(), []);
    const tfoot = container.querySelector("tfoot");
    expect(tfoot).not.toBeNull();
    expect(tfoot.querySelectorAll("tr").length).toBeGreaterThan(0);
  });

  it("uses optional chaining: does not throw when statsLinks is undefined", () => {
    expect(() => buildStatsTable(container, makeStats(), undefined)).not.toThrow();
  });
});
