/**
 * Shared keyboard-accessible theme picker dropdown.
 *
 * Owns no persistence — callers pass onSelect and getActive.
 */

import { createElement } from "./dom.js";

/** Round dot showing a theme's primary color, split diagonally with its secondary. */
function buildSwatch(color, secondary) {
  const swatch = createElement("span", { className: "theme-menu-swatch" });
  swatch.style.setProperty("--swatch-color", color);
  swatch.style.setProperty("--swatch-color-2", secondary || color);
  return swatch;
}

/**
 * Attaches a keyboard-accessible theme listbox to container.
 *
 * The trigger button (already in container) is enhanced with aria attributes
 * and click/keyboard handlers. A hidden listbox is appended to container and
 * shown/hidden on demand. Escape closes; ArrowUp/Down navigate; Enter/Space
 * select; Tab closes and moves focus away.
 *
 * @param {HTMLElement} container - Wrapper with position:relative (set by CSS)
 * @param {object} options
 * @param {HTMLButtonElement} options.trigger - Pre-existing button to act as control
 * @param {Array<{id: string, label: string, color: string, secondary?: string}>} options.themes
 * @param {function(id: string): void} options.onSelect
 * @param {function(): string} options.getActive - Returns currently active theme id
 * @returns {{ syncActive: function(): void }}
 */
export function buildThemeDropdown(container, { trigger, themes, onSelect, getActive }) {
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const menu = createElement("div", { className: "theme-menu" });
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Choose team color theme");
  menu.hidden = true;

  themes.forEach(({ id, label, color, secondary }) => {
    const option = createElement("button", {
      className: "theme-menu-option",
      type: "button",
    });
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.dataset.theme = id;
    option.tabIndex = -1;

    option.appendChild(buildSwatch(color, secondary));
    option.appendChild(createElement("span", { textContent: label }));

    option.addEventListener("click", () => {
      onSelect(id);
      close();
    });

    menu.appendChild(option);
  });

  container.appendChild(menu);

  let focusIdx = -1;

  function getOptions() {
    return [...menu.querySelectorAll("[data-theme]")];
  }

  function open() {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    syncActive();
    const active = getActive();
    const opts = getOptions();
    const idx = opts.findIndex((o) => o.dataset.theme === active);
    focusIdx = idx >= 0 ? idx : 0;
    opts[focusIdx]?.focus();
  }

  function close() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
    focusIdx = -1;
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.hidden) {
      open();
    } else {
      close();
    }
  });

  trigger.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") && menu.hidden) {
      e.preventDefault();
      open();
    }
  });

  menu.addEventListener("keydown", (e) => {
    const opts = getOptions();
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusIdx = Math.min(focusIdx + 1, opts.length - 1);
      opts[focusIdx]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (focusIdx <= 0) {
        close();
        return;
      }
      focusIdx -= 1;
      opts[focusIdx]?.focus();
    } else if (e.key === "Tab") {
      close();
    }
  });

  // Close when focus moves completely outside the container
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !container.contains(e.target)) {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      focusIdx = -1;
    }
  });

  function syncActive() {
    const active = getActive();

    // Update trigger button: color swatch dot + theme label + chevron
    const activeTheme = themes.find((t) => t.id === active);
    if (activeTheme) {
      trigger.textContent = "";
      const dot = buildSwatch(activeTheme.color, activeTheme.secondary);
      dot.setAttribute("aria-hidden", "true");
      trigger.appendChild(dot);
      trigger.appendChild(createElement("span", { textContent: activeTheme.label }));
      trigger.appendChild(createElement("span", { textContent: "▾" }));
    }

    // Update dropdown option active states
    getOptions().forEach((opt) => {
      const isActive = opt.dataset.theme === active;
      opt.setAttribute("aria-selected", isActive ? "true" : "false");
      opt.classList.toggle("active", isActive);
    });
  }

  return { syncActive };
}
