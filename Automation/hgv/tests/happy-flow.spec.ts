import { test } from '@playwright/test';
import { blueprint } from '../fixtures/blueprint';
import { runHappyFlow } from '../support/flow-runner';

test('happy flow - recorded path', async ({ page }) => {
  await runHappyFlow(page, blueprint);
});
