import { test as base, expect } from '@playwright/test';
import { AdminPage } from '../pages/AdminPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { QaPlaygroundPage } from '../pages/QaPlaygroundPage';
import type { ExcelTestRow } from '../interfaces/excelTestRow';
import { extractTCIDFromTitle } from './meta';
import { getExcelRowByTCID } from './testData';

type FrameworkFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  adminPage: AdminPage;
  qaPlaygroundPage: QaPlaygroundPage;
  testDataRow: ExcelTestRow;
};

export const test = base.extend<FrameworkFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },

  qaPlaygroundPage: async ({ page }, use) => {
    await use(new QaPlaygroundPage(page));
  },

  testDataRow: async ({}, use, testInfo) => {
    const tcid = extractTCIDFromTitle(testInfo.title);
    const row = getExcelRowByTCID(tcid);

    const enforceBrowserFromExcel = process.env.ENFORCE_BROWSER_FROM_EXCEL === 'true';

    if (enforceBrowserFromExcel && row.Browser !== testInfo.project.name) {
      test.skip(true, `TCID ${tcid} is mapped to '${row.Browser}', not '${testInfo.project.name}'.`);
    }

    await use(row);
  }
});

export { expect };


