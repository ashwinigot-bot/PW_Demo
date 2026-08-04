import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const useBlobReporter = process.env.PW_REPORTER === 'blob';
const defaultRunId = new Date().toISOString().replace(/[:.]/g, '-');
const runId = process.env.PW_RUN_ID ?? defaultRunId;
const jiraReporter: [string] = ['./reporters/JiraFailureReporter.ts'];

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: 15_000
  },
  retries: 1,
  workers: 3,
  fullyParallel: true,
  outputDir: `reports/artifacts/${runId}`,
  reporter: useBlobReporter
    ? [
        ['list'],
        ['blob', { outputDir: process.env.PW_BLOB_DIR ?? 'reports/blob/default' }],
        jiraReporter
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'reports/html', open: 'never' }],
        jiraReporter
      ],
  use: {
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    headless: process.env.CI === 'true',
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    viewport: { width: 1536, height: 864 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome']
      }
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge'
      }
    }
  ]
});

