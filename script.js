/**
 * =============================================================================
 * MAIN SITE SCRIPT
 * =============================================================================
 *
 * TABLE OF CONTENTS
 * -----------------
 * 1. ICONS REGISTRY ...................... Line 56
 *    - SVG icon definitions for UI elements
 *
 * 2. DOM UTILITIES ....................... Line 101
 *    - createElement() - DOM element factory
 *    - setTrustedHTML() - safe innerHTML wrapper
 *    - createIconElement() - icon span factory
 *
 * 3. DATA LOADING ........................ Line 142
 *    - loadSiteConfig() - fetch site.json
 *    - parseCSV() - parse CSV data files
 *
 * 4. HEADER & HERO ....................... Line 170
 *    - renderHeader() - sticky nav bar
 *    - renderHero() - hero section with nav pills
 *
 * 5. SECTION RENDERING ................... Line 325
 *    - renderSections() - main content sections
 *    - renderStatsSection() - baseball stats
 *    - renderContentSection() - articles/projects
 *    - renderPersonalSection() - reading/listening
 *    - renderFooter() - theme switcher
 *
 * 6. CARD RENDERING & DISPLAY ............ Line 909
 *    - displayItems() - unified display function
 *    - displayProjects/Content/Tweets() - wrappers
 *    - createProjectCard() - GitHub project cards
 *    - createTweetCard() - tweet embed cards
 *    - createContentCard() - article/media cards
 *
 * 7. UI UTILITIES ........................ Line 1281
 *    - initCarouselScrollDetection() - scroll shadows
 *    - displayEmptyState() - no content message
 *    - formatDate() - date formatting
 *    - sortByDate() - chronological sort
 *
 * 8. INTERACTIVITY ....................... Line 1335
 *    - initThemeSwitcher() - team color themes
 *    - initScrollReveal() - section animations
 *    - initNavigation() - smooth scroll & active state
 *
 * 9. INITIALIZATION ...................... Line 1457
 *    - initSite() - main entry point
 *    - DOMContentLoaded handler
 *
 * =============================================================================
 */

/* =============================================================================
   1. ICONS REGISTRY
   ============================================================================= */

const ICONS = {
  baseball:
    '<svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor"><path d="M26.08 5A14.37 14.37 0 0 0 16 1 14.3 14.3 0 0 0 6 5a14.68 14.68 0 0 0-5 11 15 15 0 0 0 4.93 11.09A14.62 14.62 0 0 0 16 31a14.57 14.57 0 0 0 10.05-3.9A15 15 0 0 0 31 16a14.68 14.68 0 0 0-4.92-11ZM29 16a13 13 0 0 1-3.62 9 13 13 0 0 1-2.12-3 1 1 0 1 0 0-2h-.86a12.76 12.76 0 0 1-.59-3h.45a1 1 0 1 0 0-2h-.45a12.56 12.56 0 0 1 .59-3h.86a1 1 0 1 0 0-2 12.51 12.51 0 0 1 2.12-2.89A12.7 12.7 0 0 1 29 16ZM3 16a12.71 12.71 0 0 1 3.62-8.89A12.51 12.51 0 0 1 8.74 10a1 1 0 0 0 0 2h.86a12.56 12.56 0 0 1 .59 3h-.44a1 1 0 0 0 0 2h.44a12.76 12.76 0 0 1-.59 3h-.86a1 1 0 0 0 0 2 13 13 0 0 1-2.12 3A13 13 0 0 1 3 16Zm5.09 10.3A14.88 14.88 0 0 0 11 22h.77a1 1 0 1 0 0-2h-.07a15.19 15.19 0 0 0 .52-3h.56a1 1 0 0 0 0-2h-.56a15.07 15.07 0 0 0-.52-3h.07a1 1 0 1 0 0-2H11a14.39 14.39 0 0 0-2.91-4.25A12.43 12.43 0 0 1 16 3a12.43 12.43 0 0 1 7.91 2.75A14.39 14.39 0 0 0 21 10h-.77a1 1 0 0 0 0 2h.07a15.07 15.07 0 0 0-.52 3h-.55a1 1 0 0 0 0 2h.55a15.19 15.19 0 0 0 .52 3h-.07a1 1 0 0 0 0 2H21a14.88 14.88 0 0 0 2.88 4.3A12.7 12.7 0 0 1 16 29a12.66 12.66 0 0 1-7.91-2.7Z"/></svg>',
  pen: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
  code: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  microphone:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
  coffee:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
  book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  headphones:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  chess:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 16l-1.447.724a1 1 0 0 0-.553.894V20h12v-2.382a1 1 0 0 0-.553-.894L16 16"/><path d="M8.5 16a6.5 6.5 0 1 1 7 0"/><path d="M12 2v4"/><path d="M10 4h4"/></svg>',
  lightbulb:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
  twitter:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  email:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  resume:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  linkedin:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  substack:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>',
  github:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
  instagram:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
  externalLink:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  arrow: '<span class="arrow">\u2192</span>',
  retweet:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  heart:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  bookmark:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
};

/* =============================================================================
   2. DOM UTILITIES
   ============================================================================= */

function createElement(tag, attributes = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "className") {
      el.className = value;
    } else if (key === "textContent") {
      el.textContent = value;
    } else if (key.startsWith("data")) {
      el.dataset[key.slice(4).toLowerCase()] = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  children.forEach((child) => {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  });
  return el;
}

// Helper to set HTML content (for trusted owner-controlled data only)
function setTrustedHTML(element, html) {
  // Note: This data comes from site owner's config files, not user input
  element.innerHTML = html;
}

// Helper to create icon element from registry
function createIconElement(name) {
  const span = document.createElement("span");
  span.className = "icon-wrapper";
  setTrustedHTML(span, ICONS[name] || "");
  return span;
}

/* =============================================================================
   3. DATA LOADING
   ============================================================================= */

let siteConfig = null;

async function loadSiteConfig() {
  const response = await fetch("/data/site.json");
  siteConfig = await response.json();
  return siteConfig;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }
  return rows;
}

/* =============================================================================
   4. HEADER & HERO
   ============================================================================= */

