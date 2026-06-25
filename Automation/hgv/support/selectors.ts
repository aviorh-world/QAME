import { Page, Locator } from '@playwright/test';

export type BlueprintField = {
  name: string;
  label?: string;
  selector?: string;
  type?: string;
  kind?: string;
};

export async function fieldLocator(page: Page, field: BlueprintField): Promise<Locator> {
  const candidates = [field.selector, field.name ? '[name="' + field.name.replace(/"/g, '\\"') + '"]' : '', field.name ? '#' + field.name : ''].filter(Boolean) as string[];
  for (const selector of candidates) {
    const locator = page.locator(selector).first();
    if (await locator.count()) return locator;
  }
  if (field.label) {
    const byLabel = page.getByLabel(field.label, { exact: false }).first();
    if (await byLabel.count()) return byLabel;
  }
  throw new Error('No locator found for field: ' + field.name);
}
