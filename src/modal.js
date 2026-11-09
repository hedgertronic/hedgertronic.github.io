/** Shared closed/open lifecycle for the site's media dialogs. */
let activeModal = null;

export function createModalController({ modal, closeButton, label, onClose, onKeydown }) {
  let state = "closed";
  let opener = null;
  const background = new Map();

  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", label);
  modal.tabIndex = -1;
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close dialog");

  function render() {
    const isOpen = state === "open";
    modal.dataset.state = state;
    modal.classList.toggle("active", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
    modal.inert = !isOpen;
  }

  function focusableElements() {
    return [...modal.querySelectorAll('button, a[href], input, select, textarea, iframe, [tabindex]')]
      .filter((element) => element.tabIndex >= 0 && !element.disabled &&
        !element.closest('[hidden], [inert]') && element.getClientRects().length > 0);
  }

  function keepFocusInside(event) {
    if (!modal.contains(event.target)) closeButton.focus({ preventScroll: true });
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      const elements = focusableElements();
      const first = elements[0] || modal;
      const last = elements[elements.length - 1] || modal;
      if (!modal.contains(document.activeElement) || document.activeElement === modal ||
          (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    } else {
      onKeydown?.(event);
    }
  }

  function close({ restoreFocus = true } = {}) {
    if (state === "closed") return;
    state = "closed";
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("focusin", keepFocusInside);
    background.forEach((inert, element) => { element.inert = inert; });
    background.clear();
    activeModal = null;
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    // Move focus before hiding the dialog from assistive technology.
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    render();
    onClose?.();
  }

  function open() {
    if (state === "open") return;
    const nextOpener = activeModal ? activeModal.opener : document.activeElement;
    activeModal?.close({ restoreFocus: false });
    opener = nextOpener;
    state = "open";
    activeModal = { close, opener };
    render();
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    closeButton.focus({ preventScroll: true });
    for (const element of document.body.children) {
      if (element !== modal) {
        background.set(element, Boolean(element.inert));
        element.inert = true;
      }
    }
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("focusin", keepFocusInside);
  }

  closeButton.addEventListener("click", () => close());
  render();
  return { open, close };
}

/** Gives image/card modal triggers the same keyboard activation as buttons. */
export function bindModalTrigger(element, open, label) {
  element.setAttribute("role", "button");
  element.setAttribute("aria-haspopup", "dialog");
  element.setAttribute("aria-label", label);
  element.tabIndex = 0;
  element.addEventListener("click", open);
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
}