function getThemedHeadshot(config) {
  const theme = localStorage.getItem("theme") || "driveline";
  if (config.profile.headshots && config.profile.headshots[theme]) {
    return config.profile.headshots[theme];
  }
  return config.profile.headshot;
}

function renderHeader(config) {
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

function renderHero(config) {
  const heroSection = document.getElementById("about");
  if (!heroSection) return;

  heroSection.className = "hero";

  const container = createElement("div", { className: "container" });

  const heroIntro = createElement("div", { className: "hero-intro" });
  heroIntro.appendChild(
    createElement("img", {
      src: getThemedHeadshot(config),
      alt: config.profile.name,
      className: "hero-headshot",
    }),
  );
  heroIntro.appendChild(
    createElement("h1", {
      className: "hero-name",
      textContent: config.profile.name,
    }),
  );
  heroIntro.appendChild(
    createElement("p", {
      className: "hero-description",
      textContent: config.profile.bio,
    }),
  );

  const socialLinks = createElement("div", { className: "social-links" });
  config.socials.forEach((social) => {
    const isExternal = social.url.startsWith("http");
    const linkAttrs = { href: social.url };
    if (isExternal) {
      linkAttrs.target = "_blank";
      linkAttrs.rel = "noopener noreferrer";
    }
    const link = createElement("a", linkAttrs);
    link.setAttribute("aria-label", social.label);
    // Style resume as a prominent CTA button (no icon, just text)
    if (social.platform === "resume") {
      link.classList.add("resume-cta");
      link.appendChild(createElement("span", { textContent: "Résumé" }));
    } else {
      link.appendChild(createIconElement(social.platform));
    }
    socialLinks.appendChild(link);
  });
  heroIntro.appendChild(socialLinks);
  container.appendChild(heroIntro);

  const heroNav = createElement("nav", { className: "hero-nav" });
  config.sections.forEach((section) => {
    const navLink = createElement("a", {
      href: `#${section.id}`,
      className: "hero-nav-item",
    });
    navLink.dataset.section = section.id;
    navLink.style.setProperty("--section-accent", section.accentColor);

    const iconDiv = createElement("div", { className: "hero-nav-icon" });
    iconDiv.appendChild(createIconElement(section.icon));
    navLink.appendChild(iconDiv);

    const textDiv = createElement("div", { className: "hero-nav-text" });
    const label = HERO_NAV_LABELS[section.id] || section.title;
    textDiv.appendChild(
      createElement("span", {
        className: "hero-nav-label",
        textContent: label,
      }),
    );

    if (section.subtitle) {
      textDiv.appendChild(
        createElement("span", {
          className: "hero-nav-subtitle",
          textContent: section.subtitle,
        }),
      );
    }

    navLink.appendChild(textDiv);

    navLink.appendChild(
      createElement("span", {
        className: "hero-nav-arrow",
        textContent: "\u2193",
      }),
    );

    heroNav.appendChild(navLink);
  });
  container.appendChild(heroNav);

  heroSection.textContent = "";
  heroSection.appendChild(container);
}

/* =============================================================================
   5. SECTION RENDERING
   ============================================================================= */

async function renderSections(config) {
  const main = document.querySelector("main");

  for (const [index, section] of config.sections.entries()) {
    const sectionEl = createElement("section", {
      id: section.id,
      className: "content-section" + (index % 2 === 0 ? " alt-bg" : ""),
    });

    if (section.type === "stats") {
      await renderStatsSection(sectionEl, section, config);
    } else if (section.type === "personal") {
      await renderPersonalSection(sectionEl, section, config);
    } else {
      await renderContentSection(sectionEl, section, config);
    }

    main.appendChild(sectionEl);
  }
}

async function renderStatsSection(container, section, config) {
  const csvResponse = await fetch("/" + section.statsFile);
  const csvText = await csvResponse.text();
  const statsData = parseCSV(csvText);

  // Find all career total rows
  const careerRows = {
    College: statsData.find((row) => row.Season === "College Career"),
    Summer: statsData.find((row) => row.Season === "Summer Career"),
    Independent: statsData.find((row) => row.Season === "Independent Career"),
    Minors: statsData.find((row) => row.Season === "Minors Career"),
  };

  // Filter for season aggregate rows (includes "team" or "teams")
  const seasonRows = statsData.filter(
    (row) => /^\d{4}$/.test(row.Season) && /\d+\s*teams?$/i.test(row.Team),
  );

  const levelClasses = {
    "Rk+": "level-roa",
    "A-": "level-a-short",
    "A+": "level-a-plus",
    AA: "level-aa",
    AAA: "level-aaa",
    NCAA: "level-ncaa",
    Summer: "level-summer",
    Independent: "level-independent",
  };

  const orgClasses = {
    Mets: "org-mets",
    Phillies: "org-phillies",
    "Johns Hopkins": "org-hopkins",
    Westside: "org-westside",
    Baltimore: "org-baltimore",
  };

  const orgDisplayNames = {
    Mets: "New York Mets",
    Phillies: "Philadelphia Phillies",
    "Johns Hopkins": "Johns Hopkins Blue Jays",
    Westside: "Westside Woolly Mammoths",
    Baltimore: "Baltimore Dodgers",
  };

  // Map individual levels to their category
  const levelToCategory = {
    NCAA: "College",
    Summer: "Summer",
    Independent: "Independent",
    "Rk+": "Minors",
    "A-": "Minors",
    "A+": "Minors",
    AA: "Minors",
    AAA: "Minors",
  };

  // Group levels by year AND category (e.g., "2019-Minors" -> ["Rk+", "A-"])
  const seasonCategoryLevels = {};
  statsData.forEach((row) => {
    // Skip aggregate rows and career/level totals
    if (/^\d{4}$/.test(row.Season) && !/\d+\s*teams?$/i.test(row.Team)) {
      const category = levelToCategory[row.Level] || row.Level;
      const key = `${row.Season}-${category}`;
      if (!seasonCategoryLevels[key]) {
        seasonCategoryLevels[key] = [];
      }
      const level = row.Level;
      if (!seasonCategoryLevels[key].includes(level)) {
        seasonCategoryLevels[key].push(level);
      }
    }
  });

  const highlightLabels = {
    ERA: "ERA",
    "W-L": "W-L Record",
    G: "Games",
    IP: "Innings",
    SO: "Strikeouts",
    WHIP: "WHIP",
  };

  // Use Minors career for highlight values (professional baseball stats)
  const minorsCareer = careerRows.Minors;
  const highlightValues = {
    ERA: minorsCareer?.ERA || "-",
    "W-L": minorsCareer ? `${minorsCareer.W}-${minorsCareer.L}` : "-",
    G: minorsCareer?.G || "-",
    IP: minorsCareer?.IP || "-",
    SO: minorsCareer?.SO || "-",
    WHIP: minorsCareer?.WHIP || "-",
  };

  const containerDiv = createElement("div", { className: "container" });

  const sectionHeader = createElement("div", { className: "section-header" });
  const iconDiv = createElement("div", {
    className: `section-icon ${section.id}-icon`,
  });
  iconDiv.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconDiv);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(
    createElement("p", {
      className: "section-subtitle",
      textContent: section.subtitle,
    }),
  );
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  if (section.description) {
    containerDiv.appendChild(
      createElement("p", {
        className: "section-intro",
        textContent: section.description,
      }),
    );
  }

  const subsection = createElement("div", { className: "subsection" });
  const subsectionHeader = createElement("div", {
    className: "subsection-header",
  });
  subsectionHeader.appendChild(
    createElement("h3", { textContent: "Career Stats" }),
  );
  subsection.appendChild(subsectionHeader);

  // Calculate year ranges for each category
  const categoryYears = {};
  seasonRows.forEach((row) => {
    const category = row.Level;
    const year = parseInt(row.Season, 10);
    if (!categoryYears[category]) {
      categoryYears[category] = [];
    }
    categoryYears[category].push(year);
  });

  const getCategoryYearRange = (category) => {
    const years = categoryYears[category] || [];
    if (years.length === 0) return "";
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    if (minYear === maxYear) return `${minYear}`;
    const maxYearShort = String(maxYear).slice(-2);
    return `${minYear}-${maxYearShort}`;
  };

  // Category selector (ordered by first appearance, but Minors is default selection)
  const categorySelector = createElement("div", { className: "stats-category-selector" });
  const categoryOrder = ["College", "Summer", "Independent", "Minors"];
  categoryOrder.forEach((category) => {
    const btn = createElement("button", {
      className: `stats-category-btn${category === "Minors" ? " active" : ""}`,
    });
    btn.dataset.category = category;

    const nameSpan = createElement("span", {
      className: "stats-category-name",
      textContent: category,
    });
    const yearsSpan = createElement("span", {
      className: "stats-category-years",
      textContent: getCategoryYearRange(category),
    });
    btn.appendChild(nameSpan);
    btn.appendChild(yearsSpan);
    categorySelector.appendChild(btn);
  });
  subsection.appendChild(categorySelector);

  // Helper to get highlight values for a category
  const getHighlightValues = (category) => {
    const careerRow = careerRows[category];
    return {
      ERA: careerRow?.ERA || "-",
      "W-L": careerRow ? `${careerRow.W}-${careerRow.L}` : "-",
      G: careerRow?.G || "-",
      IP: careerRow?.IP || "-",
      SO: careerRow?.SO || "-",
      WHIP: careerRow?.WHIP || "-",
    };
  };

  // Overview cards (initially showing Minors)
  const statsOverview = createElement("div", { className: "stats-overview" });
  const initialHighlights = getHighlightValues("Minors");
  section.statsHighlights.forEach((stat) => {
    const card = createElement("div", { className: "stat-card-large" });
    const statValue = createElement("div", {
      className: "stat-value",
      textContent: initialHighlights[stat],
    });
    statValue.dataset.stat = stat;
    card.appendChild(statValue);
    card.appendChild(
      createElement("div", {
        className: "stat-label",
        textContent: highlightLabels[stat],
      }),
    );
    statsOverview.appendChild(card);
  });
  subsection.appendChild(statsOverview);

  const tableWrapper = createElement("div", {
    className: "stats-table-wrapper",
  });
  const table = createElement("table", { className: "stats-table" });

  // League info for non-Minors categories
  const categoryLeagues = {
    College: { name: "NCAA D3", className: "league-ncaa" },
    Summer: { name: "Cal Ripken", className: "league-summer" },
    Independent: { name: "USPBL", className: "league-independent" },
  };

  const thead = createElement("thead");
  const headerRow = createElement("tr");
  const headers = ["Year", "Organization", "Levels", "W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"];
  headers.forEach((header) => {
    const th = createElement("th", { textContent: header });
    if (header === "Organization") th.dataset.column = "team";
    if (header === "Levels") th.dataset.column = "levels";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = createElement("tbody");
  seasonRows.forEach((row) => {
    const tr = createElement("tr");
    const category = row.Level; // Aggregate rows have category as Level (e.g., "College", "Minors")
    tr.dataset.category = category;
    // Initially hide non-Minors rows
    if (category !== "Minors") {
      tr.style.display = "none";
    }
    tr.appendChild(createElement("td", { textContent: row.Season }));

    // Team/Org badge
    const teamCell = createElement("td");
    if (row.Org && row.Org !== "-") {
      const displayName = orgDisplayNames[row.Org] || row.Org;
      const teamBadge = createElement("span", {
        className: `org-badge ${orgClasses[row.Org] || ""}`,
        textContent: displayName,
      });
      teamCell.appendChild(teamBadge);
    }
    tr.appendChild(teamCell);

    // Levels/League cell - for Minors show level badges, for others show league badge
    const levelsCell = createElement("td");
    if (category === "Minors") {
      const levelKey = `${row.Season}-${category}`;
      (seasonCategoryLevels[levelKey] || []).forEach((level) => {
        const badge = createElement("span", {
          className: `level-badge ${levelClasses[level] || ""}`,
          textContent: level,
        });
        levelsCell.appendChild(badge);
        levelsCell.appendChild(document.createTextNode(" "));
      });
    } else {
      const leagueInfo = categoryLeagues[category];
      if (leagueInfo) {
        const leagueBadge = createElement("span", {
          className: `league-badge ${leagueInfo.className}`,
          textContent: leagueInfo.name,
        });
        levelsCell.appendChild(leagueBadge);
      }
    }
    tr.appendChild(levelsCell);

    ["W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"].forEach((col) => {
      let value = row[col];
      // Show 0 instead of - for saves
      if (col === "SV" && (value === "-" || value === "")) {
        value = "0";
      }
      tr.appendChild(createElement("td", { textContent: value }));
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const tfoot = createElement("tfoot");

  // Add a totals row for each career category
  const footerCategoryOrder = ["College", "Summer", "Independent", "Minors"];
  footerCategoryOrder.forEach((category) => {
    const careerRow = careerRows[category];
    if (!careerRow) return;

    const footerRow = createElement("tr");
    footerRow.dataset.category = category;
    // Initially hide non-Minors rows
    if (category !== "Minors") {
      footerRow.style.display = "none";
    }

    // Empty cells for Year, Team/Org, Levels/League columns
    footerRow.appendChild(createElement("td"));
    footerRow.appendChild(createElement("td"));
    footerRow.appendChild(createElement("td"));

    ["W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"].forEach((col) => {
      let value = careerRow?.[col] || "-";
      // Show 0 instead of - for saves
      if (col === "SV" && (value === "-" || value === "")) {
        value = "0";
      }
      const cell = createElement("td");
      cell.appendChild(createElement("strong", { textContent: value }));
      footerRow.appendChild(cell);
    });
    tfoot.appendChild(footerRow);
  });

  table.appendChild(tfoot);

  tableWrapper.appendChild(table);
  subsection.appendChild(tableWrapper);

  // Category selector event handler
  categorySelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".stats-category-btn");
    if (!btn) return;

    const selectedCategory = btn.dataset.category;

    // Update active button
    categorySelector.querySelectorAll(".stats-category-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    // Update header labels based on category
    const teamHeader = thead.querySelector('th[data-column="team"]');
    const levelsHeader = thead.querySelector('th[data-column="levels"]');
    if (teamHeader) {
      teamHeader.textContent = selectedCategory === "Minors" ? "Organization" : "Team";
    }
    if (levelsHeader) {
      levelsHeader.textContent = selectedCategory === "Minors" ? "Levels" : "League";
    }

    // Update overview card values
    const newHighlights = getHighlightValues(selectedCategory);
    statsOverview.querySelectorAll(".stat-value").forEach((el) => {
      const stat = el.dataset.stat;
      el.textContent = newHighlights[stat];
    });

    // Filter table body rows
    tbody.querySelectorAll("tr").forEach((row) => {
      row.style.display = row.dataset.category === selectedCategory ? "" : "none";
    });

    // Filter table footer rows
    tfoot.querySelectorAll("tr").forEach((row) => {
      row.style.display = row.dataset.category === selectedCategory ? "" : "none";
    });
  });

  containerDiv.appendChild(subsection);

  // Stats links - below the table
  const statsLinks = createElement("div", { className: "stats-links" });
  section.statsLinks.forEach((link) => {
    const linkEl = createElement("a", {
      href: link.url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "stats-link",
    });
    linkEl.appendChild(
      createElement("span", {
        className: "stats-link-name",
        textContent: link.name,
      }),
    );
    linkEl.appendChild(createIconElement("externalLink"));
    statsLinks.appendChild(linkEl);
  });
  containerDiv.appendChild(statsLinks);

  // My Training subsection
  if (section.trainingFile) {
    try {
      const trainingResponse = await fetch("/" + section.trainingFile);
      const trainingData = await trainingResponse.json();

      if (trainingData && trainingData.length > 0) {
        const trainingSubsection = createElement("div", { className: "subsection" });
        const trainingHeader = createElement("div", {
          className: "subsection-header",
        });
        trainingHeader.appendChild(
          createElement("h3", { textContent: "My Training" }),
        );
        trainingSubsection.appendChild(trainingHeader);

        const trainingGrid = createElement("div", { className: "training-grid" });
        sortByDate(trainingData).forEach((item) => {
          if (item.type === "video") {
            // Wrap card in a link if URL provided
            const cardLink = item.url ? createElement("a", {
              href: item.url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "training-card-link",
            }) : null;

            const card = createElement("div", { className: "training-card" });

            // Background image
            if (item.poster) {
              const imgWrapper = createElement("div", { className: "training-bg-wrapper" });
              const img = createElement("img", {
                src: item.poster,
                alt: "Training video thumbnail",
              });
              imgWrapper.appendChild(img);
              card.appendChild(imgWrapper);

              const overlay = createElement("div", { className: "training-bg-overlay" });
              card.appendChild(overlay);
            }

            // Header with handle and date
            const header = createElement("div", { className: "training-header" });
            if (item.credit) {
              const handleEl = createElement("div", { className: "training-handle", textContent: `@${item.credit.handle}` });
              header.appendChild(handleEl);
            }
            if (item.date) {
              const dateEl = createElement("span", {
                className: "training-date",
                textContent: formatDate(item.date),
              });
              header.appendChild(dateEl);
            }
            card.appendChild(header);

            // Badge row for new/pinned items
            const isNew = item.date && isWithinDays(item.date, 30);
            if (isNew || item.pinned) {
              const badgeRow = createElement("div", { className: "card-badge-row" });

              if (item.pinned) {
                const pinnedBadge = createElement("span", { className: "pinned-badge", textContent: "Pinned" });
                badgeRow.appendChild(pinnedBadge);
              }

              if (isNew) {
                const newBadge = createElement("span", { className: "new-badge", textContent: "New" });
                badgeRow.appendChild(newBadge);
              }

              card.appendChild(badgeRow);
            }

            // Content with truncated caption
            const cardContent = createElement("div", { className: "training-card-content" });
            if (item.caption) {
              const captionEl = createElement("p", { className: "training-caption" });

              // Truncate to 280 characters
              let captionText = item.caption;
              if (captionText.length > 280) {
                captionText = captionText.substring(0, 280).trim() + "...";
              }

              // Parse @mentions
              const parts = captionText.split(/(@\w+)/g);
              parts.forEach((part) => {
                if (part.startsWith("@")) {
                  const mention = createElement("span", { className: "training-mention" });
                  mention.textContent = part;
                  captionEl.appendChild(mention);
                } else {
                  captionEl.appendChild(document.createTextNode(part));
                }
              });

              cardContent.appendChild(captionEl);
            }
            card.appendChild(cardContent);

            if (cardLink) {
              cardLink.appendChild(card);
              trainingGrid.appendChild(cardLink);
            } else {
              trainingGrid.appendChild(card);
            }
          }
        });
        trainingSubsection.appendChild(trainingGrid);
        containerDiv.appendChild(trainingSubsection);
      }
    } catch (error) {
      console.error("Error loading training data:", error);
    }
  }

  container.appendChild(containerDiv);
}

async function renderContentSection(container, section, config) {
  const containerDiv = createElement("div", { className: "container" });

  const sectionHeader = createElement("div", { className: "section-header" });
  const iconDiv = createElement("div", {
    className: `section-icon ${section.id}-icon`,
  });
  iconDiv.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconDiv);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(
    createElement("p", {
      className: "section-subtitle",
      textContent: section.subtitle,
    }),
  );
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  if (section.description) {
    containerDiv.appendChild(
      createElement("p", {
        className: "section-intro",
        textContent: section.description,
      }),
    );
  }

  if (section.topics && section.topics.length > 0) {
    const topicsContainer = createElement("div", { className: "section-topics" });

    if (section.topicsLabel) {
      topicsContainer.appendChild(
        createElement("span", {
          className: "section-topics-label",
          textContent: section.topicsLabel,
        }),
      );
    }

    const tagsContainer = createElement("div", { className: "section-topics-tags" });
    section.topics.forEach((topic) => {
      tagsContainer.appendChild(
        createElement("span", {
          className: "section-topic-tag",
          textContent: topic,
        }),
      );
    });
    topicsContainer.appendChild(tagsContainer);
    containerDiv.appendChild(topicsContainer);
  }

  for (const subsection of section.subsections) {
    const subsectionDiv = createElement("div", { className: "subsection" });

    const subsectionHeader = createElement("div", {
      className: "subsection-header",
    });
    subsectionHeader.appendChild(
      createElement("h3", { textContent: subsection.title }),
    );

    if (subsection.viewAllUrl) {
      const viewAllLink = createElement("a", {
        href: subsection.viewAllUrl,
        target: "_blank",
        className: "view-all-link",
        textContent: subsection.viewAllLabel,
      });
      subsectionHeader.appendChild(viewAllLink);
    }
    subsectionDiv.appendChild(subsectionHeader);

    const contentGrid = createElement("div", { className: "content-grid" });
    subsectionDiv.appendChild(contentGrid);
    containerDiv.appendChild(subsectionDiv);

    try {
      const dataResponse = await fetch("/" + subsection.dataFile);
      const items = await dataResponse.json();

      if (subsection.displayType === "projects") {
        displayProjects(contentGrid, items);
      } else if (subsection.displayType === "tweets") {
        displayTweets(contentGrid, items, subsection.handle);
      } else {
        displayContent(contentGrid, items);
      }
    } catch (error) {
      displayError(contentGrid);
    }
  }

  container.appendChild(containerDiv);
}

async function renderPersonalSection(container, section, config) {
  const containerDiv = createElement("div", { className: "container" });

  const sectionHeader = createElement("div", { className: "section-header" });
  const iconDiv = createElement("div", {
    className: `section-icon ${section.id}-icon`,
  });
  iconDiv.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconDiv);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(
    createElement("p", {
      className: "section-subtitle",
      textContent: section.subtitle,
    }),
  );
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  try {
    const dataResponse = await fetch("/" + section.dataFile);
    const data = await dataResponse.json();

    const personalGrid = createElement("div", { className: "personal-grid" });

    if (data.reading) {
      const readingCard = createElement("a", {
        href: data.reading.book.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "personal-card",
      });

      const cardIcon = createElement("div", {
        className: "personal-card-icon",
      });
      cardIcon.appendChild(createIconElement("book"));
      readingCard.appendChild(cardIcon);

      readingCard.appendChild(
        createElement("h3", {
          className: "personal-card-title",
          textContent: data.reading.title,
        }),
      );

      const coverImg = createElement("img", {
        src: data.reading.book.cover,
        alt: data.reading.book.title,
        className: "personal-cover",
      });
      readingCard.appendChild(coverImg);

      readingCard.appendChild(
        createElement("p", {
          className: "personal-item-title",
          textContent: data.reading.book.title,
        }),
      );
      readingCard.appendChild(
        createElement("p", {
          className: "personal-item-subtitle",
          textContent: data.reading.book.author,
        }),
      );

      personalGrid.appendChild(readingCard);
    }

    if (data.listening) {
      const listeningCard = createElement("a", {
        href: data.listening.album.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "personal-card",
      });

      const cardIcon = createElement("div", {
        className: "personal-card-icon",
      });
      cardIcon.appendChild(createIconElement("headphones"));
      listeningCard.appendChild(cardIcon);

      listeningCard.appendChild(
        createElement("h3", {
          className: "personal-card-title",
          textContent: data.listening.title,
        }),
      );

      const coverImg = createElement("img", {
        src: data.listening.album.cover,
        alt: data.listening.album.title,
        className: "personal-cover",
      });
      listeningCard.appendChild(coverImg);

      listeningCard.appendChild(
        createElement("p", {
          className: "personal-item-title",
          textContent: data.listening.album.title,
        }),
      );
      listeningCard.appendChild(
        createElement("p", {
          className: "personal-item-subtitle",
          textContent: data.listening.album.artist,
        }),
      );

      personalGrid.appendChild(listeningCard);
    }

    containerDiv.appendChild(personalGrid);
  } catch (error) {
    displayError(containerDiv);
  }

  container.appendChild(containerDiv);
}

function renderFooter(config) {
  const footer = document.querySelector("footer");
  if (!footer) return;

  const containerDiv = createElement("div", { className: "container" });
  const footerContent = createElement("div", { className: "footer-content" });

  // Theme switcher
  const themeSwitcher = createElement("div", { className: "theme-switcher" });
  themeSwitcher.appendChild(
    createElement("span", {
      className: "theme-label",
      textContent: "Team colors",
    }),
  );

  const buttonContainer = createElement("div", { className: "theme-switcher-buttons" });
  config.footer.themes.forEach((theme) => {
    const btn = createElement("button", {
      className: "theme-btn",
      textContent: theme.label,
    });
    btn.dataset.theme = theme.id;
    buttonContainer.appendChild(btn);
  });
  themeSwitcher.appendChild(buttonContainer);
  footerContent.appendChild(themeSwitcher);

  containerDiv.appendChild(footerContent);
  footer.textContent = "";
  footer.appendChild(containerDiv);
}

/* =============================================================================
   6. CARD RENDERING & DISPLAY
   ============================================================================= */

function displayError(containerOrId) {
  const container =
    typeof containerOrId === "string"
      ? document.getElementById(containerOrId)
      : containerOrId;
  if (!container) return;

  const errorMsg = document.createElement("p");
  errorMsg.textContent = "Content not available.";
  errorMsg.style.color = "var(--text-muted)";
  errorMsg.style.fontStyle = "italic";
  container.appendChild(errorMsg);
}

/**
 * Unified display function for all card types.
 * Consolidates displayProjects, displayContent, and displayTweets.
 *
 * @param {string|Element} containerOrId - Container element or ID
 * @param {Array} items - Items to display
 * @param {Object} options - Display options
 * @param {string} options.type - 'projects' | 'content' | 'tweets'
 * @param {string} options.emptyMessage - Message when no items
 * @param {string} options.handle - Twitter handle (for tweets only)
 * @param {string} options.containerClass - Optional class to add to container
 */
function displayItems(containerOrId, items, options = {}) {
  const container =
    typeof containerOrId === "string"
      ? document.getElementById(containerOrId)
      : containerOrId;
  if (!container) return;
  container.textContent = "";

  // Apply optional container class (e.g., tweet-grid)
  if (options.containerClass) {
    container.className = options.containerClass;
  }

  const emptyMessage = options.emptyMessage || "No items to display yet.";
  if (!items || items.length === 0) {
    displayEmptyState(container, emptyMessage);
    return;
  }

  // Sort items based on type
  let sortedItems;
  if (options.type === "projects") {
    sortedItems = items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.stars || 0) - (a.stars || 0);
    });
  } else {
    sortedItems = sortByDate(items);
  }

  // Create and append cards based on type
  sortedItems.forEach((item) => {
    let card;
    switch (options.type) {
      case "projects":
        card = createProjectCard(item);
        break;
      case "tweets":
        card = createTweetCard(item, options.handle);
        break;
      default:
        card = createContentCard(item);
    }
    container.appendChild(card);
  });

  initCarouselScrollDetection(container);
}

