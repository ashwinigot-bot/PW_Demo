import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { ExcelTestRow, SupportedBrowser } from '../interfaces/excelTestRow';
import { getExcelTestData } from '../utils/testData';

interface ExecutionConfig {
  mode: 'all' | 'selectedTCIDs' | 'selectedGroups';
  selectedTCIDs: string[];
  selectedGroups: string[];
  targetBrowsers?: SupportedBrowser[];
}

const projectRoot = path.resolve(__dirname, '..');
const executionConfigPath = path.resolve(projectRoot, 'test-data/executionConfig.json');
const blobRoot = path.resolve(projectRoot, 'reports/blob');

function readExecutionConfig(): ExecutionConfig {
  const raw = fs.readFileSync(executionConfigPath, 'utf-8');
  const parsed = JSON.parse(raw) as ExecutionConfig;
  return {
    mode: parsed.mode,
    selectedTCIDs: parsed.selectedTCIDs ?? [],
    selectedGroups: parsed.selectedGroups ?? [],
    targetBrowsers: parsed.targetBrowsers ?? ['chrome', 'edge']
  };
}

function getRowsForExecution(rows: ExcelTestRow[], config: ExecutionConfig): ExcelTestRow[] {
  if (config.mode === 'all') {
    return rows;
  }

  if (config.mode === 'selectedTCIDs') {
    const selected = new Set(config.selectedTCIDs.map((item) => item.toUpperCase()));
    return rows.filter((row) => selected.has(row.TCID.toUpperCase()));
  }

  const selectedGroups = new Set(config.selectedGroups.map((item) => item.toLowerCase()));
  return rows.filter((row) => selectedGroups.has(row.Group.toLowerCase()));
}

function runForBrowserGroup(browser: SupportedBrowser, tcids: string[]): void {
  if (tcids.length === 0) {
    return;
  }

  const tcidPattern = tcids.map((tcid) => `\\[${tcid}\\]`).join('|');
  const browserBlobDir = path.resolve(blobRoot, browser);
  fs.mkdirSync(browserBlobDir, { recursive: true });
  const playwrightCli = require.resolve('@playwright/test/cli');

  const result = spawnSync(
    process.execPath,
    [playwrightCli, 'test', `--project=${browser}`, '--grep', tcidPattern],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        PW_REPORTER: 'blob',
        PW_BLOB_DIR: browserBlobDir,
        ENFORCE_BROWSER_FROM_EXCEL: 'true'
      }
    }
  );

  if (result.status !== 0) {
    throw new Error(`Playwright run failed for browser group '${browser}'.`);
  }
}

function mergeReports(reportDirs: string[]): void {
  const playwrightCli = require.resolve('@playwright/test/cli');
  const result = spawnSync(
    process.execPath,
    [playwrightCli, 'merge-reports', '--reporter', 'html', ...reportDirs],
    {
      cwd: projectRoot,
      stdio: 'inherit'
    }
  );

  if (result.status !== 0) {
    throw new Error('Failed to merge blob reports into HTML report.');
  }
}

function groupByBrowser(rows: ExcelTestRow[]): Map<SupportedBrowser, string[]> {
  const grouped = new Map<SupportedBrowser, string[]>([
    ['chrome', []],
    ['edge', []]
  ]);

  for (const row of rows) {
    const list = grouped.get(row.Browser);
    if (!list) {
      continue;
    }
    list.push(row.TCID);
  }

  return grouped;
}

function run(): void {
  fs.rmSync(blobRoot, { recursive: true, force: true });
  fs.mkdirSync(blobRoot, { recursive: true });

  const config = readExecutionConfig();
  const rows = getExcelTestData();
  const browserFilteredRows = rows.filter((row) => config.targetBrowsers?.includes(row.Browser) ?? true);
  const filteredRows = getRowsForExecution(browserFilteredRows, config);

  if (filteredRows.length === 0) {
    throw new Error('No test cases matched execution config filters.');
  }

  const grouped = groupByBrowser(filteredRows);
  const reportDirs: string[] = [];

  const chromeRows = grouped.get('chrome') ?? [];
  if (chromeRows.length > 0) {
    reportDirs.push(path.resolve(blobRoot, 'chrome'));
    runForBrowserGroup('chrome', chromeRows);
  }

  const edgeRows = grouped.get('edge') ?? [];
  if (edgeRows.length > 0) {
    reportDirs.push(path.resolve(blobRoot, 'edge'));
    runForBrowserGroup('edge', edgeRows);
  }

  mergeReports(reportDirs);
}

run();


