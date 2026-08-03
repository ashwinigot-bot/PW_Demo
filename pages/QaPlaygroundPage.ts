import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class QaPlaygroundPage extends BasePage {
  readonly openPopupLink: Locator;
  readonly infoText: Locator;

  constructor(page: Page) {
    super(page);
    this.openPopupLink = page.locator('#login');
    this.infoText = page.locator('#info');
  }

  async openPopupScenario(): Promise<void> {
    const qaPlaygroundUrl = process.env.QA_PLAYGROUND_URL?.trim() || 'https://qaplayground.dev/apps/popup/';
    await this.navigateTo(qaPlaygroundUrl);
    await this.waitForVisible(this.openPopupLink);
  }

  async verifyPopupFlow(): Promise<void> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.openPopupLink.click();

    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await popup.locator('body').click();
    await popup.close();

    await expect(this.infoText).toHaveText('Button Clicked');
  }
}