// Legacy wrapper functions for backwards compatibility
function displayProjects(containerOrId, projects) {
  displayItems(containerOrId, projects, {
    type: "projects",
    emptyMessage: "No projects to display yet."
  });
}

// GitHub language colors
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  TypeScript: "#3178c6",
  Swift: "#F05138",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Kotlin: "#A97BFF",
  R: "#198CE7",
  Jupyter: "#DA5B0B",
};

function createProjectCard(project) {
  const card = document.createElement("a");
  card.className = project.pinned ? "content-card project-card pinned" : "content-card project-card";
  card.href = project.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  // Title at top
  const title = document.createElement("h3");
  title.textContent = project.title;
  card.appendChild(title);

  // Badge row (pinned/new) - similar to tweet card
  const isNew = project.date && isWithinDays(project.date, 30);
  if (isNew || project.pinned) {
    const badgeRow = document.createElement("div");
    badgeRow.className = "card-badge-row";

    if (project.pinned) {
      const pinnedBadge = document.createElement("span");
      pinnedBadge.className = "pinned-badge";
      pinnedBadge.textContent = "Pinned";
      badgeRow.appendChild(pinnedBadge);
    }

    if (isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "new-badge";
      newBadge.textContent = "New";
      badgeRow.appendChild(newBadge);
    }

    card.appendChild(badgeRow);
  }

  // Description (flex: 1 to fill space)
  const content = document.createElement("div");
  content.className = "project-content";

  if (project.description && project.description.trim()) {
    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = project.description;
    content.appendChild(desc);
  }

  if (project.topics && project.topics.length > 0) {
    const topics = document.createElement("div");
    topics.className = "project-topics";
    project.topics.slice(0, 3).forEach((topic) => {
      const tag = document.createElement("span");
      tag.className = "project-topic";
      tag.textContent = topic;
      topics.appendChild(tag);
    });
    content.appendChild(topics);
  }

  card.appendChild(content);

  // Stats row at bottom (language, stars, forks)
  const hasStats = project.language || project.stars !== undefined || project.forks !== undefined;
  if (hasStats) {
    const statsRow = document.createElement("div");
    statsRow.className = "project-stats";

    if (project.language) {
      const language = document.createElement("span");
      language.className = "project-language";

      const langColor = LANGUAGE_COLORS[project.language] || "#858585";
      const langDot = document.createElement("span");
      langDot.className = "language-dot";
      langDot.style.backgroundColor = langColor;
      language.appendChild(langDot);

      language.appendChild(document.createTextNode(project.language));
      statsRow.appendChild(language);
    }

    if (project.stars !== undefined) {
      const stars = document.createElement("span");
      stars.className = "project-stat";

      const starIcon = document.createElement("span");
      starIcon.className = "icon-wrapper";
      setTrustedHTML(starIcon, '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>');
      stars.appendChild(starIcon);

      const starCount = document.createElement("span");
      starCount.textContent = project.stars;
      stars.appendChild(starCount);

      statsRow.appendChild(stars);
    }

    if (project.forks !== undefined) {
      const forks = document.createElement("span");
      forks.className = "project-stat";

      const forkIcon = document.createElement("span");
      forkIcon.className = "icon-wrapper";
      setTrustedHTML(forkIcon, '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>');
      forks.appendChild(forkIcon);

      const forkCount = document.createElement("span");
      forkCount.textContent = project.forks;
      forks.appendChild(forkCount);

      statsRow.appendChild(forks);
    }

    card.appendChild(statsRow);
  }

  return card;
}

