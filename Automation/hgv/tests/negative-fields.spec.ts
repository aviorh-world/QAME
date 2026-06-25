import { test } from '@playwright/test';
import { blueprint } from '../fixtures/blueprint';
import { expectValidationFeedback } from '../support/assertions';
import { fieldById, casesByCategory } from '../support/test-data';
import { fillElement, fillKnownFields, visitStartUrl } from '../support/flow-runner';

for (const testCase of casesByCategory(blueprint, 'negative')) {
  test(testCase.name, async ({ page }) => {
    await visitStartUrl(page, blueprint);
    await fillKnownFields(page, blueprint);
    const field = fieldById(blueprint, testCase.fieldId);
    await fillElement(page, field, testCase.value);
    await expectValidationFeedback(page, testCase.expected);
  });
}
