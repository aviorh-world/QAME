import { expect, Page } from '@playwright/test';
import { fieldLocator } from './selectors';

export function startUrl(blueprint: any): string {
  return blueprint.flows?.[0]?.startUrl || blueprint.source?.url || '';
}

export async function visitStartUrl(page: Page, blueprint: any): Promise<void> {
  const url = startUrl(blueprint);
  if (!url) throw new Error('Blueprint is missing a start URL');
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
}

export async function fillElement(page: Page, field: any, value: unknown): Promise<void> {
  const locator = await fieldLocator(page, field);
  const tag = await locator.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'input');
  const type = String(field.type || field.kind || '').toLowerCase();
  if (type === 'checkbox') {
    const shouldCheck = Boolean(value);
    if (shouldCheck) await locator.check({ force: true });
    else await locator.uncheck({ force: true }).catch(async () => locator.click({ force: true }));
    return;
  }
  if (tag === 'select' || type === 'select') {
    const option = value === 'first-non-empty-option' ? await firstOption(locator) : String(value ?? '');
    await locator.selectOption(option);
    return;
  }
  await locator.fill(String(value ?? ''));
}

export async function fillKnownFields(page: Page, blueprint: any): Promise<void> {
  for (const field of blueprint.elements || []) {
    if (field.happyValue === undefined || field.happyValue === '__SKIP__') continue;
    await fillElement(page, field, field.happyValue).catch((error) => {
      console.warn('[QA Blueprint] skipped field', field.name, error.message);
    });
  }
}

export async function runHappyFlow(page: Page, blueprint: any): Promise<void> {
  await visitStartUrl(page, blueprint);
  const steps = blueprint.flows?.[0]?.steps || [];
  for (const step of steps) {
    await fillKnownFields(page, blueprint);
    if (step.cta) await clickCTA(page, step.cta);
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  }
  await expect(page).toHaveTitle(/.+/);
}

async function clickCTA(page: Page, text: string): Promise<void> {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
  const pattern = new RegExp(escaped, 'i');
  const candidates = [
    page.getByRole('button', { name: pattern }).first(),
    page.getByRole('link', { name: pattern }).first(),
    page.locator('[role="button"], button, a', { hasText: pattern }).first()
  ];
  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.scrollIntoViewIfNeeded().catch(() => undefined);
      await candidate.click({ timeout: 5000 });
      return;
    }
  }
  throw new Error('CTA not found: ' + text);
}

async function firstOption(locator: any): Promise<string> {
  return await locator.evaluate((select: HTMLSelectElement) => {
    const option = Array.from(select.options).find((item) => item.value) || select.options[0];
    return option ? option.value : '';
  });
}
