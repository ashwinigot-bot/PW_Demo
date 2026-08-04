import fs from 'node:fs/promises';
import path from 'node:path';
import type { JiraConfig } from '../interfaces/jiraConfig';

interface JiraIssue {
  key: string;
  self: string;
}

interface JiraIssueType {
  id: string;
  name: string;
}

interface JiraCreateMetaResponse {
  projects: Array<{
    key: string;
    issuetypes: JiraIssueType[];
  }>;
}

interface JiraAdfTextNode {
  type: 'text';
  text: string;
}

interface JiraAdfParagraphNode {
  type: 'paragraph';
  content: JiraAdfTextNode[];
}

interface JiraAdfDocument {
  type: 'doc';
  version: 1;
  content: JiraAdfParagraphNode[];
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

  const rawBody = await response.text();
  if (!rawBody.trim()) {
    return undefined as T;
  }

  return JSON.parse(rawBody) as T;
}

export async function createJiraBug(
  config: JiraConfig,
  summary: string,
  description: string
): Promise<JiraIssue> {
  const issueTypesMeta = await jiraRequest<JiraCreateMetaResponse>(
    config,
    `/rest/api/3/issue/createmeta?projectKeys=${encodeURIComponent(config.projectKey)}&expand=projects.issuetypes`,
    {
      method: 'GET',
      headers: {
        Authorization: buildAuthHeader(config),
        Accept: 'application/json'
      }
    },
    200
  );

  const issueTypes = issueTypesMeta.projects[0]?.issuetypes ?? [];
  const byName = (name: string) => issueTypes.find((type) => type.name.toLowerCase() === name.toLowerCase());

  const selectedIssueType =
    byName(config.issueType) ?? byName('Bug') ?? byName('Task') ?? byName('Story') ?? issueTypes[0];

  if (!selectedIssueType) {
    throw new Error(`No issue types are available for Jira project '${config.projectKey}'.`);
  }

  const descriptionDoc: JiraAdfDocument = {
    type: 'doc',
    version: 1,
    content: description
      .split(/\r?\n\r?\n/)
      .map((block) => block.trim())
      .filter((block) => block.length > 0)
      .map((block) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: block }]
      }))
  };

  const fields: Record<string, unknown> = {
    project: { key: config.projectKey },
    summary,
    description: descriptionDoc,
    issuetype: { id: selectedIssueType.id }
  };

  if (config.assigneeAccountId) {
    fields.assignee = { accountId: config.assigneeAccountId };
  }

  return jiraRequest<JiraIssue>(
    config,
    '/rest/api/3/issue',
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
    '/rest/api/3/issueLink',
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
    `/rest/api/3/issue/${issueKey}/attachments`,
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

