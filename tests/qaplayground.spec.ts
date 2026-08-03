import { test } from '../utils/fixtures';

test.describe('QA Playground Advanced UI', () => {
  test('[TC_005] @regression @qaplayground Popup handling should update parent window', async ({ qaPlaygroundPage }) => {
    await qaPlaygroundPage.openPopupScenario();
    await qaPlaygroundPage.verifyPopupFlow();
  });
});

