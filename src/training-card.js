/**
 * Shared helpers for training/tweet card caption rendering.
 *
 * Covers: word-boundary truncation and @mention span splitting, which are
 * identical across sections.js, evolution-components.js, and cards.js.
 */

/**
 * Truncates text to at most `limit` characters, breaking at the last space
 * before the limit. Appends "..." when truncation occurs. Falls back to a
 * hard cut if no space exists in the window.
 *
 * @param {string} text
 * @param {number} [limit=280]
 * @returns {string}
 */
export function truncateCaption(text, limit = 280) {
  if (text.length <= limit) return text;
  const window = text.substring(0, limit);
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace > 0 ? lastSpace : limit;
  return text.substring(0, cut).trim() + "...";
}

/**
 * Populates a caption element with truncated text, marking @mention tokens
 * with a styled span.
 *
 * @param {HTMLElement} element - Target element to append text nodes / spans into
 * @param {string} text - Raw caption text
 * @param {string} mentionClass - CSS class for @mention spans
 * @param {number} [limit=280]
 */
export function renderCaption(element, text, mentionClass, limit = 280) {
  const truncated = truncateCaption(text, limit);
  const parts = truncated.split(/(@\w+)/g);
  parts.forEach((part) => {
    if (part.startsWith("@")) {
      const span = document.createElement("span");
      span.className = mentionClass;
      span.textContent = part;
      element.appendChild(span);
    } else {
      element.appendChild(document.createTextNode(part));
    }
  });
}
