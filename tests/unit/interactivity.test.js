import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initThemeSwitcher,
  initScrollReveal,
  initHeadshotClickAnimation,
  initNavigation,
} from "../../src/interactivity.js";
import * as dataModule from "../../src/data.js";

// ────────────────────────────────────────────────────────────
// initThemeSwitcher
// ────────────────────────────────────────────────────────────

const ALL_SIX_THEMES = [
  { id: "hopkins", label: "Hopkins", color: "#68ace5" },
  { id: "mets", label: "Mets", color: "#ff5910" },
  { id: "phillies", label: "Phillies", color: "#ff1e2c" },
  { id: "rangers", label: "Rangers", color: "#5d97d8" },
  { id: "marlins", label: "Marlins", color: "#00a3e0" },
  { id: "driveline", label: "Driveline", color: "#FFA300" },
];

const MOCK_SITE_CONFIG = {
  profile: {
    headshot: "/assets/images/headshot/headshot-dl-sm.jpg",
    headshots: {
      driveline: "/assets/images/headshot/headshot-dl-sm.jpg",
      hopkins: "/assets/images/headshot/headshot-dl-sm.jpg",
      mets: "/assets/images/headshot/headshot-mets-sm.jpg",
      phillies: "/assets/images/headshot/headshot-phillies-sm.jpg",
      rangers: "/assets/images/headshot/headshot-dl-sm.jpg",
      marlins: "/assets/images/headshot/headshot-dl-sm.jpg",
    },
  },
  footer: { themes: ALL_SIX_THEMES },
};

