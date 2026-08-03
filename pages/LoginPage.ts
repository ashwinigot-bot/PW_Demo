import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginHeader: Locator;
  readonly invalidCredentialMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.loginHeader = page.getByRole('heading', { name: 'Login' });
    this.invalidCredentialMessage = page.getByText('Invalid credentials');
  }

  async open(): Promise<void> {
    await this.navigateTo('/web/index.php/auth/login');
    await this.waitForVisible(this.loginHeader);
  }

  async login(username: string, password: string): Promise<void> {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async assertLoginPageVisible(): Promise<void> {
    await expect(this.loginHeader).toBeVisible();
  }

  async assertInvalidCredentialsShown(): Promise<void> {
    await expect(this.invalidCredentialMessage).toBeVisible();
  }
}

