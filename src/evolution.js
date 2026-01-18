/**
 * Evolution page entry point.
 */

import { loadSiteConfig } from "./data.js";
import { renderHeroIntro, renderFooter, updateLogoHeadshot } from "./hero.js";
import {
  initThemeSwitcher,
  initScrollReveal,
  initNavigation,
  initHeadshotClickAnimation,
} from "./interactivity.js";
import {
  loadEvolutionConfig,
  renderEvolutionHeroNav,
  renderSection,
  createScrollArrow,
} from "./evolution-components.js";

async function initEvolutionPage() {
  try {
    const siteConfig = await loadSiteConfig();

    const heroSection = document.getElementById("evolution-hero");
    if (heroSection) {
      const heroContainer = heroSection.querySelector(".container");
      if (heroContainer) {
        renderHeroIntro(heroContainer, siteConfig, {
          includeResumeCta: true,
          reuseExisting: true,
        });
        heroContainer.classList.add("rendered");
      }
    }

    renderFooter(siteConfig);
    updateLogoHeadshot(siteConfig);
    initThemeSwitcher();

    const evolutionConfig = await loadEvolutionConfig();

    const heroTitle = evolutionConfig.page?.heroTitle || "My Evolution";
    const heroTitleEl = document.getElementById("evolution-hero-title");
    const navTitleEl = document.getElementById("nav-page-title");
    if (heroTitleEl) heroTitleEl.textContent = heroTitle;
    if (navTitleEl) navTitleEl.textContent = heroTitle;

    const heroNav = document.querySelector(".hero-nav");
    if (heroNav) {
      renderEvolutionHeroNav(heroNav, evolutionConfig.sections);
    }

    const pageTitleDiv = document.querySelector(".evolution-page-title");
    if (pageTitleDiv && evolutionConfig.sections.length > 0) {
      const scrollArrow = createScrollArrow(evolutionConfig.sections[0].id);
      pageTitleDiv.appendChild(scrollArrow);
    }

    const main = document.querySelector("main");
    if (main) {
      for (let i = 0; i < evolutionConfig.sections.length; i++) {
        await renderSection(evolutionConfig.sections[i], main, i);
      }

      initScrollReveal();
      initNavigation();
    }

    initHeadshotClickAnimation(400);
  } catch (error) {
    console.error("Error initializing evolution page:", error);
  }
}

document.addEventListener("DOMContentLoaded", initEvolutionPage);