function displayContent(containerOrId, items) {
  displayItems(containerOrId, items, {
    type: "content",
    emptyMessage: "No items to display yet."
  });
}

function displayTweets(containerOrId, items, handle) {
  displayItems(containerOrId, items, {
    type: "tweets",
    emptyMessage: "No tweets to display yet.",
    handle: handle,
    containerClass: "tweet-grid"
  });
}

function createTweetCard(item, handle) {
  const card = document.createElement("a");
  card.className = item.pinned ? "tweet-card pinned" : "tweet-card";
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  // Note: item.image metadata is preserved but not displayed for tweet cards

  // Header with X logo and handle
  const header = document.createElement("div");
  header.className = "tweet-header";

  const handleEl = document.createElement("div");
  handleEl.className = "tweet-handle";
  handleEl.textContent = `@${handle}`;
  header.appendChild(handleEl);

  const date = document.createElement("span");
  date.className = "tweet-date";
  date.textContent = formatDate(item.date);
  header.appendChild(date);

  card.appendChild(header);

  const isNew = isWithinDays(item.date, 30);
  if (isNew || item.pinned) {
    const badgeRow = document.createElement("div");
    badgeRow.className = "card-badge-row";

    if (item.pinned) {
      const pinnedBadge = document.createElement("span");
      pinnedBadge.className = "pinned-badge";
      pinnedBadge.textContent = "Pinned";
      badgeRow.appendChild(pinnedBadge);
    }

    if (isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "new-badge";
      newBadge.textContent = "New";
      badgeRow.appendChild(newBadge);
    }

    card.appendChild(badgeRow);
  }

  // Tweet content
  const content = document.createElement("div");
  content.className = "tweet-content";

  const textEl = document.createElement("p");
  textEl.className = "tweet-text";

  // Truncate to 280 characters
  let tweetText = item.text || item.title;
  const isTruncated = tweetText.length > 280;
  if (isTruncated) {
    tweetText = tweetText.substring(0, 280).trim() + "...";
  }

  // Parse @mentions and create styled spans
  const parts = tweetText.split(/(@\w+)/g);
  parts.forEach((part) => {
    if (part.startsWith("@")) {
      const mention = document.createElement("span");
      mention.className = "tweet-mention";
      mention.textContent = part;
      textEl.appendChild(mention);
    } else {
      textEl.appendChild(document.createTextNode(part));
    }
  });

  content.appendChild(textEl);
  card.appendChild(content);

  // Stats row (retweets, likes, bookmarks) - outside content so it pins to bottom
  if (item.retweets !== undefined || item.likes !== undefined || item.bookmarks !== undefined) {
    const stats = document.createElement("div");
    stats.className = "tweet-stats";

    if (item.retweets !== undefined) {
      const stat = document.createElement("span");
      stat.className = "tweet-stat";
      stat.appendChild(createIconElement("retweet"));
      stat.appendChild(document.createTextNode(item.retweets.toLocaleString()));
      stats.appendChild(stat);
    }
    if (item.likes !== undefined) {
      const stat = document.createElement("span");
      stat.className = "tweet-stat";
      stat.appendChild(createIconElement("heart"));
      stat.appendChild(document.createTextNode(item.likes.toLocaleString()));
      stats.appendChild(stat);
    }
    if (item.bookmarks !== undefined) {
      const stat = document.createElement("span");
      stat.className = "tweet-stat";
      stat.appendChild(createIconElement("bookmark"));
      stat.appendChild(document.createTextNode(item.bookmarks.toLocaleString()));
      stats.appendChild(stat);
    }

    card.appendChild(stats);
  }

  return card;
}

