/**
 * Evolution page top-level helpers: config loading and hero nav rendering.
 *
 * Chart and arsenal logic: evolution-charts.js
 * Subsection renderers and section dispatch: evolution-subsections.js
 */

import { buildHeroNavItem } from "./ui.js";

export async function loadEvolutionConfig() {
  const response = await fetch("/data/evolution.json");
  if (!response.ok) throw new Error("Failed to load evolution config");
  return response.json();
}

export function renderEvolutionHeroNav(heroNav, sections) {
  sections.forEach((section) => {
    heroNav.appendChild(buildHeroNavItem(section));
  });
}
