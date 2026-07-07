/**
 * UI utility functions.
 */

import { createElement, createIconElement } from "./dom.js";

/**
 * Builds a single `.hero-nav-item` anchor element.
 *
 * Used by both the homepage hero and the evolution-page hero so the markup
 * stays in sync. The caller passes an optional `label` override; when omitted
 * the section's `title` is used directly.
 *
 * @param {object} section - Section config object (id, accentColor, icon, title, subtitle)
 * @param {object} [options]
 * @param {string} [options.label] - Override displayed label text
 * @returns {HTMLAnchorElement}
 */
export function buildHeroNavItem(section, { label } = {}) {
  const navLink = createElement("a", {
    href: `#${section.id}`,
    className: "hero-nav-item",
  });
  navLink.dataset.section = section.id;
  navLink.style.setProperty("--section-accent", section.accentColor || "var(--accent-primary)");

  if (section.icon) {
    const iconDiv = createElement("div", { className: "hero-nav-icon" });
    iconDiv.appendChild(createIconElement(section.icon));
    navLink.appendChild(iconDiv);
  }

  const textDiv = createElement("div", { className: "hero-nav-text" });
  textDiv.appendChild(
    createElement("span", {
      className: "hero-nav-label",
      textContent: label || section.title,
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
      textContent: "↓",
    }),
  );

  return navLink;
}

export function initCarouselScrollDetection(carousel) {
  const wrapper = document.createElement("div");
  wrapper.className = "content-grid-wrapper";
  carousel.parentNode.insertBefore(wrapper, carousel);
  wrapper.appendChild(carousel);

  function updateScrollIndicators() {
    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    // 2px tolerance avoids false positives from sub-pixel rounding
    const hasScroll = scrollWidth > clientWidth + 2;
    const hasOverflowRight = hasScroll && scrollLeft < scrollWidth - clientWidth - 10;
    // 24px: iOS scroll-snap settles carousels at ~16px (scroll-padding-left),
    // which must not count as "scrolled away from the start"
    const hasOverflowLeft = hasScroll && scrollLeft > 24;

    wrapper.classList.toggle("has-overflow-right", hasOverflowRight);
    wrapper.classList.toggle("has-overflow-left", hasOverflowLeft);
  }

  // Defer initial layout read until after paint to avoid forced reflow
  setTimeout(updateScrollIndicators, 0);
  carousel.addEventListener("scroll", updateScrollIndicators, { passive: true });
  window.addEventListener("resize", updateScrollIndicators, { passive: true });
}

/**
 * Creates a lightweight video facade (poster image + play button) that defers
 * iframe loading until the user clicks. On click, either fires an onClick
 * callback (e.g. to open a modal) or swaps in a live iframe with autoplay=1.
 *
 * For YouTube: poster resolves to a local file at
 *   /assets/images/youtube/<videoId>.jpg if present, else ytimg.com hqdefault.
 * For Vimeo: poster resolves to vumbnail.com; falls back to styled placeholder.
 *
 * @param {object} config
 * @param {string}   config.videoId   YouTube or Vimeo video ID.
 * @param {boolean}  [config.isVimeo] True for Vimeo, false/omit for YouTube.
 * @param {string}   [config.title]   Used for aria-label and alt text.
 * @param {function} [config.onClick] Optional callback fired on click instead
 *                                    of swapping in an iframe.
 */
