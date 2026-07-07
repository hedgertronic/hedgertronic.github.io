import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { displayEmptyState, initCarouselScrollDetection, createVideoFacade, createVideoModal, formatDate, isWithinDays, sortByDate } from "../../src/ui.js";

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
    vi.useFakeTimers();
    carousel = document.createElement("div");
    carousel.className = "content-grid";
    const parent = document.createElement("div");
    parent.appendChild(carousel);
    document.body.appendChild(parent);
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("does not add has-overflow-right when content fits without scrolling", () => {
    // scrollWidth <= clientWidth: no overflow
    Object.defineProperty(carousel, "scrollWidth", { value: 300, configurable: true });
    Object.defineProperty(carousel, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(carousel, "scrollLeft", { value: 0, configurable: true });

    initCarouselScrollDetection(carousel);
    // Force the indicator update (setTimeout mock)
    vi.runAllTimers();

    const wrapper = carousel.parentNode;
    expect(wrapper.classList.contains("has-overflow-right")).toBe(false);
    expect(wrapper.classList.contains("has-overflow-left")).toBe(false);
  });

  it("adds has-overflow-right at start of overflowing row", () => {
    Object.defineProperty(carousel, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(carousel, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(carousel, "scrollLeft", { value: 0, configurable: true });

    initCarouselScrollDetection(carousel);
    vi.runAllTimers();

    const wrapper = carousel.parentNode;
    expect(wrapper.classList.contains("has-overflow-right")).toBe(true);
    expect(wrapper.classList.contains("has-overflow-left")).toBe(false);
  });

  it("adds both classes when scrolled to the middle", () => {
    Object.defineProperty(carousel, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(carousel, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(carousel, "scrollLeft", { value: 250, configurable: true });

    initCarouselScrollDetection(carousel);
    vi.runAllTimers();

    const wrapper = carousel.parentNode;
    expect(wrapper.classList.contains("has-overflow-right")).toBe(true);
    expect(wrapper.classList.contains("has-overflow-left")).toBe(true);
  });

  it("adds only has-overflow-left when scrolled fully right", () => {
    Object.defineProperty(carousel, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(carousel, "clientWidth", { value: 300, configurable: true });
    // scrollLeft = scrollWidth - clientWidth = 500 (no more right overflow)
    Object.defineProperty(carousel, "scrollLeft", { value: 500, configurable: true });

    initCarouselScrollDetection(carousel);
    vi.runAllTimers();

    const wrapper = carousel.parentNode;
    expect(wrapper.classList.contains("has-overflow-right")).toBe(false);
    expect(wrapper.classList.contains("has-overflow-left")).toBe(true);
  });
});

describe("createVideoFacade", () => {
  it("returns a div with class video-facade", () => {
    const facade = createVideoFacade({ videoId: "abc123", isVimeo: false, title: "Test" });
    expect(facade.tagName).toBe("DIV");
    expect(facade.className).toBe("video-facade");
  });

  it("contains an img for the poster and a button for play", () => {
    const facade = createVideoFacade({ videoId: "abc123", isVimeo: false, title: "My Video" });
    const img = facade.querySelector("img.video-facade-poster");
    const btn = facade.querySelector("button.video-facade-play");
    expect(img).not.toBeNull();
    expect(btn).not.toBeNull();
  });

  it("sets YouTube local poster src with ytimg fallback for non-vimeo", () => {
    const facade = createVideoFacade({ videoId: "xyz789", isVimeo: false });
    const img = facade.querySelector("img.video-facade-poster");
    expect(img.src).toContain("xyz789");
  });

  it("sets vumbnail.com poster src for vimeo", () => {
    const facade = createVideoFacade({ videoId: "12345", isVimeo: true, title: "Vimeo" });
    const img = facade.querySelector("img.video-facade-poster");
    expect(img.src).toContain("vumbnail.com");
    expect(img.src).toContain("12345");
  });

  it("button aria-label includes the title", () => {
    const facade = createVideoFacade({ videoId: "abc", isVimeo: false, title: "Live At-Bats" });
    const btn = facade.querySelector("button.video-facade-play");
    expect(btn.getAttribute("aria-label")).toContain("Live At-Bats");
  });

  it("calls onClick callback on click instead of replacing with iframe", () => {
    let clicked = false;
    const facade = createVideoFacade({
      videoId: "abc",
      isVimeo: false,
      title: "",
      onClick: () => { clicked = true; },
    });
    const parent = document.createElement("div");
    parent.appendChild(facade);
    document.body.appendChild(parent);

    facade.click();
    expect(clicked).toBe(true);
    // Facade should NOT have been replaced since onClick was provided
    expect(parent.querySelector(".video-facade")).not.toBeNull();

    document.body.removeChild(parent);
  });

  it("replaces itself with an iframe on click when no onClick provided", () => {
    const facade = createVideoFacade({ videoId: "ytid", isVimeo: false, title: "" });
    const parent = document.createElement("div");
    parent.appendChild(facade);
    document.body.appendChild(parent);

    facade.click();

    const iframe = parent.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe.src).toContain("ytid");
    expect(parent.querySelector(".video-facade")).toBeNull();

    document.body.removeChild(parent);
  });

  it("uses Vimeo embed URL when isVimeo and no onClick", () => {
    const facade = createVideoFacade({ videoId: "vimeoid", isVimeo: true, title: "" });
    const parent = document.createElement("div");
    parent.appendChild(facade);
    document.body.appendChild(parent);

    facade.click();

    const iframe = parent.querySelector("iframe");
    expect(iframe.src).toContain("player.vimeo.com");
    expect(iframe.src).toContain("vimeoid");

    document.body.removeChild(parent);
  });
});

describe("formatDate", () => {
  it("formats date in US format", () => {
    expect(formatDate("2024-03-15")).toBe("Mar 15, 2024");
  });

  it("formats single-digit day correctly", () => {
    expect(formatDate("2024-01-05")).toBe("Jan 5, 2024");
  });

  it("formats December date correctly", () => {
    expect(formatDate("2023-12-25")).toBe("Dec 25, 2023");
  });
});

describe("isWithinDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for date within range", () => {
    expect(isWithinDays("2024-06-10", 7)).toBe(true);
  });

  it("returns false for date outside range", () => {
    expect(isWithinDays("2024-06-01", 7)).toBe(false);
  });

  it("returns true for today", () => {
    expect(isWithinDays("2024-06-15", 7)).toBe(true);
  });

  it("returns false for future dates", () => {
    expect(isWithinDays("2024-06-20", 7)).toBe(false);
  });
});

describe("sortByDate", () => {
  it("sorts items by date descending (newest first)", () => {
    const items = [
      { date: "2024-01-01", title: "Old" },
      { date: "2024-06-15", title: "New" },
      { date: "2024-03-10", title: "Middle" },
    ];

    const result = sortByDate(items);

    expect(result[0].title).toBe("New");
    expect(result[1].title).toBe("Middle");
    expect(result[2].title).toBe("Old");
  });

  it("puts pinned items first regardless of date", () => {
    const items = [
      { date: "2024-06-15", title: "New" },
      { date: "2024-01-01", title: "Old but pinned", pinned: true },
      { date: "2024-03-10", title: "Middle" },
    ];

    const result = sortByDate(items);

    expect(result[0].title).toBe("Old but pinned");
    expect(result[1].title).toBe("New");
    expect(result[2].title).toBe("Middle");
  });

  it("sorts in place (mutates the original array)", () => {
    const items = [
      { date: "2024-01-01", title: "A" },
      { date: "2024-06-15", title: "B" },
    ];

    sortByDate(items);

    // Production ui.js sortByDate mutates — callers rely on this behaviour
    expect(items[0].title).toBe("B");
  });
});

// ---------------------------------------------------------------------------
// createVideoModal
// ---------------------------------------------------------------------------

function makeItem(id = "v1") {
  return { vimeoId: id };
}

function makeBuildMedia(items) {
  return (index, wrapper) => {
    const el = document.createElement("iframe");
    el.src = `https://player.vimeo.com/video/${items[index].vimeoId}`;
    el.style.display = "none";
    wrapper.appendChild(el);
    return { type: "video", element: el };
  };
}

describe("createVideoModal", () => {
  afterEach(() => {
    // Remove any modals appended to body during the test
    document.querySelectorAll(".video-modal").forEach((m) => m.remove());
    // Remove all keydown listeners by replacing document (jsdom reuses same doc)
    // Vitest jsdom resets between test files, so inter-test cleanup suffices
  });

  it("appends a video-modal element to document.body", () => {
    const items = [makeItem()];
    createVideoModal({ items, buildMedia: makeBuildMedia(items) });
    expect(document.querySelector(".video-modal")).not.toBeNull();
  });

  it("modal starts inactive", () => {
    const items = [makeItem()];
    createVideoModal({ items, buildMedia: makeBuildMedia(items) });
    expect(document.querySelector(".video-modal").classList.contains("active")).toBe(false);
  });

  it("open() adds .active to modal", () => {
    const items = [makeItem()];
    const { open } = createVideoModal({ items, buildMedia: makeBuildMedia(items) });
    open(0);
    expect(document.querySelector(".video-modal").classList.contains("active")).toBe(true);
  });

  it("close() removes .active from modal", () => {
    const items = [makeItem()];
    const { open, close } = createVideoModal({ items, buildMedia: makeBuildMedia(items) });
    open(0);
    close();
    expect(document.querySelector(".video-modal").classList.contains("active")).toBe(false);
  });

  it("open() adds modal-open class to html and body", () => {
    const items = [makeItem()];
    const { open } = createVideoModal({ items, buildMedia: makeBuildMedia(items) });
    open(0);
    expect(document.documentElement.classList.contains("modal-open")).toBe(true);
    expect(document.body.classList.contains("modal-open")).toBe(true);
    // cleanup
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
  });

  it("Escape key closes the modal when active", () => {
    const items = [makeItem()];
    const { open } = createVideoModal({ items, buildMedia: makeBuildMedia(items) });
    open(0);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.querySelector(".video-modal").classList.contains("active")).toBe(false);
  });

  it("Escape key does nothing when modal is not active", () => {
    const items = [makeItem()];
    createVideoModal({ items, buildMedia: makeBuildMedia(items) });
    // Modal not open — dispatching Escape should not throw
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.querySelector(".video-modal").classList.contains("active")).toBe(false);
  });

  it("applies the correct CSS variant class", () => {
    const items = [makeItem()];
    createVideoModal({ variant: "vertical", items, buildMedia: makeBuildMedia(items) });
    const content = document.querySelector(".video-modal-content--vertical");
    expect(content).not.toBeNull();
  });

  it("no variant class when variant is empty string", () => {
    const items = [makeItem()];
    createVideoModal({ variant: "", items, buildMedia: makeBuildMedia(items) });
    expect(document.querySelector(".video-modal-content--")).toBeNull();
    expect(document.querySelector(".video-modal-content")).not.toBeNull();
  });

  describe("non-navigable (simple) modal", () => {
    it("close button is a direct child of content, not inside wrapper", () => {
      const items = [makeItem()];
      createVideoModal({ navigable: false, items, buildMedia: makeBuildMedia(items) });
      const content = document.querySelector(".video-modal-content");
      const closeBtn = content.querySelector(".video-modal-close");
      expect(closeBtn.parentElement).toBe(content);
    });

    it("ArrowLeft does not navigate (non-navigable)", () => {
      const items = [makeItem("a"), makeItem("b")];
      const { open } = createVideoModal({
        navigable: false,
        items,
        buildMedia: makeBuildMedia(items),
      });
      open(0);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      // Media index stays at 0 — only one visible iframe (the first one was created)
      const iframes = document.querySelectorAll(".video-modal-wrapper iframe");
      const visible = [...iframes].filter((f) => f.style.display !== "none");
      expect(visible.length).toBe(1);
      expect(visible[0].src).toContain("a");
    });
  });

  describe("navigable modal", () => {
    it("has prev and next nav buttons", () => {
      const items = [makeItem("a"), makeItem("b")];
      createVideoModal({ navigable: true, items, buildMedia: makeBuildMedia(items) });
      expect(document.querySelector(".video-modal-nav--prev")).not.toBeNull();
      expect(document.querySelector(".video-modal-nav--next")).not.toBeNull();
    });

    it("close button is inside the wrapper, not direct child of content", () => {
      const items = [makeItem("a"), makeItem("b")];
      createVideoModal({ navigable: true, items, buildMedia: makeBuildMedia(items) });
      const content = document.querySelector(".video-modal-content");
      const closeBtn = content.querySelector(".video-modal-close");
      // Close must NOT be a direct child of content
      expect(closeBtn.parentElement).not.toBe(content);
      // It should be inside the wrapper
      expect(document.querySelector(".video-modal-wrapper").contains(closeBtn)).toBe(true);
    });

    it("ArrowRight navigates to next item", () => {
      const items = [makeItem("a"), makeItem("b")];
      const { open } = createVideoModal({
        navigable: true,
        items,
        buildMedia: makeBuildMedia(items),
      });
      open(0);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      // After navigating, item b should be visible
      const iframes = document.querySelectorAll(".video-modal-wrapper iframe");
      const visible = [...iframes].filter((f) => f.style.display !== "none");
      expect(visible.length).toBe(1);
      expect(visible[0].src).toContain("b");
    });

    it("ArrowLeft navigates to previous item", () => {
      const items = [makeItem("a"), makeItem("b")];
      const { open } = createVideoModal({
        navigable: true,
        items,
        buildMedia: makeBuildMedia(items),
      });
      open(1);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      const iframes = document.querySelectorAll(".video-modal-wrapper iframe");
      const visible = [...iframes].filter((f) => f.style.display !== "none");
      expect(visible.length).toBe(1);
      expect(visible[0].src).toContain("a");
    });

    it("ArrowRight does nothing at last item", () => {
      const items = [makeItem("a"), makeItem("b")];
      const { open } = createVideoModal({
        navigable: true,
        items,
        buildMedia: makeBuildMedia(items),
      });
      open(1);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      const iframes = document.querySelectorAll(".video-modal-wrapper iframe");
      const visible = [...iframes].filter((f) => f.style.display !== "none");
      expect(visible[0].src).toContain("b");
    });

    it("ArrowLeft does nothing at first item", () => {
      const items = [makeItem("a"), makeItem("b")];
      const { open } = createVideoModal({
        navigable: true,
        items,
        buildMedia: makeBuildMedia(items),
      });
      open(0);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      const iframes = document.querySelectorAll(".video-modal-wrapper iframe");
      const visible = [...iframes].filter((f) => f.style.display !== "none");
      expect(visible[0].src).toContain("a");
    });

    it("buildLabel is called and populates the label element", () => {
      const items = [makeItem("a"), makeItem("b")];
      let labelCallCount = 0;
      const { open } = createVideoModal({
        navigable: true,
        items,
        buildMedia: makeBuildMedia(items),
        buildLabel: (index, labelEl) => {
          labelCallCount++;
          labelEl.textContent = `Label ${index}`;
        },
      });
      open(0);
      expect(labelCallCount).toBeGreaterThan(0);
      expect(document.querySelector(".video-modal-label").textContent).toBe("Label 0");
    });

    it("buildDescription is called and populates the description element", () => {
      const items = [makeItem("a"), makeItem("b")];
      const { open } = createVideoModal({
        navigable: true,
        items,
        buildMedia: makeBuildMedia(items),
        buildDescription: (index) => `Description ${index}`,
      });
      open(0);
      expect(document.querySelector(".video-modal-description").textContent).toBe("Description 0");
    });

    it("media is lazily created only when accessed", () => {
      const items = [makeItem("a"), makeItem("b"), makeItem("c")];
      let buildCount = 0;
      const { open } = createVideoModal({
        navigable: true,
        items,
        buildMedia: (index, wrapper) => {
          buildCount++;
          const el = document.createElement("iframe");
          el.style.display = "none";
          wrapper.appendChild(el);
          return { type: "video", element: el };
        },
      });
      open(0);
      expect(buildCount).toBe(1);
    });
  });
});
