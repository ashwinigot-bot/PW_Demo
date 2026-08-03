import { expect, type Locator } from '@playwright/test';

export class TableComponent {
  private readonly table: Locator;

  constructor(table: Locator) {
    this.table = table;
  }

  async isVisible(): Promise<void> {
    await expect(this.table).toBeVisible();
  }

  async rowCount(): Promise<number> {
    return this.table.locator('.oxd-table-card').count();
  }

  async hasText(text: string): Promise<void> {
    await expect(this.table).toContainText(text);
  }

  async getCellText(rowIndex: number, cellIndex: number): Promise<string> {
    const cell = this.table
      .locator('.oxd-table-card')
      .nth(rowIndex)
      .locator('.oxd-table-cell')
      .nth(cellIndex);

    return (await cell.innerText()).trim();
  }

  async validateRowContains(rowText: string): Promise<void> {
    const row = this.table.locator('.oxd-table-card', { hasText: rowText }).first();
    await expect(row).toBeVisible();
  }
}