function createContentCard(item) {
  const card = document.createElement("a");
  card.className = item.pinned ? "content-card pinned" : "content-card";
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const isNew = isWithinDays(item.date, 30);
  const hasBadges = isNew || item.pinned;

  if (item.thumbnail) {
    const thumbWrapper = document.createElement("div");
    thumbWrapper.className = "thumbnail-wrapper";

    const thumb = document.createElement("img");
    thumb.className = "thumbnail";
    thumb.src = item.thumbnail;
    thumb.alt = item.title;
    thumb.loading = "lazy";
    thumb.referrerPolicy = "no-referrer";
    thumbWrapper.appendChild(thumb);

    if (hasBadges) {
      const badgeContainer = document.createElement("div");
      badgeContainer.className = "card-badge-overlay";

      if (item.pinned) {
        const pinnedBadge = document.createElement("span");
        pinnedBadge.className = "pinned-badge";
        pinnedBadge.textContent = "Pinned";
        badgeContainer.appendChild(pinnedBadge);
      }

      if (isNew) {
        const newBadge = document.createElement("span");
        newBadge.className = "new-badge";
        newBadge.textContent = "New";
        badgeContainer.appendChild(newBadge);
      }

      thumbWrapper.appendChild(badgeContainer);
    }

    card.appendChild(thumbWrapper);
  }

  const metaRow = document.createElement("div");
  metaRow.className = "card-meta-row";

  const metaLeft = document.createElement("div");
  metaLeft.className = "card-meta-left";

  const date = document.createElement("span");
  date.className = "date";
  date.textContent = formatDate(item.date);
  metaLeft.appendChild(date);

  // Show badges in meta row only if there's no thumbnail
  if (!item.thumbnail && hasBadges) {
    if (item.pinned) {
      const pinnedBadge = document.createElement("span");
      pinnedBadge.className = "pinned-badge";
      pinnedBadge.textContent = "Pinned";
      metaLeft.appendChild(pinnedBadge);
    }

    if (isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "new-badge";
      newBadge.textContent = "New";
      metaLeft.appendChild(newBadge);
    }
  }

  metaRow.appendChild(metaLeft);

  if (item.source) {
    const source = document.createElement("span");
    source.className = "source";
    source.textContent = item.source;
    metaRow.appendChild(source);
  }

  card.appendChild(metaRow);

  const title = document.createElement("h3");
  title.textContent = item.title;
  card.appendChild(title);

  if (item.authors && item.authors.length > 0) {
    const authors = document.createElement("div");
    authors.className = "authors";
    authors.textContent = item.authors.join(", ");
    card.appendChild(authors);
  }

  if (
    item.retweets !== undefined ||
    item.likes !== undefined ||
    item.bookmarks !== undefined
  ) {
    const statsRow = document.createElement("div");
    statsRow.className = "tweet-stats";

    if (item.retweets !== undefined) {
      const retweets = document.createElement("span");
      retweets.className = "tweet-stat";
      const retweetIcon = document.createElement("span");
      retweetIcon.className = "tweet-stat-icon";
      setTrustedHTML(retweetIcon, ICONS.retweet);
      retweets.appendChild(retweetIcon);
      retweets.appendChild(
        document.createTextNode(item.retweets.toLocaleString()),
      );
      statsRow.appendChild(retweets);
    }

    if (item.likes !== undefined) {
      const likes = document.createElement("span");
      likes.className = "tweet-stat";
      const likeIcon = document.createElement("span");
      likeIcon.className = "tweet-stat-icon";
      setTrustedHTML(likeIcon, ICONS.heart);
      likes.appendChild(likeIcon);
      likes.appendChild(document.createTextNode(item.likes.toLocaleString()));
      statsRow.appendChild(likes);
    }

    if (item.bookmarks !== undefined) {
      const bookmarks = document.createElement("span");
      bookmarks.className = "tweet-stat";
      const bookmarkIcon = document.createElement("span");
      bookmarkIcon.className = "tweet-stat-icon";
      setTrustedHTML(bookmarkIcon, ICONS.bookmark);
      bookmarks.appendChild(bookmarkIcon);
      bookmarks.appendChild(
        document.createTextNode(item.bookmarks.toLocaleString()),
      );
      statsRow.appendChild(bookmarks);
    }

    card.appendChild(statsRow);
  }

  if (item.description && item.description.trim()) {
    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = item.description;
    card.appendChild(desc);
  }

  return card;
}

