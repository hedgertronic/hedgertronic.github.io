import { test, expect } from "@playwright/test";

test.describe("Resume Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume/");
    // Wait for the page to initialize
    await page.waitForSelector(".hero-intro, .resume-hero-intro");
  });

  test("loads successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/Resume|Hedger/);
  });

  test("displays hero section matching homepage", async ({ page }) => {
    // Hero intro should be present
    const heroIntro = page.locator(".hero-intro, .resume-hero-intro");
    await expect(heroIntro).toBeVisible();

    // Headshot should be visible
    const headshot = page.locator(".hero-headshot");
    await expect(headshot).toBeVisible();
  });

  test("logo headshot in header loads correctly", async ({ page }) => {
    // The logo headshot in the back button should load (not 404)
    const logoHeadshot = page.locator("#logo-headshot");
    await expect(logoHeadshot).toBeVisible();

    // Verify the image actually loaded (naturalWidth > 0 means it loaded)
    const loaded = await logoHeadshot.evaluate((img) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(loaded).toBe(true);

    // Verify src points to a valid themed headshot
    const src = await logoHeadshot.getAttribute("src");
    expect(src).toMatch(/headshot-(dl|mets|phillies|hopkins)/);
  });

  test("has PDF download link", async ({ page }) => {
    // Look for PDF download link
    const pdfLink = page.locator('a[href*=".pdf"]');
    const count = await pdfLink.count();

    // Should have at least one PDF link
    expect(count).toBeGreaterThan(0);
  });

  test("displays resume content", async ({ page }) => {
    // Should have content visible
    const mainContent = page.locator("main, .resume-content, body");
    await expect(mainContent.first()).toBeVisible();
  });

  test("theme switching works on resume page", async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const themeButtons = page.locator(".theme-btn");
    const buttonCount = await themeButtons.count();

    if (buttonCount > 0) {
      // Click a theme button
      const btn = themeButtons.first();
      await btn.click();

      // Theme attribute should be set
      const theme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme")
      );
      expect(theme).toBeTruthy();
    }
  });
});

test.describe("Resume Navigation", () => {
  test("can navigate from homepage to resume", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-intro");

    // Find resume link in nav-links
    const resumeLink = page.locator('a[href*="resume"]');
    const count = await resumeLink.count();

    if (count > 0) {
      await resumeLink.first().click();
      await page.waitForURL(/resume/);
      await expect(page).toHaveURL(/resume/);
    }
  });

  test("logo headshot loads when navigating from homepage", async ({ page }) => {
    // Start on homepage
    await page.goto("/");
    await page.waitForSelector(".hero-intro");

    // Navigate to resume page
    const resumeLink = page.locator('a[href*="resume"]');
    await resumeLink.first().click();
    await page.waitForURL(/resume/);

    // Wait for resume page to initialize
    await page.waitForSelector(".resume-hero-intro");

    // The logo headshot should be visible and loaded
    const logoHeadshot = page.locator("#logo-headshot");
    await expect(logoHeadshot).toBeVisible();

    // Verify the image actually loaded (naturalWidth > 0)
    const loaded = await logoHeadshot.evaluate((img) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(loaded).toBe(true);
  });
});
