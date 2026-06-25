import { expect, Page } from '@playwright/test';

export async function expectValidationFeedback(page: Page, expected: string): Promise<void> {
  const invalidControls = page.locator(':invalid, [aria-invalid="true"]');
  const visibleErrors = page.locator('[role="alert"], [aria-live], .error, .field-error, .invalid-feedback, mat-error');
  const invalidCount = await invalidControls.count().catch(() => 0);
  const errorCount = await visibleErrors.count().catch(() => 0);
  if (invalidCount === 0 && errorCount === 0) {
    await testStepNote(page, expected);
  }
  expect.soft(invalidCount + errorCount, expected).toBeGreaterThan(0);
}

async function testStepNote(page: Page, note: string): Promise<void> {
  await page.evaluate((message) => console.warn('[QA Blueprint]', message), note).catch(() => undefined);
}
