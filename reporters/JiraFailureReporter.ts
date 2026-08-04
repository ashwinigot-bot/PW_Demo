import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestError,
  TestResult
} from '@playwright/test/reporter';
import { extractTCIDFromTitle } from '../utils/meta';
import { addAttachmentToIssue, addIssueLink, createJiraBug } from '../utils/jiraClient';
import { getJiraConfig, validateJiraConfig } from '../utils/jiraConfig';

function toRunUrl(): string | undefined {
  const server = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;

  if (!server || !repo || !runId) {
    return undefined;
  }

  return `${server}/${repo}/actions/runs/${runId}`;
}

function formatError(error: TestError | undefined): string {
  if (!error) {
    return 'No error details were captured.';
  }

  const message = error.message?.trim() ?? '';
  const stack = error.stack?.trim() ?? '';

  if (message && stack) {
    return `${message}\n\n${stack}`;
  }

  return message || stack || 'No error details were captured.';
}

function descriptionBlock(label: string, value: string): string {
  return `*${label}:*\n${value}`;
}

function pickAttachmentPaths(result: TestResult): string[] {
  const supportedKinds = new Set(['screenshot', 'trace', 'video']);

  return result.attachments
    .filter((attachment) => supportedKinds.has(attachment.name) && typeof attachment.path === 'string')
    .map((attachment) => attachment.path as string);
}

export default class JiraFailureReporter implements Reporter {
  private readonly createdForTestIds = new Set<string>();
  private readonly jiraIssueByTestId = new Map<string, string>();

  onBegin(config: FullConfig): void {
    const jiraConfig = getJiraConfig();
    const missing = validateJiraConfig(jiraConfig);

    if (!jiraConfig.enabled) {
      console.log('[jira] Jira failure reporter is disabled (JIRA_ENABLED != true).');
      return;
    }

    if (missing.length > 0) {
      console.warn(`[jira] Jira reporter disabled due to missing env vars: ${missing.join(', ')}`);
      return;
    }

    console.log(`[jira] Jira failure reporter enabled for project '${jiraConfig.projectKey}' (${config.projects.length} Playwright project(s)).`);
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const jiraConfig = getJiraConfig();
    const missing = validateJiraConfig(jiraConfig);

    if (!jiraConfig.enabled || missing.length > 0) {
      return;
    }

    if (result.status !== 'failed') {
      return;
    }

    if (this.createdForTestIds.has(test.id)) {
      return;
    }

    this.createdForTestIds.add(test.id);

    const tcid = extractTCIDFromTitle(test.title);
    const browser = test.parent.project()?.name ?? 'unknown';
    const runUrl = toRunUrl() ?? 'N/A (local execution)';
    const fullTitle = test.titlePath().join(' > ');
    const errorText = formatError(result.error);

    const summary = `[${tcid}] Playwright failure in ${browser}: ${test.title}`.slice(0, 254);

    const description = [
      descriptionBlock('TCID', tcid),
      descriptionBlock('Test Description', fullTitle),
      descriptionBlock('Browser', browser),
      descriptionBlock('Run URL', runUrl),
      descriptionBlock('Failure Logs', `{code}${errorText}{code}`)
    ].join('\n\n');

    try {
      const issue = await createJiraBug(jiraConfig, summary, description);
      this.jiraIssueByTestId.set(test.id, issue.key);

      const attachmentPaths = pickAttachmentPaths(result);
      for (const attachmentPath of attachmentPaths) {
        await addAttachmentToIssue(jiraConfig, issue.key, attachmentPath);
      }

      if (jiraConfig.parentIssueKey) {
        await addIssueLink(jiraConfig, issue.key, jiraConfig.parentIssueKey);
      }

      console.log(`[jira] Created Jira issue ${issue.key} for failed test '${fullTitle}'.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[jira] Failed to create Jira issue for '${fullTitle}': ${message}`);
    }
  }

  onEnd(result: FullResult): void {
    if (this.jiraIssueByTestId.size > 0) {
      console.log(`[jira] Created ${this.jiraIssueByTestId.size} issue(s) for this run.`);
    }

    if (result.status !== 'passed') {
      console.log('[jira] Playwright run finished with non-passed status. Jira reporter completed failure sync attempts.');
    }
  }
}

