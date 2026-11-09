import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // These transitions depend on local content, not third-party player availability.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return route.continue();
    return route.abort();
  });
});

test("comparison dialog supports keyboard navigation, traps focus, and returns to its opener", async ({ page }) => {
  await page.goto("/evolution/");
  const opener = page.getByRole("button", { name: "View before comparison" });
  await opener.focus();
  await opener.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Throwing comparison" });
  const close = dialog.getByRole("button", { name: "Close dialog" });
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await expect(page.locator("main")).toHaveJSProperty("inert", true);
  await close.press("Shift+Tab");
  const next = dialog.getByRole("button", { name: "Next image" });
  await expect(next).toBeFocused();
  await next.press("Tab");
  await expect(close).toBeFocused();
  await close.press("ArrowRight");
  await expect(dialog.locator("img")).toHaveAttribute("alt", "after");
  await expect(next).toBeHidden();
  await close.press("ArrowRight");
  await expect(dialog.locator("img")).toHaveAttribute("alt", "after");
  await close.press("Escape");
  await expect(page.locator(".comparison-modal")).toHaveAttribute("data-state", "closed");
  await expect(opener).toBeFocused();
  await expect(page.locator("main")).toHaveJSProperty("inert", false);
  await expect(page.locator("body")).not.toHaveClass(/modal-open/);
  await opener.press("Space");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(opener).toBeFocused();
});

test("progression dialog opens from keyboard and keeps focus when a boundary button disappears", async ({ page }) => {
  await page.goto("/evolution/");
  const opener = page.getByRole("button", { name: "View 2026 progression" });
  await opener.focus();
  await opener.press("Space");
  const dialog = page.getByRole("dialog", { name: "Media viewer" });
  const close = dialog.getByRole("button", { name: "Close dialog" });
  await expect(close).toBeFocused();
  const next = dialog.getByRole("button", { name: "Next media" });
  for (let i = 0; i < 3; i += 1) await next.click();
  await expect(next).toBeHidden();
  await expect(close).toBeFocused();
  await expect(dialog.locator(".badge-year")).toHaveText("2022");
  await close.press("ArrowLeft");
  await expect(dialog.locator(".badge-year")).toHaveText("2024");
  await close.press("Escape");
  await expect(opener).toBeFocused();
  await expect(page.locator("html")).not.toHaveClass(/modal-open/);
});

test("theme picker closes on Tab, Shift+Tab, selection, and outside focus", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator(".theme-menu-trigger");
  await trigger.focus();
  await trigger.press("ArrowDown");
  const selected = page.getByRole("option", { selected: true });
  await expect(selected).toBeFocused();
  await selected.press("Shift+Tab");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.press("Enter");
  await page.getByRole("option", { selected: true }).press("Tab");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).not.toBeFocused();
  await trigger.click();
  await page.getByRole("option", { name: "Mets", exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mets");
  await trigger.click();
  const outside = page.locator(".social-links a").first();
  await outside.focus();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(outside).toBeFocused();
});

test("stats category exposes the same selection to assistive technology and the table", async ({ page }) => {
  await page.goto("/");
  const college = page.getByRole("button", { name: /^College/ });
  await college.click();
  await expect(college).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.stats-category-btn[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('.stats-table tbody tr[data-category="Minors"]').first()).toBeHidden();
  await expect(page.locator('.stats-table tbody tr[data-category="College"]').first()).toBeVisible();
  await page.getByRole("button", { name: /^Minors/ }).click();
  await expect(college).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('.stats-table tbody tr[data-category="Minors"]').first()).toBeVisible();
});
