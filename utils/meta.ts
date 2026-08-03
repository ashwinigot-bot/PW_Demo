export function extractTCIDFromTitle(title: string): string {
  const tcidMatch = title.match(/TC_\d+/i);
  if (!tcidMatch) {
    throw new Error(`TCID is missing from test title: ${title}`);
  }
  return tcidMatch[0].toUpperCase();
}

