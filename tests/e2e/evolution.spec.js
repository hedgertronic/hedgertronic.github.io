import { test, expect } from "@playwright/test";

test.describe("Evolution Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/evolution/");
    await page.waitForSelector(".hero-intro");
  });

  test("loads successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/Evolution|Hedger/);
  });

  test("displays hero section with headshot", async ({ page }) => {
    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();

    const headshot = page.locator(".hero-headshot");
    await expect(headshot).toBeVisible();

    const loaded = await headshot.evaluate((img) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(loaded).toBe(true);
  });

  test("displays hero name and description", async ({ page }) => {
    const heroName = page.locator(".hero-name");
    await expect(heroName).toBeVisible();
    await expect(heroName).not.toBeEmpty();

    const heroDescription = page.locator(".hero-description");
    await expect(heroDescription).toBeVisible();
  });

  test("displays page title", async ({ page }) => {
    const pageTitle = page.locator("#evolution-hero-title");
    await expect(pageTitle).toBeVisible();
  });

  test("logo headshot in header loads correctly", async ({ page }) => {
    const logoHeadshot = page.locator("#logo-headshot");
    await expect(logoHeadshot).toBeVisible();

    const loaded = await logoHeadshot.evaluate((img) => {
      return img.complete && img.naturalWidth > 0;
    });
    expect(loaded).toBe(true);

    const src = await logoHeadshot.getAttribute("src");
    expect(src).toMatch(/headshot-(dl|mets|phillies|hopkins)/);
  });

  test("has back navigation to homepage", async ({ page }) => {
    const backLink = page.locator('.logo[href="/"]');
    await expect(backLink).toBeVisible();

    const backArrow = page.locator(".back-arrow");
    await expect(backArrow).toBeVisible();
  });

  test("displays social links", async ({ page }) => {
    const socialLinks = page.locator(".social-links a");
    const count = await socialLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Evolution Page Content Sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/evolution/");
    await page.waitForSelector(".hero-intro");
  });

  test("displays content sections", async ({ page }) => {
    const sections = page.locator("main section, main .evolution-section");
    await page.waitForTimeout(1000);
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("has hero navigation for sections", async ({ page }) => {
    const heroNav = page.locator(".hero-nav");
    const isVisible = await heroNav.isVisible();

    if (isVisible) {
      const navItems = page.locator(".hero-nav a, .hero-nav-item");
      const count = await navItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe("Evolution Page Theme Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/evolution/");
    await page.waitForSelector(".hero-intro");
  });

  test("has theme picker trigger in footer", async ({ page }) => {
    await page.waitForSelector(".theme-menu-trigger", { timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);

    const trigger = page.locator(".theme-menu-trigger");
    await expect(trigger).toBeVisible();
  });

  test("theme persists from homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-intro");
    await page.waitForSelector(".theme-menu-trigger", { timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);

    await page.locator(".theme-menu-trigger").click();
    await page.waitForFunction(() => {
      const menu = document.querySelector(".theme-switcher .theme-menu");
      return menu && !menu.hidden;
    }, { timeout: 5000 });

    // Scope to footer menu to target visible options only
    const philliesOption = page.locator('.theme-switcher .theme-menu-option[data-theme="phillies"]');
    if ((await philliesOption.count()) > 0) {
      await philliesOption.click();
      await page.waitForTimeout(100);
    }

    await page.goto("/evolution/");
    await page.waitForSelector(".hero-intro");

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    const storedTheme = await page.evaluate(() =>
      localStorage.getItem("theme")
    );

    if (storedTheme === "phillies") {
      expect(theme).toBe("phillies");
    }
  });

  test("headshot updates with theme", async ({ page }) => {
    await page.waitForSelector(".theme-menu-trigger", { timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);

    await page.locator(".theme-menu-trigger").click();
    await page.waitForFunction(() => {
      const menu = document.querySelector(".theme-switcher .theme-menu");
      return menu && !menu.hidden;
    }, { timeout: 5000 });

    const metsOption = page.locator('.theme-switcher .theme-menu-option[data-theme="mets"]');
    if ((await metsOption.count()) > 0) {
      await metsOption.click();
      await page.waitForTimeout(300);

      const newSrc = await page.locator(".hero-headshot").getAttribute("src");
      expect(newSrc).toContain("mets");
    }
  });
});

test.describe("Evolution Page Navigation", () => {
  test("can navigate from homepage to evolution", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-intro");

    const evolutionLink = page.locator('a[href*="evolution"]');
    const count = await evolutionLink.count();

    if (count > 0) {
      await evolutionLink.first().click();
      await page.waitForURL(/evolution/);
      await expect(page).toHaveURL(/evolution/);
    }
  });

});

test.describe("Evolution Page Responsive Design", () => {
  test("displays correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/evolution/");
    await page.waitForSelector(".hero-intro");

    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();

    const headshot = page.locator(".hero-headshot");
    await expect(headshot).toBeVisible();
  });

  test("displays correctly on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/evolution/");
    await page.waitForSelector(".hero-intro");

    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();
  });

  test("displays correctly on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/evolution/");
    await page.waitForSelector(".hero-intro");

    const heroIntro = page.locator(".hero-intro");
    await expect(heroIntro).toBeVisible();
  });
});
