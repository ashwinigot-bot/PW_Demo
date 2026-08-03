import type { AdminSearchData } from '../interfaces/adminSearchData';
import { test } from '../utils/fixtures';

test.describe('OrangeHRM Admin Flow', () => {
  test('[TC_001] @smoke @login Login should land on dashboard', async ({ loginPage, homePage, testDataRow }) => {
    await loginPage.open();
    await loginPage.login(testDataRow.username ?? '', testDataRow.password ?? '');
    await homePage.assertDashboardVisible();
  });

  test('[TC_002] @regression @admin Admin search should show result table', async ({ loginPage, homePage, adminPage, testDataRow }) => {
    await loginPage.open();
    await loginPage.login(testDataRow.username ?? '', testDataRow.password ?? '');
    await homePage.assertDashboardVisible();

    await homePage.openAdminModule();
    await adminPage.assertAdminPageVisible();

    const criteria: AdminSearchData = {
      key: 'excel-admin-search',
      username: testDataRow.searchUsername ?? ''
    };

    await adminPage.searchUser(criteria);
    await adminPage.validateSearchResultsTableDisplayed();
    await adminPage.validateUserPresentInResults(criteria.username);
  });

  test('[TC_003] @regression @admin Save user updates and logout', async ({ loginPage, homePage, adminPage, testDataRow }) => {
    await loginPage.open();
    await loginPage.login(testDataRow.username ?? '', testDataRow.password ?? '');
    await homePage.assertDashboardVisible();

    await homePage.openAdminModule();
    await adminPage.assertAdminPageVisible();

    const originalUsername = testDataRow.searchUsername ?? '';
    const criteria: AdminSearchData = {
      key: 'excel-admin-edit-search',
      username: originalUsername
    };

    await adminPage.searchUser(criteria);
    await adminPage.validateSearchResultsTableDisplayed();
    await adminPage.clickEditForUsername(originalUsername);
    await adminPage.updateUsernameAndSave(originalUsername);

    await homePage.logout();
    await loginPage.assertLoginPageVisible();
  });

  test('[TC_004] @regression @admin Edge admin search should show result table', async ({ loginPage, homePage, adminPage, testDataRow }) => {
    await loginPage.open();
    await loginPage.login(testDataRow.username ?? '', testDataRow.password ?? '');
    await homePage.assertDashboardVisible();

    await homePage.openAdminModule();
    await adminPage.assertAdminPageVisible();

    const criteria: AdminSearchData = {
      key: 'excel-admin-search-edge',
      username: testDataRow.searchUsername ?? ''
    };

    await adminPage.searchUser(criteria);
    await adminPage.validateSearchResultsTableDisplayed();
    await adminPage.validateUserPresentInResults(criteria.username);
  });
});

