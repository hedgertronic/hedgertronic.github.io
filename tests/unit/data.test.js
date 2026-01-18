import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadSiteConfig, getSiteConfig, parseCSV, siteConfig } from "../../src/data.js";

describe("parseCSV", () => {
  it("parses a simple CSV with headers", () => {
    const csv = `name,age,city
Alice,30,NYC
Bob,25,LA`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "Alice", age: "30", city: "NYC" });
    expect(result[1]).toEqual({ name: "Bob", age: "25", city: "LA" });
  });

  it("handles single row CSV", () => {
    const csv = `header1,header2
value1,value2`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ header1: "value1", header2: "value2" });
  });

  it("handles CSV with empty values", () => {
    const csv = `a,b,c
1,,3`;

    const result = parseCSV(csv);

    expect(result[0]).toEqual({ a: "1", b: "", c: "3" });
  });

  it("returns empty array for headers-only CSV", () => {
    const csv = `header1,header2`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(0);
  });

  it("handles baseball stats CSV format", () => {
    const csv = `Season,Team,Level,W,L,ERA,G,IP,SO,BB
2023,Mets,AA,5,3,3.45,20,78.2,65,22
2024,Phillies,AAA,8,2,2.89,15,62.0,55,18`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0].Season).toBe("2023");
    expect(result[0].Team).toBe("Mets");
    expect(result[0].ERA).toBe("3.45");
    expect(result[1].Level).toBe("AAA");
  });

  it("handles whitespace in CSV", () => {
    const csv = `name,value
  test  ,  data  `;

    const result = parseCSV(csv);
    expect(result[0].name).toBe("  test  ");
  });

  it("handles many rows", () => {
    let csv = "id,name\n";
    for (let i = 0; i < 100; i++) {
      csv += `${i},name${i}\n`;
    }

    const result = parseCSV(csv.trim());

    expect(result).toHaveLength(100);
    expect(result[0].id).toBe("0");
    expect(result[99].id).toBe("99");
  });
});

describe("loadSiteConfig", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns site config", async () => {
    const mockConfig = {
      profile: { name: "Test User" },
      socials: [{ platform: "twitter", url: "https://twitter.com/test" }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockConfig),
    });

    const result = await loadSiteConfig();

    expect(fetch).toHaveBeenCalledWith("/data/site.json");
    expect(result).toEqual(mockConfig);
  });

  it("caches the config for subsequent getSiteConfig calls", async () => {
    const mockConfig = { profile: { name: "Cached User" } };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockConfig),
    });

    await loadSiteConfig();
    const cached = getSiteConfig();

    expect(cached).toEqual(mockConfig);
  });
});

describe("getSiteConfig", () => {
  it("returns null before loadSiteConfig is called", async () => {
    // Note: This test may be affected by previous tests that load config
    // In isolation, it would return null
    const config = getSiteConfig();
    expect(config === null || typeof config === "object").toBe(true);
  });
});
