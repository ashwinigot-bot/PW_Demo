import { expect, type Locator, type Page } from '@playwright/test';
import { TableComponent } from '../components/TableComponent';
import type { AdminSearchData } from '../interfaces/adminSearchData';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  readonly usernameSearchInput: Locator;
  readonly userRoleDropdown: Locator;
  readonly statusDropdown: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly resultsTableRoot: Locator;
  readonly saveButton: Locator;
  readonly usernameEditInput: Locator;
  readonly successToast: Locator;
  readonly adminHeader: Locator;
  readonly table: TableComponent;

  constructor(page: Page) {
    super(page);
    this.usernameSearchInput = page.locator(
      "xpath=(//label[contains(normalize-space(),'Username')]/ancestor::div[contains(@class,'oxd-input-group')]//input)[1]"
    );
    this.userRoleDropdown = page.locator(
      "xpath=(//label[contains(normalize-space(),'User Role')]/ancestor::div[contains(@class,'oxd-input-group')]//div[contains(@class,'oxd-select-text')])[1]"
    );
    this.statusDropdown = page.locator(
      "xpath=(//label[contains(normalize-space(),'Status')]/ancestor::div[contains(@class,'oxd-input-group')]//div[contains(@class,'oxd-select-text')])[1]"
    );
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.resultsTableRoot = page.locator('.oxd-table');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.usernameEditInput = page.locator(
      "xpath=(//label[contains(normalize-space(),'Username')]/ancestor::div[contains(@class,'oxd-input-group')]//input)[1]"
    );
    this.successToast = page.locator('.oxd-toast').filter({ hasText: 'Success' });
    this.adminHeader = page.getByRole('heading', { name: 'Admin' });
    this.table = new TableComponent(this.resultsTableRoot);
  }

  async assertAdminPageVisible(): Promise<void> {
    await expect(this.adminHeader).toBeVisible();
    await this.waitForUrlContains('admin/viewSystemUsers');
  }

  async enterUsername(username: string): Promise<void> {
    await this.fill(this.usernameSearchInput, username);
  }

  async selectRole(role: string): Promise<void> {
    await this.typeAndSelectDropdown(this.userRoleDropdown, role);
  }

  async selectStatus(status: string): Promise<void> {
    await this.typeAndSelectDropdown(this.statusDropdown, status);
  }

  async clickSearch(): Promise<void> {
    await this.click(this.searchButton);
  }

  async clickReset(): Promise<void> {
    await this.click(this.resetButton);
  }

  async searchUser(criteria: AdminSearchData): Promise<void> {
    await this.enterUsername(criteria.username);
    if (criteria.role && criteria.role.trim().length > 0) {
      await this.selectRole(criteria.role);
    }

    if (criteria.status && criteria.status.trim().length > 0) {
      await this.selectStatus(criteria.status);
    }

    await this.clickSearch();
  }

  async validateSearchResultsTableDisplayed(): Promise<void> {
    await this.table.isVisible();
    await expect
      .poll(async () => this.table.rowCount(), {
        message: 'Expected at least one row in the Admin results table.',
        timeout: 20_000
      })
      .toBeGreaterThan(0);
  }

  async validateUserPresentInResults(username: string): Promise<void> {
    await this.table.validateRowContains(username);
  }

  async clickEditForUsername(username: string): Promise<void> {
    const targetRow = this.resultsTableRoot.locator('.oxd-table-card', { hasText: username }).first();
    await expect(targetRow).toBeVisible();

    const editButton = targetRow.locator('button').filter({ has: this.page.locator('i.bi-pencil-fill') }).first();
    await editButton.click();
  }

  async updateUsernameAndSave(newUsername: string): Promise<void> {
    await expect(this.usernameEditInput).toBeVisible();
    await this.usernameEditInput.fill('');
    await this.usernameEditInput.fill(newUsername);
    await this.click(this.saveButton);
    await expect(this.successToast).toBeVisible();
  }
}

