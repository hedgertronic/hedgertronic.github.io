/**
 * Interactive features: theme switching, scroll reveal, navigation.
 */

import { getSiteConfig } from "./data.js";
import { buildThemeDropdown } from "./theme-menu.js";

export function initThemeSwitcher() {
  const savedTheme = localStorage.getItem("theme") || "marlins";
  const siteConfig = getSiteConfig();
  // Use global config set in HTML head, with fallback
  const themeColors = window.__themeConfig?.colors || {
    driveline: "#0a0a0a",
    hopkins: "#0a0f17",
    mets: "#0a1222",
    phillies: "#170a0c",
    rangers: "#0a1017",
    marlins: "#0a1317",
  };

  // syncActive callbacks for all mounted dropdowns — called on every theme change
  const syncFunctions = [];

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColors[theme] || themeColors.marlins);
    }
    // iOS 26 Safari samples body background-color for toolbar tint (ignores theme-color meta)
    document.body.style.backgroundColor = themeColors[theme] || themeColors.marlins;

    if (siteConfig?.profile?.headshots) {
      const headshot = siteConfig.profile.headshots[theme] || siteConfig.profile.headshot;
      document.querySelectorAll(".hero-headshot, .logo-headshot").forEach((img) => {
        img.src = headshot;
      });
    }

    // Sync active state in all mounted dropdown instances
    syncFunctions.forEach((fn) => fn());
  }

  applyTheme(savedTheme);

  const themes = siteConfig?.footer?.themes || [];

  function getActive() {
    return document.documentElement.getAttribute("data-theme") || "marlins";
  }

  function onSelect(t) {
    applyTheme(t);
    localStorage.setItem("theme", t);
  }

  // Footer dropdown
  const themeSwitcher = document.querySelector(".theme-switcher");
  const footerTrigger = themeSwitcher?.querySelector(".theme-menu-trigger");
  if (themeSwitcher && footerTrigger) {
    const { syncActive } = buildThemeDropdown(themeSwitcher, {
      trigger: footerTrigger,
      themes,
      onSelect,
      getActive,
    });
    syncFunctions.push(syncActive);
    syncActive();
  }

}

export function initScrollReveal() {
  const sections = document.querySelectorAll(".content-section");

  // Under reduced motion: reveal all sections immediately — the CSS already
  // resets opacity/transform, but sections also need the "revealed" class so
  // any JS that checks for it (e.g. entrance animations) sees the right state.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sections.forEach((section) => section.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        } else if (entry.boundingClientRect.top > 0) {
          // Use entry's boundingClientRect to avoid forced reflow
          entry.target.classList.remove("revealed");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "-50px 0px",
    },
  );

  sections.forEach((section) => {
    observer.observe(section);
  });
}

export function initNavigation() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "instant" : "smooth",
          block: "start",
        });
      }
    });
  });

  const header = document.querySelector("header");
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a[data-section]");

  // Cache layout values to avoid forced reflows on scroll
  let headerThreshold = 400;
  let sectionPositions = [];

  // Expose recache function globally so it can be called after dynamic content loads
  window.__recacheLayoutValues = cacheLayoutValues;

  function cacheLayoutValues() {
    const firstContentSection = document.querySelector("section.content-section");
    if (firstContentSection) {
      headerThreshold = firstContentSection.offsetTop - 100;
    }

    sectionPositions = Array.from(sections).map((section) => ({
      id: section.getAttribute("id"),
      top: section.offsetTop,
      bottom: section.offsetTop + section.offsetHeight,
    }));
  }

  function updateOnScroll() {
    const scrollPos = window.scrollY;

    if (header) {
      if (scrollPos > headerThreshold) {
        header.classList.add("visible");
      } else {
        header.classList.remove("visible");
      }
    }

    const navOffset = scrollPos + 150;
    for (const section of sectionPositions) {
      if (navOffset >= section.top && navOffset < section.bottom) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("data-section") === section.id) {
            link.classList.add("active");
          }
        });
        break;
      }
    }
  }

  // Cache values after layout is stable, then on resize
  window.addEventListener("load", () => {
    cacheLayoutValues();
    updateOnScroll();
  });
  window.addEventListener("resize", cacheLayoutValues, { passive: true });
  window.addEventListener("scroll", updateOnScroll, { passive: true });

  // Defer initial cache until after paint to avoid forced reflow during load
  setTimeout(() => {
    cacheLayoutValues();
    updateOnScroll();
  }, 0);
}

export function initHeadshotClickAnimation(readyDelay = 600, linkUrl = null) {
  const headshot = document.querySelector(".hero-headshot");
  if (!headshot) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Under reduced motion: skip the delay and the bounce animation entirely
  if (prefersReducedMotion) {
    headshot.classList.add("animation-ready");
    headshot.addEventListener("click", () => {
      if (linkUrl) window.location.href = linkUrl;
    });
    return;
  }

  setTimeout(() => {
    headshot.classList.add("animation-ready");
  }, readyDelay);

  headshot.addEventListener("click", () => {
    if (!headshot.classList.contains("animation-ready")) return;

    // If linkUrl provided, navigate instead of animating
    if (linkUrl) {
      window.location.href = linkUrl;
      return;
    }

    headshot.classList.remove("clicked", "transitioning-out");
    // Force reflow to restart animation
    void headshot.offsetWidth;
    headshot.classList.add("clicked");

    // After animation completes, transition smoothly back to base state
    setTimeout(() => {
      headshot.classList.add("transitioning-out");
      // Brief moment to disable animation, then remove styles to trigger transition
      requestAnimationFrame(() => {
        headshot.classList.remove("clicked");
        // Clean up transitioning-out after transition completes
        setTimeout(() => {
          headshot.classList.remove("transitioning-out");
        }, 300); // Match transition duration
      });
    }, 300); // Animation duration
  });
}
