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

// Helper: scroll to footer and wait for the theme trigger to be rendered by JS
async function waitForThemeTrigger(page) {
  // renderFooter runs after async data loading; wait for the trigger to exist
  await page.waitForSelector(".theme-menu-trigger", { timeout: 10000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
}

// Helper: open the footer theme dropdown and wait for it to be visible.
async function openThemeDropdown(page) {
  await page.locator(".theme-menu-trigger").click();
  await page.waitForFunction(() => {
    const menu = document.querySelector(".theme-switcher .theme-menu");
    return menu && !menu.hidden;
  }, { timeout: 5000 });
}

test.describe("Theme Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-intro");
  });

  test("has theme picker trigger in footer", async ({ page }) => {
    await waitForThemeTrigger(page);
    const trigger = page.locator(".theme-menu-trigger");
    await expect(trigger).toBeVisible();
  });

  test("opens dropdown with 6 theme options", async ({ page }) => {
    await waitForThemeTrigger(page);
    await openThemeDropdown(page);

    const options = page.locator(".theme-switcher .theme-menu-option");
    await expect(options).toHaveCount(6);
  });

  test("changes theme on dropdown option click", async ({ page }) => {
    await waitForThemeTrigger(page);

    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );

    await openThemeDropdown(page);

    const options = page.locator(".theme-switcher .theme-menu-option");
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      const opt = options.nth(i);
      const themeId = await opt.getAttribute("data-theme");
      if (themeId !== initialTheme) {
        await opt.click();
        break;
      }
    }

    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(newTheme).not.toBe(initialTheme);
  });

  test("persists theme in localStorage", async ({ page }) => {
    await waitForThemeTrigger(page);
    await openThemeDropdown(page);

    const philliesOption = page.locator('.theme-switcher .theme-menu-option[data-theme="phillies"]');
    if ((await philliesOption.count()) > 0) {
      await philliesOption.click();

      const storedTheme = await page.evaluate(() =>
        localStorage.getItem("theme")
      );
      expect(storedTheme).toBe("phillies");
    }
  });

  test("dropdown includes rangers and marlins themes", async ({ page }) => {
    await waitForThemeTrigger(page);
    await openThemeDropdown(page);

    await expect(page.locator('.theme-switcher .theme-menu-option[data-theme="rangers"]')).toBeVisible();
    await expect(page.locator('.theme-switcher .theme-menu-option[data-theme="marlins"]')).toBeVisible();
  });
});

test.describe("Section Icon Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".content-section");
  });

  test("section icons have pointer cursor", async ({ page }) => {
    const sectionIcon = page.locator(".section-icon").first();
    await expect(sectionIcon).toBeVisible();

    const cursor = await sectionIcon.evaluate((el) =>
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe("pointer");
  });

  test("clicking section icon scrolls section to top", async ({ page }) => {
    // Scroll to middle of page first
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(100);

    // Get the first content section and its icon
    const section = page.locator(".content-section").first();
    const sectionIcon = section.locator(".section-icon");

    // Get section position before click
    const sectionId = await section.getAttribute("id");

    // Click the icon
    await sectionIcon.click();

    // Wait for smooth scroll to complete
    await page.waitForTimeout(600);

    // Section should now be at or near the top of the viewport
    const sectionTop = await section.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top;
    });

    // Should be within 30px of top (accounting for scroll-margin-top: 20px)
    expect(sectionTop).toBeLessThanOrEqual(30);
    expect(sectionTop).toBeGreaterThanOrEqual(-10);
  });

  test("clicking section icon from within section scrolls to top", async ({ page }) => {
    // Get the first content section
    const section = page.locator(".content-section").first();
    const sectionIcon = section.locator(".section-icon");

    // Scroll to middle of that section
    await section.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + rect.top + 200);
    });
    await page.waitForTimeout(100);

    // Click the icon
    await sectionIcon.click();

    // Wait for smooth scroll to complete
    await page.waitForTimeout(600);

    // Section should now be at or near the top
    const sectionTop = await section.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top;
    });

    expect(sectionTop).toBeLessThanOrEqual(30);
    expect(sectionTop).toBeGreaterThanOrEqual(-10);
  });

  test("all section icons are clickable", async ({ page }) => {
    const sectionIcons = page.locator(".section-icon");
    const count = await sectionIcons.count();

    expect(count).toBeGreaterThan(0);

    // Verify each icon has pointer cursor
    for (let i = 0; i < count; i++) {
      const icon = sectionIcons.nth(i);
      const cursor = await icon.evaluate((el) =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe("pointer");
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
