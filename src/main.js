/**
 * Main entry point for the site.
 */

import { loadSiteConfig, getSiteConfig } from "./data.js";
import { createElement, createIconElement } from "./dom.js";
import { renderHeader, renderHero, renderHeroIntro, renderFooter } from "./hero.js";
import { renderSections } from "./sections.js";
import { initThemeSwitcher, initScrollReveal, initNavigation, initHeadshotClickAnimation } from "./interactivity.js";

async function initSite() {
  try {
    const config = await loadSiteConfig();

    renderHeader(config);
    renderHero(config);
    await renderSections(config);
    renderFooter(config);

    initThemeSwitcher();
    initNavigation();
    initScrollReveal();

    if (window.__recacheLayoutValues) {
      window.__recacheLayoutValues();
    }
  } catch (error) {
    console.error("Error initializing site:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (history.scrollRestoration) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  if (!document.body.classList.contains("resume-page") && !document.body.classList.contains("evolution-page")) {
    await initSite();
    initHeadshotClickAnimation(600); // scaleIn is 0.5s with 0.1s delay
  }
});

export { initHeadshotClickAnimation };
export { renderHeroIntro, renderFooter };
export { initThemeSwitcher };
export { loadSiteConfig, getSiteConfig };
