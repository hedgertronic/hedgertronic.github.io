/**
 * Header and hero section rendering.
 */

import { createElement, createIconElement } from "./dom.js";
import { buildHeroNavItem } from "./ui.js";

export function getThemedHeadshot(config) {
  const theme = localStorage.getItem("theme") || "marlins";
  if (config.profile.headshots && config.profile.headshots[theme]) {
    return config.profile.headshots[theme];
  }
  return config.profile.headshot;
}

export function updateLogoHeadshot(config) {
  const logoHeadshot = document.getElementById("logo-headshot");
  if (!logoHeadshot || !config?.profile?.headshots) return;
  logoHeadshot.src = getThemedHeadshot(config);
}

/**
 * Renders the hero intro section (headshot, name, bio, social links).
 * Shared between homepage and resume page to keep them in sync.
 */
export function renderHeroIntro(container, config, options = {}) {
  const {
    extraClass = "",
    excludePlatforms = [],
    includeResumeCta = false,
    reuseExisting = false,
  } = options;

  let heroIntro = reuseExisting ? container.querySelector(".hero-intro") : null;
  const heroIntroExisted = !!heroIntro;

  if (!heroIntro) {
    const className = extraClass ? `hero-intro ${extraClass}` : "hero-intro";
    heroIntro = createElement("div", { className });
  }

  // Remove inline script if present (was used to set headshot src on homepage)
  const inlineScript = heroIntro.querySelector("script");
  if (inlineScript) inlineScript.remove();

  // Headshot
  let heroImg = reuseExisting ? document.getElementById("hero-headshot-img") : null;
  if (heroImg) {
    heroImg.src = getThemedHeadshot(config);
    heroImg.alt = config.profile.name;
  } else {
    heroImg = createElement("img", {
      src: getThemedHeadshot(config),
      alt: config.profile.name,
      className: "hero-headshot",
      fetchpriority: "high",
      width: 100,
      height: 100,
    });
    heroIntro.appendChild(heroImg);
  }

  // Name
  let heroName = reuseExisting ? heroIntro.querySelector(".hero-name") : null;
  if (!heroName) {
    heroName = createElement("h1", { className: "hero-name" });
    heroIntro.appendChild(heroName);
  }
  heroName.textContent = config.profile.name;

  // Description
  let heroDescription = reuseExisting ? heroIntro.querySelector(".hero-description") : null;
  if (!heroDescription) {
    heroDescription = createElement("p", { className: "hero-description" });
    heroIntro.appendChild(heroDescription);
  }
  heroDescription.textContent = config.profile.bio;

  // Social links
  let socialLinks = reuseExisting ? heroIntro.querySelector(".social-links") : null;
  if (!socialLinks) {
    socialLinks = createElement("div", { className: "social-links" });
    heroIntro.appendChild(socialLinks);
  }

  config.socials.forEach((social) => {
    // Skip excluded platforms
    if (excludePlatforms.includes(social.platform)) return;

    const isExternal = social.url.startsWith("http");
    const linkAttrs = { href: social.url };
    if (isExternal) {
      linkAttrs.target = "_blank";
      linkAttrs.rel = "noopener noreferrer";
    }
    const link = createElement("a", linkAttrs);
    link.setAttribute("aria-label", social.label);

    // Style resume as a prominent CTA button if enabled
    if (social.platform === "resume" && includeResumeCta) {
      link.classList.add("resume-cta");
      link.appendChild(createElement("span", { textContent: "Résumé" }));
    } else {
      link.appendChild(createIconElement(social.platform));
    }
    socialLinks.appendChild(link);
  });

  if (!heroIntroExisted) {
    container.appendChild(heroIntro);
  }

  return heroIntro;
}

export function renderHeader(config) {
  const header = document.querySelector("header");
  if (!header) return;

  const nav = createElement("nav", { className: "container" });

  const logo = createElement("a", { href: "#top", className: "logo" });
  const logoImg = createElement("img", {
    src: getThemedHeadshot(config),
    alt: config.profile.name,
    className: "logo-headshot",
  });
  const logoText = createElement("span", {
    className: "logo-text",
    textContent: config.profile.name,
  });
  logo.appendChild(logoImg);
  logo.appendChild(logoText);
  nav.appendChild(logo);

  const navLinks = createElement("div", { className: "nav-links" });
  config.sections.forEach((section) => {
    const link = createElement("a", {
      href: `#${section.id}`,
    });
    link.dataset.section = section.id;

    const iconSpan = createElement("span", { className: "nav-icon" });
    iconSpan.appendChild(createIconElement(section.icon));
    link.appendChild(iconSpan);

    link.appendChild(
      createElement("span", {
        className: "nav-text",
        textContent: section.title,
      }),
    );

    navLinks.appendChild(link);
  });
  nav.appendChild(navLinks);

  header.textContent = "";
  header.appendChild(nav);
}

const HERO_NAV_LABELS = {
  field: "On the Field",
  writing: "On the Page",
  lab: "In the Lab",
  media: "In the Media",
  offtheClock: "Off the Clock",
};

export function renderHero(config) {
  const heroSection = document.getElementById("about");
  if (!heroSection) return;

  // Reuse existing structure from HTML, or create if missing
  let container = heroSection.querySelector(".container");
  if (!container) {
    container = createElement("div", { className: "container" });
    heroSection.appendChild(container);
  }

  // Render hero intro using shared function
  renderHeroIntro(container, config, {
    includeResumeCta: true,
    reuseExisting: true,
  });

  // Reuse existing hero-nav from HTML, or create if missing
  let heroNav = container.querySelector(".hero-nav");
  if (!heroNav) {
    heroNav = createElement("nav", { className: "hero-nav" });
    container.appendChild(heroNav);
  }

  config.sections.forEach((section) => {
    const label = HERO_NAV_LABELS[section.id] || section.title;
    heroNav.appendChild(buildHeroNavItem(section, { label }));
  });

  // Trigger animations now that JS has enhanced the hero
  container.classList.add("rendered");
}

export function renderFooter(config) {
  const footer = document.querySelector("footer");
  if (!footer) return;

  const containerDiv = createElement("div", { className: "container" });
  const footerContent = createElement("div", { className: "footer-content" });

  // Theme switcher — label above trigger button; dropdown built by initThemeSwitcher
  const themeSwitcher = createElement("div", { className: "theme-switcher" });
  const switcherLabel = createElement("span", {
    className: "theme-switcher-label",
    textContent: "Team Colors",
  });
  const menuTrigger = createElement("button", {
    className: "theme-menu-trigger",
    type: "button",
    textContent: "Team Colors ▾",
  });
  themeSwitcher.appendChild(switcherLabel);
  themeSwitcher.appendChild(menuTrigger);
  footerContent.appendChild(themeSwitcher);

  containerDiv.appendChild(footerContent);
  footer.textContent = "";
  footer.appendChild(containerDiv);
}
