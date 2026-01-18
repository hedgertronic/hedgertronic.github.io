import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement, createIconElement, setTrustedHTML } from "../../src/dom.js";

describe("createElement", () => {
  it("creates an element with the specified tag", () => {
    const el = createElement("div");
    expect(el.tagName).toBe("DIV");
  });

  it("sets className attribute", () => {
    const el = createElement("div", { className: "my-class" });
    expect(el.className).toBe("my-class");
  });

  it("sets textContent attribute", () => {
    const el = createElement("p", { textContent: "Hello World" });
    expect(el.textContent).toBe("Hello World");
  });

  it("sets standard attributes", () => {
    const el = createElement("a", { href: "/test", target: "_blank" });
    expect(el.getAttribute("href")).toBe("/test");
    expect(el.getAttribute("target")).toBe("_blank");
  });

  it("sets data attributes via dataset", () => {
    const el = createElement("div", { dataSection: "field" });
    expect(el.dataset.section).toBe("field");
  });

  it("sets multiple data attributes", () => {
    const el = createElement("button", {
      dataTheme: "mets",
      dataCategory: "minors",
    });
    expect(el.dataset.theme).toBe("mets");
    expect(el.dataset.category).toBe("minors");
  });

  it("combines multiple attributes", () => {
    const el = createElement("div", {
      className: "card",
      id: "my-card",
      dataId: "123",
    });
    expect(el.className).toBe("card");
    expect(el.getAttribute("id")).toBe("my-card");
    expect(el.dataset.id).toBe("123");
  });

  it("appends string children as text nodes", () => {
    const el = createElement("p", {}, ["Hello ", "World"]);
    expect(el.textContent).toBe("Hello World");
    expect(el.childNodes.length).toBe(2);
  });

  it("appends element children", () => {
    const child = document.createElement("span");
    child.textContent = "child";
    const el = createElement("div", {}, [child]);
    expect(el.children.length).toBe(1);
    expect(el.children[0]).toBe(child);
  });

  it("handles null/undefined children gracefully", () => {
    const el = createElement("div", {}, [null, undefined, "text"]);
    expect(el.textContent).toBe("text");
  });

  it("creates nested structure", () => {
    const inner = createElement("span", { className: "inner", textContent: "nested" });
    const outer = createElement("div", { className: "outer" }, [inner]);
    expect(outer.querySelector(".inner")).toBe(inner);
    expect(outer.textContent).toBe("nested");
  });
});

describe("setTrustedHTML", () => {
  it("sets inner content on an element", () => {
    const el = document.createElement("div");
    setTrustedHTML(el, "<span>test</span>");
    expect(el.querySelector("span")).not.toBeNull();
    expect(el.textContent).toBe("test");
  });

  it("replaces existing content", () => {
    const el = document.createElement("div");
    el.textContent = "old";
    setTrustedHTML(el, "<span>new</span>");
    expect(el.textContent).toBe("new");
  });

  it("handles empty string", () => {
    const el = document.createElement("div");
    el.textContent = "content";
    setTrustedHTML(el, "");
    expect(el.textContent).toBe("");
  });
});

describe("createIconElement", () => {
  it("creates a span element", () => {
    const el = createIconElement("baseball");
    expect(el.tagName).toBe("SPAN");
  });

  it("has icon-wrapper class", () => {
    const el = createIconElement("baseball");
    expect(el.className).toBe("icon-wrapper");
  });

  it("contains SVG content for known icons", () => {
    const el = createIconElement("baseball");
    expect(el.querySelector("svg")).not.toBeNull();
  });

  it("returns empty content for unknown icons", () => {
    const el = createIconElement("nonexistent-icon");
    expect(el.children.length).toBe(0);
  });

  it("creates different icons correctly", () => {
    const twitterIcon = createIconElement("twitter");
    const emailIcon = createIconElement("email");

    expect(twitterIcon.querySelector("svg")).not.toBeNull();
    expect(emailIcon.querySelector("svg")).not.toBeNull();
  });
});
