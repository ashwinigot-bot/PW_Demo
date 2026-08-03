import fs from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';
import type { AdminSearchData } from '../interfaces/adminSearchData';
import type { ExcelTestRow, SupportedBrowser } from '../interfaces/excelTestRow';
import type { UserData } from '../interfaces/userData';

const usersPath = path.resolve(__dirname, '../testData/users.json');
const adminSearchPath = path.resolve(__dirname, '../testData/adminSearch.json');
const excelPath = path.resolve(__dirname, '../test-data/orangehrm-data.xlsx');
const requiredExcelColumns: Array<keyof Pick<ExcelTestRow, 'TCID' | 'Browser'>> = ['TCID', 'Browser'];

function readJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export function getUsersData(): UserData[] {
  return readJsonFile<UserData[]>(usersPath);
}

export function getAdminSearchData(): AdminSearchData[] {
  return readJsonFile<AdminSearchData[]>(adminSearchPath);
}

function assertRequiredColumns(row: Record<string, unknown>, rowNumber: number): void {
  for (const column of requiredExcelColumns) {
    const value = row[column];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Missing required column '${column}' in Excel row ${rowNumber}.`);
    }
  }
}

function normalizeBrowser(browser: string): SupportedBrowser {
  const normalized = browser.trim().toLowerCase();
  if (normalized !== 'chrome' && normalized !== 'edge') {
    throw new Error(`Unsupported Browser value '${browser}'. Expected 'chrome' or 'edge'.`);
  }
  return normalized;
}

export function getExcelTestData(): ExcelTestRow[] {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('No worksheet found in orangehrm-data.xlsx.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  return rows.map((rawRow, index) => {
    assertRequiredColumns(rawRow, index + 2);

    const browserValue = normalizeBrowser(String(rawRow.Browser));

    return {
      TCID: String(rawRow.TCID).trim(),
      Browser: browserValue,
      Group: String(rawRow.Group ?? '').trim(),
      Scenario: String(rawRow.Scenario ?? '').trim(),
      username: String(rawRow.username ?? '').trim() || undefined,
      password: String(rawRow.password ?? '').trim() || undefined,
      searchUsername: String(rawRow.searchUsername ?? '').trim() || undefined,
      role: String(rawRow.role ?? '').trim() || undefined,
      status: String(rawRow.status ?? '').trim() || undefined,
      newUsername: String(rawRow.newUsername ?? '').trim() || undefined,
      expectedResult: String(rawRow.expectedResult ?? '').trim() || undefined
    } satisfies ExcelTestRow;
  });
}

export function getExcelRowByTCID(tcid: string): ExcelTestRow {
  const row = getExcelTestData().find((item) => item.TCID === tcid);
  if (!row) {
    throw new Error(`No Excel row found for TCID '${tcid}'.`);
  }
  return row;
}

export function getExcelRowsByBrowser(browser: SupportedBrowser): ExcelTestRow[] {
  return getExcelTestData().filter((row) => row.Browser === browser);
}

