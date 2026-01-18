import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { displayEmptyState, initCarouselScrollDetection } from "../../src/ui.js";

describe("displayEmptyState", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("appends a paragraph with the message", () => {
    displayEmptyState(container, "No items found");

    const p = container.querySelector("p");
    expect(p).not.toBeNull();
    expect(p.textContent).toBe("No items found");
  });

  it("sets muted text color", () => {
    displayEmptyState(container, "Empty");

    const p = container.querySelector("p");
    expect(p.style.color).toBe("var(--text-muted)");
  });

  it("sets italic font style", () => {
    displayEmptyState(container, "Empty");

    const p = container.querySelector("p");
    expect(p.style.fontStyle).toBe("italic");
  });

  it("can add multiple empty states", () => {
    displayEmptyState(container, "First");
    displayEmptyState(container, "Second");

    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(2);
  });
});

describe("initCarouselScrollDetection", () => {
  let carousel;

  beforeEach(() => {
    carousel = document.createElement("div");
    carousel.className = "content-grid";
    const parent = document.createElement("div");
    parent.appendChild(carousel);
    document.body.appendChild(parent);
  });

  afterEach(() => {
    if (carousel.parentNode) {
      const wrapper = carousel.closest(".content-grid-wrapper");
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      } else if (carousel.parentNode.parentNode) {
        carousel.parentNode.parentNode.removeChild(carousel.parentNode);
      }
    }
  });

  it("wraps carousel in a wrapper element", () => {
    initCarouselScrollDetection(carousel);

    const wrapper = carousel.parentNode;
    expect(wrapper.className).toBe("content-grid-wrapper");
  });

  it("maintains carousel in DOM hierarchy", () => {
    initCarouselScrollDetection(carousel);

    expect(document.body.contains(carousel)).toBe(true);
  });

  it("wrapper contains the carousel as child", () => {
    initCarouselScrollDetection(carousel);

    const wrapper = carousel.parentNode;
    expect(wrapper.contains(carousel)).toBe(true);
  });
});
