import fs from 'node:fs/promises';
import path from 'node:path';
import type { JiraConfig } from '../interfaces/jiraConfig';

interface JiraIssue {
  key: string;
  self: string;
}

function buildAuthHeader(config: JiraConfig): string {
  const token = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  return `Basic ${token}`;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function jiraRequest<T>(
  config: JiraConfig,
  endpoint: string,
  init: RequestInit,
  expectedStatus: number | number[]
): Promise<T> {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const response = await fetch(`${baseUrl}${endpoint}`, init);

  const allowedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  if (!allowedStatuses.includes(response.status)) {
    const body = await response.text();
    throw new Error(`Jira API ${endpoint} failed with ${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function createJiraBug(
  config: JiraConfig,
  summary: string,
  description: string
): Promise<JiraIssue> {
  const fields: Record<string, unknown> = {
    project: { key: config.projectKey },
    summary,
    description,
    issuetype: { name: config.issueType }
  };

  if (config.assigneeAccountId) {
    fields.assignee = { id: config.assigneeAccountId };
  }

  return jiraRequest<JiraIssue>(
    config,
    '/rest/api/2/issue',
    {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(config),
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    },
    201
  );
}

export async function addIssueLink(
  config: JiraConfig,
  sourceIssueKey: string,
  targetIssueKey: string
): Promise<void> {
  await jiraRequest<void>(
    config,
    '/rest/api/2/issueLink',
    {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(config),
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: { name: 'Relates' },
        inwardIssue: { key: sourceIssueKey },
        outwardIssue: { key: targetIssueKey }
      })
    },
    [201]
  );
}

export async function addAttachmentToIssue(
  config: JiraConfig,
  issueKey: string,
  filePath: string
): Promise<void> {
  const fileBuffer = await fs.readFile(filePath);
  const fileName = path.basename(filePath);

  const form = new FormData();
  form.append('file', new Blob([fileBuffer]), fileName);

  await jiraRequest<unknown>(
    config,
    `/rest/api/2/issue/${issueKey}/attachments`,
    {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(config),
        Accept: 'application/json',
        'X-Atlassian-Token': 'no-check'
      },
      body: form
    },
    200
  );
}

