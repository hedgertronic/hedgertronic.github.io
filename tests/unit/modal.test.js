import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createModalController, bindModalTrigger } from "../../src/modal.js";

describe("modal lifecycle", () => {
  let opener;
  let modal;
  let closeButton;
  let nextButton;
  let controller;
  let onClose;

  beforeEach(() => {
    document.body.innerHTML = '<main><button>Open</button></main><aside inert></aside>';
    document.querySelector("aside").inert = true;
    opener = document.querySelector("button");
    opener.focus();
    modal = document.createElement("div");
    modal.innerHTML = '<button>×</button><button>Next</button><button hidden>Hidden</button>';
    document.body.appendChild(modal);
    [closeButton, nextButton] = modal.querySelectorAll("button");
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}]);
    onClose = vi.fn();
    controller = createModalController({ modal, closeButton, label: "Test viewer", onClose });
  });

  afterEach(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("projects closed/open state into dialog semantics, focus, and scroll locking", () => {
    expect(modal.dataset.state).toBe("closed");
    expect(modal.getAttribute("aria-hidden")).toBe("true");
    controller.open();
    expect(modal.dataset.state).toBe("open");
    expect(modal.getAttribute("role")).toBe("dialog");
    expect(modal.getAttribute("aria-modal")).toBe("true");
    expect(modal.getAttribute("aria-label")).toBe("Test viewer");
    expect(modal.getAttribute("aria-hidden")).toBe("false");
    expect(document.activeElement).toBe(closeButton);
    expect(document.querySelector("main").inert).toBe(true);
    expect(document.body.classList.contains("modal-open")).toBe(true);
    controller.close();
    expect(modal.dataset.state).toBe("closed");
    expect(modal.inert).toBe(true);
    expect(document.activeElement).toBe(opener);
    expect(document.querySelector("main").inert).toBe(false);
    expect(document.querySelector("aside").hasAttribute("inert")).toBe(true);
    expect(document.querySelector("aside").inert).toBe(true);
    expect(document.body.classList.contains("modal-open")).toBe(false);
    expect(document.documentElement.classList.contains("modal-open")).toBe(false);
  });

  it("repeated open and close preserve the opener and run close effects once", () => {
    controller.close();
    controller.open();
    controller.open();
    closeButton.click();
    controller.close();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it("wraps Tab in both directions and redirects focus from the background", () => {
    controller.open();
    closeButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(nextButton);
    nextButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(closeButton);
    opener.focus();
    expect(document.activeElement).toBe(closeButton);
  });

  it("opening a second modal closes the first without leaving scroll locked after dismissal", () => {
    const secondModal = document.createElement("div");
    const secondClose = document.createElement("button");
    secondModal.appendChild(secondClose);
    document.body.appendChild(secondModal);
    const second = createModalController({ modal: secondModal, closeButton: secondClose, label: "Second" });
    controller.open();
    second.open();
    expect(modal.dataset.state).toBe("closed");
    expect(secondModal.dataset.state).toBe("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    controller.close();
    expect(document.body.classList.contains("modal-open")).toBe(true);
    second.close();
    expect(document.activeElement).toBe(opener);
    expect(document.body.classList.contains("modal-open")).toBe(false);
    expect(document.querySelector("main").inert).toBe(false);
  });

  it("ignores keyboard commands while closed and handles Escape only while open", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).not.toHaveBeenCalled();
    controller.open();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it("activates card triggers with click, Enter, and Space", () => {
    const card = document.createElement("div");
    const open = vi.fn();
    bindModalTrigger(card, open, "View comparison");
    expect(card.getAttribute("role")).toBe("button");
    expect(card.getAttribute("aria-label")).toBe("View comparison");
    expect(card.tabIndex).toBe(0);
    card.click();
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    card.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(open).toHaveBeenCalledTimes(3);
  });
});
