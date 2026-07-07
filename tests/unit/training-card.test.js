import { describe, it, expect, beforeEach } from "vitest";
import { truncateCaption, renderCaption } from "../../src/training-card.js";

describe("truncateCaption", () => {
  it("returns the text unchanged when under the limit", () => {
    expect(truncateCaption("hello world", 280)).toBe("hello world");
  });

  it("returns the text unchanged when exactly at the limit", () => {
    const text = "a".repeat(280);
    expect(truncateCaption(text, 280)).toBe(text);
  });

  it("truncates at the last space before the limit", () => {
    // "with very" is 9 chars; the word after the space would be cut mid-word
    const text = "with very longword";
    const result = truncateCaption(text, 14);
    // The window is "with very long" (14 chars); last space is at index 9
    expect(result).toBe("with very...");
    expect(result.endsWith("...")).toBe(true);
  });

  it("falls back to hard cut when no space exists in the window", () => {
    const result = truncateCaption("abcdefghij", 5);
    expect(result).toBe("abcde...");
  });

  it("breaks at a word boundary, not mid-word", () => {
    // "with very" is 9 chars; char 10 starts "lo" in "longword"
    const text = "with very longword extra";
    const result = truncateCaption(text, 14); // window = "with very long"
    // Word boundary is after "very" (index 9), so cut = "with very..."
    expect(result).toBe("with very...");
  });

  it("appends exactly '...'", () => {
    const text = "hello world foo bar baz";
    const result = truncateCaption(text, 11);
    expect(result.endsWith("...")).toBe(true);
  });
});

describe("renderCaption", () => {
  let el;

  beforeEach(() => {
    el = document.createElement("p");
  });

  it("appends plain text when no @mentions", () => {
    renderCaption(el, "just plain text", "my-mention");
    expect(el.textContent).toBe("just plain text");
    expect(el.querySelectorAll(".my-mention").length).toBe(0);
  });

  it("wraps @mentions in spans with the given class", () => {
    renderCaption(el, "hello @alice and @bob", "training-mention");
    const spans = el.querySelectorAll(".training-mention");
    expect(spans.length).toBe(2);
    expect(spans[0].textContent).toBe("@alice");
    expect(spans[1].textContent).toBe("@bob");
  });

  it("preserves text surrounding @mentions", () => {
    renderCaption(el, "hi @alice!", "training-mention");
    expect(el.textContent).toBe("hi @alice!");
  });

  it("applies truncation before splitting @mentions", () => {
    const long = "@user " + "x".repeat(300);
    renderCaption(el, long, "training-mention", 280);
    const text = el.textContent;
    expect(text.length).toBeLessThanOrEqual(285); // 280 + "..."
    expect(text.endsWith("...")).toBe(true);
  });

  it("uses tweet-mention class for tweet cards", () => {
    renderCaption(el, "shoutout @dev", "tweet-mention");
    const span = el.querySelector(".tweet-mention");
    expect(span).not.toBeNull();
    expect(span.textContent).toBe("@dev");
  });
});
