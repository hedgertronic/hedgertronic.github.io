import { describe, expect, it } from "vitest";
import { createProjectCard } from "../../src/cards.js";

describe("project card thumbnails", () => {
  it("uses a project's OG image as an accessible visual lead", () => {
    const card = createProjectCard({
      title: "Hot Stove",
      url: "https://hedgertronic.com/games/hot-stove/",
      thumbnail: "/games/hot-stove/og-image.png",
      thumbnailAlt: "Hot Stove game preview",
    });

    const image = card.querySelector(".thumbnail-wrapper > img.thumbnail");
    expect(card.firstElementChild?.className).toBe("thumbnail-wrapper");
    expect(image?.getAttribute("src")).toBe("/games/hot-stove/og-image.png");
    expect(image?.getAttribute("alt")).toBe("Hot Stove game preview");
    expect(image?.loading).toBe("lazy");
  });

  it("keeps projects without an image text-first", () => {
    const card = createProjectCard({ title: "Text project", url: "/project" });
    expect(card.querySelector(".thumbnail-wrapper")).toBeNull();
    expect(card.firstElementChild?.tagName).toBe("H3");
  });

  it("can show an unpromoted candidate on localhost without changing production", () => {
    const card = createProjectCard({
      title: "Hot Stove",
      url: "/games/hot-stove/",
      thumbnail: "/games/hot-stove/og-image.png",
      thumbnailPreview: "http://localhost:5173/og-preview.png",
    });
    expect(card.querySelector("img")?.getAttribute("src")).toBe(
      "http://localhost:5173/og-preview.png",
    );
  });
});
