import type { JiraConfig } from '../interfaces/jiraConfig';

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

export function getJiraConfig(): JiraConfig {
  const enabled = readEnv('JIRA_ENABLED').toLowerCase() === 'true';

  return {
    enabled,
    baseUrl: readEnv('JIRA_BASE_URL'),
    email: readEnv('JIRA_EMAIL'),
    apiToken: readEnv('JIRA_API_TOKEN'),
    projectKey: readEnv('JIRA_PROJECT_KEY'),
    issueType: readEnv('JIRA_ISSUE_TYPE') || 'Bug',
    assigneeAccountId: readEnv('JIRA_ASSIGNEE_ACCOUNT_ID') || undefined,
    parentIssueKey: readEnv('JIRA_PARENT_ISSUE_KEY') || undefined
  };
}

export function validateJiraConfig(config: JiraConfig): string[] {
  if (!config.enabled) {
    return [];
  }

  const missing: string[] = [];

  if (!config.baseUrl) {
    missing.push('JIRA_BASE_URL');
  }
  if (!config.email) {
    missing.push('JIRA_EMAIL');
  }
  if (!config.apiToken) {
    missing.push('JIRA_API_TOKEN');
  }
  if (!config.projectKey) {
    missing.push('JIRA_PROJECT_KEY');
  }

  return missing;
}

