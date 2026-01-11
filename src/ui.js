/**
 * UI utility functions.
 */

export function initCarouselScrollDetection(carousel) {
  const wrapper = document.createElement("div");
  wrapper.className = "content-grid-wrapper";
  carousel.parentNode.insertBefore(wrapper, carousel);
  wrapper.appendChild(carousel);

  function updateScrollIndicators() {
    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    const hasOverflowRight = scrollLeft < scrollWidth - clientWidth - 10;

    wrapper.classList.toggle("has-overflow-right", hasOverflowRight);
  }

  // Defer initial layout read until after paint to avoid forced reflow
  setTimeout(updateScrollIndicators, 0);
  carousel.addEventListener("scroll", updateScrollIndicators, { passive: true });
  window.addEventListener("resize", updateScrollIndicators, { passive: true });
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