/* =============================================================================
   7. UI UTILITIES
   ============================================================================= */

function initCarouselScrollDetection(carousel) {
  const wrapper = document.createElement("div");
  wrapper.className = "content-grid-wrapper";
  carousel.parentNode.insertBefore(wrapper, carousel);
  wrapper.appendChild(carousel);

  function updateScrollIndicators() {
    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    const hasOverflowRight = scrollLeft < scrollWidth - clientWidth - 10;

    wrapper.classList.toggle("has-overflow-right", hasOverflowRight);
  }

  requestAnimationFrame(updateScrollIndicators);
  carousel.addEventListener("scroll", updateScrollIndicators, { passive: true });
  window.addEventListener("resize", updateScrollIndicators, { passive: true });
}

function displayEmptyState(container, message) {
  const empty = document.createElement("p");
  empty.textContent = message;
  empty.style.color = "var(--text-muted)";
  empty.style.fontStyle = "italic";
  container.appendChild(empty);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isWithinDays(dateString, days) {
  const [year, month, day] = dateString.split("-");
  const itemDate = new Date(year, month - 1, day);
  const now = new Date();
  const diffTime = now - itemDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= 0;
}

function sortByDate(items) {
  return items.sort((a, b) => {
    // Pinned items come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    const [yearA, monthA, dayA] = a.date.split("-");
    const [yearB, monthB, dayB] = b.date.split("-");
    return (
      new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA)
    );
  });
}