export function createVideoFacade({ videoId, isVimeo = false, title = "", onClick = null }) {
  const facade = document.createElement("div");
  facade.className = "video-facade";

  // Poster image
  const posterEl = document.createElement("img");
  posterEl.className = "video-facade-poster";
  posterEl.alt = title;
  posterEl.loading = "lazy";

  if (isVimeo) {
    // vumbnail.com is a community CDN that proxies Vimeo thumbnails
    posterEl.src = `https://vumbnail.com/${videoId}.jpg`;
    posterEl.onerror = () => {
      posterEl.onerror = null;
      facade.classList.add("video-facade--no-poster");
    };
  } else {
    // YouTube: try local file first, fall back to ytimg.com
    posterEl.src = `/assets/images/youtube/${videoId}.jpg`;
    posterEl.onerror = () => {
      posterEl.onerror = null;
      posterEl.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    };
  }
  facade.appendChild(posterEl);

  // Play button (keyboard-accessible button element)
  const playBtn = document.createElement("button");
  playBtn.className = "video-facade-play";
  playBtn.type = "button";
  playBtn.setAttribute("aria-label", title ? `Play ${title}` : "Play video");
  // SVG play triangle — inline so no external request
  playBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M8 5v14l11-7z"/>' +
    "</svg>";
  facade.appendChild(playBtn);

  // Shared click handler: call callback or swap to live iframe
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    // Swap facade for a live iframe with autoplay
    const iframe = document.createElement("iframe");
    if (isVimeo) {
      iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1`;
    } else {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    );
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("title", title);
    const parent = facade.parentNode;
    if (parent) parent.replaceChild(iframe, facade);
  };

  // Both the wrapper div and the button fire the same handler;
  // stopPropagation on the button prevents double-firing.
  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleClick();
  });
  facade.addEventListener("click", handleClick);

  return facade;
}

/**
 * Creates a reusable video modal supporting single-video and navigable multi-item layouts.
 *
 * Two structural modes controlled by `navigable`:
 *   true  — nav buttons (prev/next), ArrowLeft/Right keyboard nav, content-click-to-close,
 *            close button inside the media wrapper. Used for progression and hero modals.
 *   false — single video, close button as direct child of content, Escape only. Used for
 *            simple section video modals.
 *
 * @param {object} config
 * @param {string}   [config.variant]          CSS modifier: "vertical" | "progression" | "".
 * @param {Array}    config.items              Items to navigate through.
 * @param {function} config.buildMedia         (index, wrapper) => { type, element }
 *                                             Called lazily on first access; must append element
 *                                             to wrapper and return { type: "image"|"video", element }.
 * @param {function} [config.buildLabel]       (index, labelEl) => void — omit to skip label row.
 * @param {function} [config.buildDescription] (index) => string|null — omit to skip description row.
 * @param {boolean}  [config.navigable]        True → nav buttons, ArrowLeft/Right, content-click-close,
 *                                             close inside wrapper. Default false.
 * @returns {{ open(index?: number): void, close(): void }}
 */
export function createVideoModal({
  variant = "",
  items,
  buildMedia,
  buildLabel = null,
  buildDescription = null,
  navigable = false,
}) {
  const mediaCache = [];
  let currentIndex = 0;

  // Modal skeleton
  const modal = createElement("div", { className: "video-modal" });
  const backdrop = createElement("div", { className: "video-modal-backdrop" });
  const contentClass = variant
    ? `video-modal-content video-modal-content--${variant}`
    : "video-modal-content";
  const content = createElement("div", { className: contentClass });

  const closeBtn = createElement("button", {
    className: "video-modal-close",
    textContent: "×",
  });
  const wrapper = createElement("div", { className: "video-modal-wrapper" });

  let labelEl = null;
  let descriptionEl = null;
  let prevBtn = null;
  let nextBtn = null;
  let body = null;

  if (navigable) {
    // Navigable layout: [label] + body(prev + wrapper[+close] + next) + [description]
    if (buildLabel) {
      labelEl = createElement("div", { className: "video-modal-label" });
      content.appendChild(labelEl);
    }
    body = createElement("div", { className: "video-modal-body" });
    prevBtn = createElement("button", {
      className: "video-modal-nav video-modal-nav--prev",
      textContent: "‹",
    });
    nextBtn = createElement("button", {
      className: "video-modal-nav video-modal-nav--next",
      textContent: "›",
    });
    wrapper.appendChild(closeBtn);
    body.appendChild(prevBtn);
    body.appendChild(wrapper);
    body.appendChild(nextBtn);
    content.appendChild(body);
    if (buildDescription) {
      descriptionEl = createElement("p", { className: "video-modal-description" });
      content.appendChild(descriptionEl);
    }
  } else {
    // Single-video layout: close + wrapper directly in content
    content.appendChild(closeBtn);
    content.appendChild(wrapper);
  }

  modal.appendChild(backdrop);
  modal.appendChild(content);

  // Media management — lazy creation, cached by index
  const getOrCreate = (index) => {
    if (!mediaCache[index]) {
      mediaCache[index] = buildMedia(index, wrapper);
    }
    return mediaCache[index];
  };

  const postToFrame = (iframe, method) => {
    // contentWindow may be null for detached or sandboxed iframes
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({ method }), "*");
    }
  };

  const showAt = (index) => {
    // Pause and hide all cached items except the target
    mediaCache.forEach((m, i) => {
      if (m) {
        m.element.style.display = i === index ? "block" : "none";
        if (i !== index && m.type === "video") postToFrame(m.element, "pause");
      }
    });
    // Ensure target is created, visible, and playing
    const m = getOrCreate(index);
    m.element.style.display = "block";
    if (m.type === "video") postToFrame(m.element, "play");
  };

  const updateNavButtons = (index) => {
    if (prevBtn) prevBtn.style.display = index === 0 ? "none" : "flex";
    if (nextBtn) nextBtn.style.display = index === items.length - 1 ? "none" : "flex";
  };

  const update = (index) => {
    currentIndex = index;
    if (labelEl && buildLabel) buildLabel(index, labelEl);
    if (descriptionEl && buildDescription) {
      const desc = buildDescription(index);
      descriptionEl.textContent = desc || "";
      descriptionEl.style.display = desc ? "block" : "none";
    }
    showAt(index);
    updateNavButtons(index);
  };

  const close = () => {
    modal.classList.remove("active");
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    const m = mediaCache[currentIndex];
    if (m && m.type === "video") postToFrame(m.element, "pause");
  };

  const open = (index = 0) => {
    currentIndex = index;
    // Pre-create current media before activating the modal
    getOrCreate(index);
    if (navigable) {
      update(index);
    } else {
      showAt(index);
    }
    modal.classList.add("active");
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
  };

  // Event wiring
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  if (navigable) {
    // Clicking the content background (outside body/wrapper) also closes
    content.addEventListener("click", (e) => {
      if (e.target === content || e.target === body) close();
    });
    prevBtn.addEventListener("click", () => {
      if (currentIndex > 0) update(currentIndex - 1);
    });
    nextBtn.addEventListener("click", () => {
      if (currentIndex < items.length - 1) update(currentIndex + 1);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") close();
    if (navigable) {
      if (e.key === "ArrowLeft" && currentIndex > 0) update(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < items.length - 1) update(currentIndex + 1);
    }
  });

  document.body.appendChild(modal);

  return { open, close };
}

export function displayEmptyState(container, message) {
  const empty = document.createElement("p");
  empty.textContent = message;
  empty.style.color = "var(--text-muted)";
  empty.style.fontStyle = "italic";
  container.appendChild(empty);
}

export function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isWithinDays(dateString, days) {
  const [year, month, day] = dateString.split("-");
  const itemDate = new Date(year, month - 1, day);
  const now = new Date();
  const diffTime = now - itemDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= 0;
}

export function sortByDate(items) {
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
