import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseCSV, formatDate, isWithinDays, sortByDate } from "../../src/utils.js";

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
});

describe("formatDate", () => {
  it("formats date in US format", () => {
    const result = formatDate("2024-03-15");

    expect(result).toBe("Mar 15, 2024");
  });

  it("formats single-digit day correctly", () => {
    const result = formatDate("2024-01-05");

    expect(result).toBe("Jan 5, 2024");
  });

  it("formats December date correctly", () => {
    const result = formatDate("2023-12-25");

    expect(result).toBe("Dec 25, 2023");
  });
});

describe("isWithinDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set to noon to avoid midnight timezone edge cases
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for date within range", () => {
    const result = isWithinDays("2024-06-10", 7);

    expect(result).toBe(true);
  });

  it("returns false for date outside range", () => {
    const result = isWithinDays("2024-06-01", 7);

    expect(result).toBe(false);
  });

  it("returns true for today", () => {
    const result = isWithinDays("2024-06-15", 7);

    expect(result).toBe(true);
  });

  it("returns false for future dates", () => {
    const result = isWithinDays("2024-06-20", 7);

    expect(result).toBe(false);
  });
});

describe("sortByDate", () => {
  it("sorts items by date descending (newest first)", () => {
    const items = [
      { date: "2024-01-01", title: "Old" },
      { date: "2024-06-15", title: "New" },
      { date: "2024-03-10", title: "Middle" },
    ];

    const result = sortByDate(items);

    expect(result[0].title).toBe("New");
    expect(result[1].title).toBe("Middle");
    expect(result[2].title).toBe("Old");
  });

  it("puts pinned items first regardless of date", () => {
    const items = [
      { date: "2024-06-15", title: "New" },
      { date: "2024-01-01", title: "Old but pinned", pinned: true },
      { date: "2024-03-10", title: "Middle" },
    ];

    const result = sortByDate(items);

    expect(result[0].title).toBe("Old but pinned");
    expect(result[1].title).toBe("New");
    expect(result[2].title).toBe("Middle");
  });

  it("does not mutate original array", () => {
    const items = [
      { date: "2024-01-01", title: "A" },
      { date: "2024-06-15", title: "B" },
    ];

    sortByDate(items);

    expect(items[0].title).toBe("A");
  });
});