describe("initThemeSwitcher", () => {
  let metaThemeColor;
  let themeSwitcher;
  let trigger;
  let getSiteConfigSpy;

  beforeEach(() => {
    localStorage.clear();

    // Mock getSiteConfig to return full config with all 6 themes
    getSiteConfigSpy = vi.spyOn(dataModule, "getSiteConfig").mockReturnValue(MOCK_SITE_CONFIG);

    // Set up footer DOM
    themeSwitcher = document.createElement("div");
    themeSwitcher.className = "theme-switcher";
    trigger = document.createElement("button");
    trigger.className = "theme-menu-trigger";
    trigger.type = "button";
    themeSwitcher.appendChild(trigger);
    document.body.appendChild(themeSwitcher);

    // Set up meta theme-color
    metaThemeColor = document.createElement("meta");
    metaThemeColor.name = "theme-color";
    metaThemeColor.content = "#0a0e1a";
    document.head.appendChild(metaThemeColor);

    // Set up theme config including rangers and marlins
    window.__themeConfig = {
      colors: {
        driveline: "#0a0a0a",
        hopkins: "#0a0e1a",
        mets: "#0a1428",
        phillies: "#120a0c",
        rangers: "#0b1e35",
        marlins: "#061616",
      },
    };
  });

  afterEach(() => {
    localStorage.clear();
    document.body.removeChild(themeSwitcher);
    document.head.removeChild(metaThemeColor);
    delete window.__themeConfig;
    document.documentElement.removeAttribute("data-theme");
    vi.restoreAllMocks();
  });

  it("applies saved theme from localStorage", () => {
    localStorage.setItem("theme", "phillies");
    initThemeSwitcher();

    expect(document.documentElement.getAttribute("data-theme")).toBe("phillies");
  });

  it("defaults to marlins theme when no theme saved", () => {
    initThemeSwitcher();

    expect(document.documentElement.getAttribute("data-theme")).toBe("marlins");
  });

  it("builds a dropdown with all 6 themes", () => {
    initThemeSwitcher();
    trigger.click();

    const options = document.querySelectorAll(".theme-menu-option");
    expect(options.length).toBe(6);
  });

  it("changes theme when a dropdown option is clicked", () => {
    initThemeSwitcher();
    trigger.click();

    const metsOption = document.querySelector('[data-theme="mets"].theme-menu-option');
    expect(metsOption).not.toBeNull();
    metsOption.click();

    expect(document.documentElement.getAttribute("data-theme")).toBe("mets");
    expect(localStorage.getItem("theme")).toBe("mets");
  });

  it("supports rangers theme", () => {
    initThemeSwitcher();
    trigger.click();

    const rangersOption = document.querySelector('[data-theme="rangers"].theme-menu-option');
    expect(rangersOption).not.toBeNull();
    rangersOption.click();

    expect(document.documentElement.getAttribute("data-theme")).toBe("rangers");
    expect(localStorage.getItem("theme")).toBe("rangers");
  });

  it("supports marlins theme", () => {
    initThemeSwitcher();
    trigger.click();

    const marlinsOption = document.querySelector('[data-theme="marlins"].theme-menu-option');
    expect(marlinsOption).not.toBeNull();
    marlinsOption.click();

    expect(document.documentElement.getAttribute("data-theme")).toBe("marlins");
    expect(localStorage.getItem("theme")).toBe("marlins");
  });

  it("updates meta theme-color on theme change", () => {
    initThemeSwitcher();
    trigger.click();

    const option = document.querySelector('[data-theme="mets"].theme-menu-option');
    option.click();

    expect(metaThemeColor.getAttribute("content")).toBe("#0a1428");
  });

  it("updates body background color on theme change", () => {
    initThemeSwitcher();
    trigger.click();

    const option = document.querySelector('[data-theme="mets"].theme-menu-option');
    option.click();

    expect(document.body.style.backgroundColor).toBe("rgb(10, 20, 40)");
  });

  it("marks correct option as active (aria-selected) after selection", () => {
    initThemeSwitcher();
    trigger.click();

    const philliesOption = document.querySelector('[data-theme="phillies"].theme-menu-option');
    philliesOption.click();

    // Reopen to check aria-selected
    trigger.click();
    const activeOption = document.querySelector('[data-theme="phillies"].theme-menu-option');
    expect(activeOption.getAttribute("aria-selected")).toBe("true");
  });

  it("footer trigger shows current theme label after init", () => {
    localStorage.setItem("theme", "mets");
    initThemeSwitcher();
    expect(trigger.textContent).toContain("Mets");
  });

  it("footer trigger updates label when theme changes", () => {
    initThemeSwitcher();
    trigger.click();

    const rangersOption = document.querySelector('[data-theme="rangers"].theme-menu-option');
    rangersOption.click();

    expect(trigger.textContent).toContain("Rangers");
  });

  it("footer trigger shows swatch dot with correct color", () => {
    localStorage.setItem("theme", "driveline");
    initThemeSwitcher();

    const swatch = trigger.querySelector(".theme-menu-swatch");
    expect(swatch).not.toBeNull();
    expect(swatch.style.getPropertyValue("--swatch-color")).toBe("#FFA300");
  });

  it("trigger has aria-haspopup=listbox", () => {
    initThemeSwitcher();
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("trigger aria-expanded toggles on click", () => {
    initThemeSwitcher();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on outside focus without moving focus back to the trigger", () => {
    initThemeSwitcher();
    trigger.click();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    expect(themeSwitcher.querySelector(".theme-menu").hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("Shift+Tab returns to the trigger and Escape closes without changing selection", () => {
    initThemeSwitcher();
    trigger.click();
    const menu = themeSwitcher.querySelector(".theme-menu");
    const tab = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
    document.activeElement.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(menu.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(menu.hidden).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("marlins");
  });

  it("navigates from the actual focused option after pointer focus changes", () => {
    initThemeSwitcher();
    trigger.click();
    const options = themeSwitcher.querySelectorAll(".theme-menu-option");
    options[1].focus();
    options[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(document.activeElement).toBe(options[2]);
  });
});

// ────────────────────────────────────────────────────────────
// initScrollReveal
// ────────────────────────────────────────────────────────────

describe("initScrollReveal", () => {
  let section;
  let observerCallback;

  beforeEach(() => {
    section = document.createElement("section");
    section.className = "content-section";
    document.body.appendChild(section);

    // jsdom doesn't implement matchMedia — stub it to return no reduced motion
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: "",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

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
    delete window.matchMedia;
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

  it("reveals all sections immediately under prefers-reduced-motion and skips observer", () => {
    // Simulate prefers-reduced-motion: reduce
    window.matchMedia = vi.fn((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    initScrollReveal();

    expect(section.classList.contains("revealed")).toBe(true);
    // Observer should NOT have been created
    expect(IntersectionObserver).not.toHaveBeenCalled();

    // Restore default (no reduced motion)
    window.matchMedia = vi.fn(() => ({ matches: false, media: "", addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });
});

// ────────────────────────────────────────────────────────────
// initHeadshotClickAnimation
// ────────────────────────────────────────────────────────────

describe("initHeadshotClickAnimation", () => {
  let headshot;

  beforeEach(() => {
    vi.useFakeTimers();

    // jsdom doesn't implement matchMedia — stub to return no reduced motion
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: "",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    headshot = document.createElement("img");
    headshot.className = "hero-headshot";
    document.body.appendChild(headshot);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.removeChild(headshot);
    delete window.matchMedia;
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

  it("a rapid second click gets a full bounce without an old callback interrupting it", () => {
    initHeadshotClickAnimation(0);
    vi.advanceTimersByTime(0);
    headshot.click();
    vi.advanceTimersByTime(250);
    headshot.click();
    vi.advanceTimersByTime(100);
    expect(headshot.classList.contains("clicked")).toBe(true);
    expect(headshot.classList.contains("transitioning-out")).toBe(false);
    vi.advanceTimersByTime(600);
    expect(headshot.classList.contains("clicked")).toBe(false);
    expect(headshot.classList.contains("transitioning-out")).toBe(false);
  });

  it("cancels pending animation-frame cleanup when a new bounce starts", () => {
    initHeadshotClickAnimation(0);
    vi.advanceTimersByTime(0);
    headshot.click();
    vi.advanceTimersByTime(300);
    headshot.click();
    vi.advanceTimersByTime(20);
    expect(headshot.classList.contains("clicked")).toBe(true);
    expect(headshot.classList.contains("transitioning-out")).toBe(false);
  });

  it("skips the ready delay and bounce under reduced motion", () => {
    window.matchMedia = vi.fn(() => ({ matches: true }));
    initHeadshotClickAnimation(600);
    headshot.click();
    expect(headshot.classList.contains("animation-ready")).toBe(true);
    expect(headshot.classList.contains("clicked")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("navigation state", () => {
  it("clears stale selection outside sections and recalculates it on layout changes", () => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn(() => ({ matches: false }));
    document.body.innerHTML = '<header><nav class="nav-links"><a data-section="field" href="#field">Field</a></nav></header><section id="field" class="content-section"></section>';
    const section = document.getElementById("field");
    let sectionTop = 500;
    Object.defineProperty(section, "offsetTop", { get: () => sectionTop });
    Object.defineProperty(section, "offsetHeight", { value: 500 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 500, writable: true });
    initNavigation();
    vi.advanceTimersByTime(0);
    const link = document.querySelector(".nav-links a");
    expect(link.getAttribute("aria-current")).toBe("location");
    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));
    expect(link.classList.contains("active")).toBe(false);
    expect(link.hasAttribute("aria-current")).toBe(false);
    sectionTop = 1200;
    window.dispatchEvent(new Event("resize"));
    expect(link.getAttribute("aria-current")).toBe("location");
    window.scrollY = 0;
    window.dispatchEvent(new Event("scroll"));
    expect(link.hasAttribute("aria-current")).toBe(false);
    expect(document.querySelector("header").classList.contains("visible")).toBe(false);
    delete window.__recacheLayoutValues;
    delete window.matchMedia;
    document.body.innerHTML = "";
    vi.useRealTimers();
  });
});
