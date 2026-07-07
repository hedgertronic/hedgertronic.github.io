import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getThemedHeadshot, updateLogoHeadshot } from "../../src/hero.js";

describe("getThemedHeadshot", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const mockConfig = {
    profile: {
      headshot: "/assets/images/default.jpg",
      headshots: {
        driveline: "/assets/images/headshot-dl.jpg",
        hopkins: "/assets/images/headshot-hopkins.jpg",
        mets: "/assets/images/headshot-mets.jpg",
        phillies: "/assets/images/headshot-phillies.jpg",
        rangers: "/assets/images/headshot-dl.jpg",
        marlins: "/assets/images/headshot-dl.jpg",
      },
    },
  };

  it("returns themed headshot when theme is set in localStorage", () => {
    localStorage.setItem("theme", "mets");
    const result = getThemedHeadshot(mockConfig);
    expect(result).toBe("/assets/images/headshot-mets.jpg");
  });

  it("returns marlins headshot as default when no theme set", () => {
    const result = getThemedHeadshot(mockConfig);
    expect(result).toBe("/assets/images/headshot-dl.jpg");
  });

  it("returns driveline headshot when theme is driveline", () => {
    localStorage.setItem("theme", "driveline");
    const result = getThemedHeadshot(mockConfig);
    expect(result).toBe("/assets/images/headshot-dl.jpg");
  });

  it("returns phillies headshot when theme is phillies", () => {
    localStorage.setItem("theme", "phillies");
    const result = getThemedHeadshot(mockConfig);
    expect(result).toBe("/assets/images/headshot-phillies.jpg");
  });

  it("falls back to default headshot when theme not found in headshots", () => {
    localStorage.setItem("theme", "unknown-theme");
    const result = getThemedHeadshot(mockConfig);
    expect(result).toBe("/assets/images/default.jpg");
  });

  it("returns default headshot when headshots object is missing", () => {
    const configNoHeadshots = {
      profile: {
        headshot: "/assets/images/default.jpg",
      },
    };
    const result = getThemedHeadshot(configNoHeadshots);
    expect(result).toBe("/assets/images/default.jpg");
  });
});

describe("updateLogoHeadshot", () => {
  let logoImg;

  beforeEach(() => {
    localStorage.clear();
    logoImg = document.createElement("img");
    logoImg.id = "logo-headshot";
    logoImg.src = "/original.jpg";
    document.body.appendChild(logoImg);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.removeChild(logoImg);
  });

  const mockConfig = {
    profile: {
      headshot: "/assets/images/default.jpg",
      headshots: {
        driveline: "/assets/images/headshot-dl.jpg",
        hopkins: "/assets/images/headshot-hopkins.jpg",
        mets: "/assets/images/headshot-mets.jpg",
        phillies: "/assets/images/headshot-phillies.jpg",
        rangers: "/assets/images/headshot-dl.jpg",
        marlins: "/assets/images/headshot-dl.jpg",
      },
    },
  };

  it("updates logo headshot src based on current theme", () => {
    localStorage.setItem("theme", "mets");
    updateLogoHeadshot(mockConfig);
    expect(logoImg.src).toContain("/assets/images/headshot-mets.jpg");
  });

  it("uses marlins theme by default", () => {
    updateLogoHeadshot(mockConfig);
    expect(logoImg.src).toContain("/assets/images/headshot-dl.jpg");
  });

  it("does nothing when logo element not found", () => {
    document.body.removeChild(logoImg);
    expect(() => updateLogoHeadshot(mockConfig)).not.toThrow();
    document.body.appendChild(logoImg);
  });

  it("does nothing when config is null", () => {
    expect(() => updateLogoHeadshot(null)).not.toThrow();
    expect(logoImg.src).toContain("/original.jpg");
  });

  it("does nothing when headshots not in config", () => {
    const configNoHeadshots = { profile: {} };
    expect(() => updateLogoHeadshot(configNoHeadshots)).not.toThrow();
    expect(logoImg.src).toContain("/original.jpg");
  });
});
