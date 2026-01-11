import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the site to initialize
    await page.waitForSelector(".hero-intro");
  });

  test("loads successfully with hero section", async ({ page }) => {
    // Page title should be set
    await expect(page).toHaveTitle(/.+/);

    // Hero intro should be visible
    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();

    // Headshot should be visible
    const headshot = page.locator(".hero-headshot");
    await expect(headshot).toBeVisible();
  });

  test("displays navigation with sections", async ({ page }) => {
    // Hero navigation should be visible
    const heroNav = page.locator(".hero-nav");
    await expect(heroNav).toBeVisible();

    // Should have navigation items
    const navItems = page.locator(".hero-nav-item");
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("loads content sections", async ({ page }) => {
    // Wait for sections to load
    const sections = page.locator(".content-section");
    await expect(sections.first()).toBeVisible();
  });

  test("has working social links", async ({ page }) => {
    // Social links should exist in nav-links
    const socialLinks = page.locator(".nav-links a");
    const count = await socialLinks.count();
    expect(count).toBeGreaterThan(0);

    // First link should have href
    const firstLink = socialLinks.first();
    await expect(firstLink).toHaveAttribute("href", /.+/);
  });

  test("navigates to sections on nav click", async ({ page }) => {
    // Click on a nav item
    const navItem = page.locator(".hero-nav-item").first();
    await navItem.click();

    // Should scroll or change URL
    await page.waitForTimeout(500);

    // The page should still be functional (no JS errors)
    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();
  });
});

test.describe("Theme Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-intro");
  });

  test("has theme switcher in footer", async ({ page }) => {
    // Scroll to footer where theme switcher is
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const themeButtons = page.locator(".theme-btn");
    await expect(themeButtons.first()).toBeVisible();
  });

  test("changes theme on button click", async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Get initial theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );

    // Click a different theme button
    const themeButtons = page.locator(".theme-btn");
    const buttonCount = await themeButtons.count();

    // Find a button that isn't the active one
    for (let i = 0; i < buttonCount; i++) {
      const btn = themeButtons.nth(i);
      const isActive = await btn.evaluate((el) =>
        el.classList.contains("active")
      );
      if (!isActive) {
        await btn.click();
        break;
      }
    }

    // Theme should have changed
    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(newTheme).not.toBe(initialTheme);
  });

  test("persists theme in localStorage", async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Click a theme button
    const philliesBtn = page.locator('.theme-btn[data-theme="phillies"]');
    if ((await philliesBtn.count()) > 0) {
      await philliesBtn.click();

      // Check localStorage
      const storedTheme = await page.evaluate(() =>
        localStorage.getItem("theme")
      );
      expect(storedTheme).toBe("phillies");
    }
  });
});

test.describe("Responsive Design", () => {
  test("displays correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForSelector(".hero-intro");

    // Hero should still be visible
    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();

    // Content should be visible
    const content = page.locator(".content-section").first();
    await expect(content).toBeVisible();
  });

  test("displays correctly on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector(".hero-intro");

    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();
  });
});
