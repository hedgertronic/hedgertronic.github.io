import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initThemeSwitcher,
  initScrollReveal,
  initHeadshotClickAnimation,
} from "../../src/interactivity.js";

describe("initThemeSwitcher", () => {
  let themeBtn;
  let metaThemeColor;

  beforeEach(() => {
    localStorage.clear();

    // Set up theme button
    themeBtn = document.createElement("button");
    themeBtn.className = "theme-btn";
    themeBtn.dataset.theme = "mets";
    document.body.appendChild(themeBtn);

    // Set up meta theme-color
    metaThemeColor = document.createElement("meta");
    metaThemeColor.name = "theme-color";
    metaThemeColor.content = "#0a0e1a";
    document.head.appendChild(metaThemeColor);

    // Set up theme config
    window.__themeConfig = {
      colors: {
        driveline: "#0a0a0a",
        hopkins: "#0a0e1a",
        mets: "#0a1428",
        phillies: "#120a0c",
      },
    };
  });

  afterEach(() => {
    localStorage.clear();
    document.body.removeChild(themeBtn);
    document.head.removeChild(metaThemeColor);
    delete window.__themeConfig;
    document.documentElement.removeAttribute("data-theme");
  });

  it("applies saved theme from localStorage", () => {
    localStorage.setItem("theme", "phillies");
    initThemeSwitcher();

    expect(document.documentElement.getAttribute("data-theme")).toBe("phillies");
  });

  it("defaults to hopkins theme when no theme saved", () => {
    initThemeSwitcher();

    expect(document.documentElement.getAttribute("data-theme")).toBe("hopkins");
  });

  it("marks correct button as active", () => {
    localStorage.setItem("theme", "mets");
    initThemeSwitcher();

    expect(themeBtn.classList.contains("active")).toBe(true);
  });

  it("changes theme on button click", () => {
    initThemeSwitcher();
    themeBtn.click();

    expect(document.documentElement.getAttribute("data-theme")).toBe("mets");
    expect(localStorage.getItem("theme")).toBe("mets");
  });

  it("updates meta theme-color on theme change", () => {
    initThemeSwitcher();
    themeBtn.click();

    expect(metaThemeColor.getAttribute("content")).toBe("#0a1428");
  });

  it("updates body background color on theme change", () => {
    initThemeSwitcher();
    themeBtn.click();

    expect(document.body.style.backgroundColor).toBe("rgb(10, 20, 40)");
  });
});

describe("initScrollReveal", () => {
  let section;
  let observerCallback;

  beforeEach(() => {
    section = document.createElement("section");
    section.className = "content-section";
    document.body.appendChild(section);

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn((callback) => {
      observerCallback = callback;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });
  });

  afterEach(() => {
    document.body.removeChild(section);
    delete global.IntersectionObserver;
  });

  it("creates IntersectionObserver", () => {
    initScrollReveal();

    expect(IntersectionObserver).toHaveBeenCalled();
  });

  it("observes content sections", () => {
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    global.IntersectionObserver = vi.fn(() => mockObserver);

    initScrollReveal();

    expect(mockObserver.observe).toHaveBeenCalledWith(section);
  });

  it("adds revealed class when section is intersecting", () => {
    initScrollReveal();

    observerCallback([
      {
        isIntersecting: true,
        target: section,
        boundingClientRect: { top: 100 },
      },
    ]);

    expect(section.classList.contains("revealed")).toBe(true);
  });

  it("removes revealed class when section scrolls out of view (going down)", () => {
    section.classList.add("revealed");
    initScrollReveal();

    observerCallback([
      {
        isIntersecting: false,
        target: section,
        boundingClientRect: { top: 500 },
      },
    ]);

    expect(section.classList.contains("revealed")).toBe(false);
  });
});

describe("initHeadshotClickAnimation", () => {
  let headshot;

  beforeEach(() => {
    vi.useFakeTimers();

    headshot = document.createElement("img");
    headshot.className = "hero-headshot";
    document.body.appendChild(headshot);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.removeChild(headshot);
  });

  it("adds animation-ready class after delay", () => {
    initHeadshotClickAnimation(100);

    expect(headshot.classList.contains("animation-ready")).toBe(false);

    vi.advanceTimersByTime(100);

    expect(headshot.classList.contains("animation-ready")).toBe(true);
  });

  it("uses custom delay parameter", () => {
    initHeadshotClickAnimation(500);

    vi.advanceTimersByTime(400);
    expect(headshot.classList.contains("animation-ready")).toBe(false);

    vi.advanceTimersByTime(100);
    expect(headshot.classList.contains("animation-ready")).toBe(true);
  });

  it("does nothing when headshot not found", () => {
    document.body.removeChild(headshot);

    expect(() => initHeadshotClickAnimation(100)).not.toThrow();

    document.body.appendChild(headshot);
  });

  it("adds clicked class on click after animation-ready", () => {
    initHeadshotClickAnimation(100);
    vi.advanceTimersByTime(100);

    headshot.click();

    expect(headshot.classList.contains("clicked")).toBe(true);
  });

  it("does not add clicked class before animation-ready", () => {
    initHeadshotClickAnimation(100);

    headshot.click();

    expect(headshot.classList.contains("clicked")).toBe(false);
  });
});
