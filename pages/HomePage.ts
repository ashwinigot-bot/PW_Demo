import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly dashboardHeading: Locator;
  readonly adminMenuItem: Locator;
  readonly profileDropdown: Locator;
  readonly logoutOption: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardHeading = page.getByRole('heading', { name: 'Dashboard' });
    this.adminMenuItem = page.getByRole('link', { name: 'Admin' });
    this.profileDropdown = page.locator('.oxd-userdropdown-name');
    this.logoutOption = page.getByRole('menuitem', { name: 'Logout' });
  }

  async assertDashboardVisible(): Promise<void> {
    await expect(this.dashboardHeading).toBeVisible();
    await this.waitForUrlContains('dashboard');
  }

  async openAdminModule(): Promise<void> {
    await this.click(this.adminMenuItem);
    await this.waitForUrlContains('admin');
  }

  async logout(): Promise<void> {
    await this.click(this.profileDropdown);
    await this.click(this.logoutOption);
    await this.waitForUrlContains('auth/login');
  }
}

