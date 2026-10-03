import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Main Application
 * 
 * Tests critical user flows:
 * - Page load
 * - Navigation
 * - Chat functionality
 * - Tools access
 */

test.describe('Application Main Flow', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/دهب دكتور/);
  });

  test('should navigate to diagnostic form', async ({ page }) => {
    await page.goto('/');
    await page.click('text=تشخيص جهاز');
    await expect(page.locator('h1')).toContainText('تشخيص');
  });

  test('should display chat interface', async ({ page }) => {
    await page.goto('/');
    await page.click('text=تشخيص جهاز');
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should show AI engine selector', async ({ page }) => {
    await page.goto('/');
    await page.click('text=تشخيص جهاز');
    await expect(page.locator('text=محرك الذكاء الاصطناعي')).toBeVisible();
  });
});

test.describe('Safe Injection Calculator', () => {
  test('should load calculator', async ({ page }) => {
    await page.goto('/');
    await page.click('text=حاسبة الفولت');
    await expect(page.locator('text=حاسبة حقن الفولت')).toBeVisible();
  });

  test('should display rail options', async ({ page }) => {
    await page.goto('/');
    await page.click('text=حاسبة الفولت');
    await expect(page.locator('text=PP_VDD_MAIN')).toBeVisible();
  });

  test('should show safety values when rail selected', async ({ page }) => {
    await page.goto('/');
    await page.click('text=حاسبة الفولت');
    await page.click('text=PP_VDD_MAIN');
    await expect(page.locator('text=فولت الحقن الآمن الأولي')).toBeVisible();
  });
});

test.describe('Panic Log Analyzer', () => {
  test('should load analyzer', async ({ page }) => {
    await page.goto('/');
    await page.click('text=محلل البانيك');
    await expect(page.locator('text=محلل سجلات البانيك')).toBeVisible();
  });

  test('should accept log input', async ({ page }) => {
    await page.goto('/');
    await page.click('text=محلل البانيك');
    const textarea = page.locator('textarea');
    await textarea.fill('panic(cpu 0): Missing sensor: Prs0');
    await expect(textarea).toHaveValue(/panic/);
  });
});

test.describe('Authentication', () => {
  test('should show login modal', async ({ page }) => {
    await page.goto('/');
    await page.click('text=تسجيل الدخول');
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    await page.click('text=تسجيل الدخول');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('text=دخول');
    await expect(page.locator('text=بريد إلكتروني غير صالح')).toBeVisible();
  });
});
