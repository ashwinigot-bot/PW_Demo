import { expect, type Locator, type Page } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(pathOrUrl: string): Promise<void> {
    await this.page.goto(pathOrUrl, { waitUntil: 'domcontentloaded' });
  }

  async click(locator: Locator): Promise<void> {
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async waitForVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async waitForUrlContains(value: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(value));
  }

  async typeAndSelectDropdown(optionContainer: Locator, optionText: string): Promise<void> {
    await optionContainer.click();
    const option = this.page.getByRole('option', { name: optionText, exact: true });
    await option.click();
  }

  async textContent(locator: Locator): Promise<string> {
    const text = await locator.textContent();
    return text?.trim() ?? '';
  }
}