/* =============================================================================
   8. INTERACTIVITY
   ============================================================================= */

function initThemeSwitcher() {
  const buttons = document.querySelectorAll(".theme-btn");
  const savedTheme = localStorage.getItem("theme") || "driveline";
  const themeColors = {
    driveline: "#0a0a0a",
    hopkins: "#0a0e1a",
    mets: "#0a1428",
    phillies: "#120a0c",
  };

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColors[theme] || themeColors.hopkins);
    }
    // iOS 26 Safari samples body background-color for toolbar tint (ignores theme-color meta)
    document.body.style.backgroundColor = themeColors[theme] || themeColors.hopkins;

    // Update headshots based on theme
    if (siteConfig && siteConfig.profile.headshots) {
      const headshot = siteConfig.profile.headshots[theme] || siteConfig.profile.headshot;
      document.querySelectorAll(".hero-headshot, .logo-headshot").forEach((img) => {
        img.src = headshot;
      });
    }
  }

  applyTheme(savedTheme);

  buttons.forEach((btn) => {
    if (btn.dataset.theme === savedTheme) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
      localStorage.setItem("theme", theme);

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function initScrollReveal() {
  const sections = document.querySelectorAll(".content-section");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        } else {
          const rect = entry.target.getBoundingClientRect();
          if (rect.top > 0) {
            entry.target.classList.remove("revealed");
          }
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

function initNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  const header = document.querySelector("header");
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a[data-section]");

  function updateOnScroll() {
    const scrollPos = window.scrollY;

    if (header) {
      const firstContentSection = document.querySelector(
        "section.content-section",
      );
      let threshold = 400;
      if (firstContentSection) {
        threshold = firstContentSection.offsetTop - 100;
      }

      if (scrollPos > threshold) {
        header.classList.add("visible");
      } else {
        header.classList.remove("visible");
      }
    }

    const navOffset = scrollPos + 150;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute("id");

      if (navOffset >= top && navOffset < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("data-section") === id) {
            link.classList.add("active");
          }
        });
      }
    });
  }

  window.addEventListener("scroll", updateOnScroll, { passive: true });
  window.addEventListener("load", updateOnScroll);
  updateOnScroll();
}

/* =============================================================================
   9. INITIALIZATION
   ============================================================================= */

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
  } catch (error) {
    console.error("Error initializing site:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("resume-page")) {
    initSite();
  }
});
