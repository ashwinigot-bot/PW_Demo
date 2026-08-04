export interface JiraConfig {
  enabled: boolean;
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueType: string;
  assigneeAccountId?: string;
  parentIssueKey?: string;
}

