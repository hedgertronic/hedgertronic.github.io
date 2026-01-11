/**
 * DOM utility functions.
 */

import { ICONS } from "./icons.js";

export function createElement(tag, attributes = {}, children = []) {
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
export function setTrustedHTML(element, html) {
  // Note: This data comes from site owner's config files, not user input
  element.innerHTML = html;
}

// Helper to create icon element from registry
export function createIconElement(name) {
  const span = document.createElement("span");
  span.className = "icon-wrapper";
  setTrustedHTML(span, ICONS[name] || "");
  return span;
}
