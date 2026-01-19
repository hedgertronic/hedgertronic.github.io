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

    // Add "[Your Team]" button to theme switcher (evolution page only)
    const themeSwitcherButtons = document.querySelector(
      ".theme-switcher-buttons"
    );
    if (themeSwitcherButtons) {
      const yourTeamBtn = document.createElement("button");
      yourTeamBtn.className = "theme-btn theme-btn-disabled";
      yourTeamBtn.textContent = "[Your Team]";
      yourTeamBtn.disabled = true;
      themeSwitcherButtons.appendChild(yourTeamBtn);
    }

    updateLogoHeadshot(siteConfig);
    initThemeSwitcher();

    const evolutionConfig = await loadEvolutionConfig();

    const heroTitle = evolutionConfig.page?.heroTitle || "My Evolution";
    const heroTitleEl = document.getElementById("evolution-hero-title");
    const navTitleEl = document.getElementById("nav-page-title");
    if (heroTitleEl) heroTitleEl.textContent = heroTitle;
    if (navTitleEl) navTitleEl.textContent = heroTitle;

    // Render hero comparison if configured
    const heroComparison = evolutionConfig.page?.heroComparison;
    const comparisonContainer = document.querySelector(".hero-comparison");
    if (heroComparison && comparisonContainer) {
      const items = [];
      const cards = [];
      ["before", "after"].forEach((key, index) => {
        const item = heroComparison[key];
        if (!item) return;
        items.push(item);

        const card = document.createElement("div");
        card.className = "hero-comparison-card";
        card.dataset.index = index;

        const labelTop = document.createElement("div");
        labelTop.className = "hero-comparison-label-top";

        const yearSpan = document.createElement("span");
        yearSpan.className = "comparison-year";
        yearSpan.textContent = item.label;
        labelTop.appendChild(yearSpan);

        const separator = document.createElement("span");
        separator.className = "comparison-separator";
        separator.textContent = "·";
        labelTop.appendChild(separator);

        const valueSpan = document.createElement("span");
        valueSpan.className = "comparison-value";
        valueSpan.textContent = item.value;
        labelTop.appendChild(valueSpan);

        card.appendChild(labelTop);

        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.label;
        img.className = "hero-comparison-image";
        if (item.imagePosition === "center") {
          img.classList.add("hero-comparison-image--center");
        }
        card.appendChild(img);

        comparisonContainer.appendChild(card);
        cards.push(card);
      });

      // Create modal
      if (items.length === 2) {
        let currentModalIndex = 0;

        const modal = document.createElement("div");
        modal.className = "comparison-modal";

        const backdrop = document.createElement("div");
        backdrop.className = "comparison-modal-backdrop";
        modal.appendChild(backdrop);

        const content = document.createElement("div");
        content.className = "comparison-modal-content";

        const label = document.createElement("div");
        label.className = "comparison-modal-label";
        content.appendChild(label);

        const imageContainer = document.createElement("div");
        imageContainer.className = "comparison-modal-image-container";

        const closeBtn = document.createElement("button");
        closeBtn.className = "comparison-modal-close";
        closeBtn.textContent = "×";
        imageContainer.appendChild(closeBtn);

        const prevBtn = document.createElement("button");
        prevBtn.className = "comparison-modal-nav comparison-modal-nav--prev";
        prevBtn.textContent = "‹";
        imageContainer.appendChild(prevBtn);

        const modalImg = document.createElement("img");
        modalImg.className = "comparison-modal-image";
        imageContainer.appendChild(modalImg);

        const nextBtn = document.createElement("button");
        nextBtn.className = "comparison-modal-nav comparison-modal-nav--next";
        nextBtn.textContent = "›";
        imageContainer.appendChild(nextBtn);

        content.appendChild(imageContainer);
        modal.appendChild(content);
        document.body.appendChild(modal);

        const updateNavButtons = (index) => {
          // Hide prev on first item, hide next on last item
          prevBtn.style.display = index === 0 ? "none" : "flex";
          nextBtn.style.display = index === items.length - 1 ? "none" : "flex";
        };

        const updateModalContent = (index) => {
          currentModalIndex = index;
          const item = items[index];
          modalImg.src = item.image;
          modalImg.alt = item.label;
          modalImg.className = "comparison-modal-image";
          if (item.imagePosition === "center") {
            modalImg.classList.add("comparison-modal-image--center");
          }

          label.textContent = "";
          const yearSpan = document.createElement("span");
          yearSpan.className = "comparison-year";
          yearSpan.textContent = item.label;
          label.appendChild(yearSpan);

          const sep = document.createElement("span");
          sep.className = "comparison-separator";
          sep.textContent = "·";
          label.appendChild(sep);

          const valSpan = document.createElement("span");
          valSpan.className = "comparison-value";
          valSpan.textContent = item.value;
          label.appendChild(valSpan);

          updateNavButtons(index);
        };

        const openComparisonModal = (index) => {
          updateModalContent(index);
          modal.classList.add("active");
          document.documentElement.classList.add("modal-open");
          document.body.classList.add("modal-open");
        };

        const closeModal = () => {
          modal.classList.remove("active");
          document.documentElement.classList.remove("modal-open");
          document.body.classList.remove("modal-open");
        };

        // Add click handlers to cards
        cards.forEach((card, index) => {
          card.addEventListener("click", () => openComparisonModal(index));
        });

        prevBtn.addEventListener("click", () => {
          if (currentModalIndex > 0) {
            updateModalContent(currentModalIndex - 1);
          }
        });

        nextBtn.addEventListener("click", () => {
          if (currentModalIndex < items.length - 1) {
            updateModalContent(currentModalIndex + 1);
          }
        });

        closeBtn.addEventListener("click", closeModal);
        backdrop.addEventListener("click", closeModal);

        document.addEventListener("keydown", (e) => {
          if (!modal.classList.contains("active")) return;
          if (e.key === "Escape") closeModal();
          if (e.key === "ArrowLeft" && currentModalIndex > 0) {
            updateModalContent(currentModalIndex - 1);
          }
          if (e.key === "ArrowRight" && currentModalIndex < items.length - 1) {
            updateModalContent(currentModalIndex + 1);
          }
        });
      }
    }

    const heroNav = document.querySelector(".hero-nav");
    if (heroNav) {
      renderEvolutionHeroNav(heroNav, evolutionConfig.sections);
    }

    const pageTitleArrow = document.querySelector(".evolution-page-title-arrow");
    if (pageTitleArrow) {
      // Create arrow SVG (inside a span, not anchor, since it's inside an <a> tag)
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "24");
      svg.setAttribute("height", "24");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path1.setAttribute("d", "M12 5v14");
      const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path2.setAttribute("d", "m19 12-7 7-7-7");
      svg.appendChild(path1);
      svg.appendChild(path2);
      pageTitleArrow.appendChild(svg);
    }

    const main = document.querySelector("main");
    if (main) {
      for (let i = 0; i < evolutionConfig.sections.length; i++) {
        await renderSection(evolutionConfig.sections[i], main, i);
      }

      initScrollReveal();
      initNavigation();
    }

    initHeadshotClickAnimation(400, "/");
  } catch (error) {
    console.error("Error initializing evolution page:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (history.scrollRestoration) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);
  initEvolutionPage();
});
