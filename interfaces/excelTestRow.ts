export type SupportedBrowser = 'chrome' | 'edge';

export interface ExcelTestRow {
  TCID: string;
  Browser: SupportedBrowser;
  Group: string;
  Scenario: string;
  username?: string;
  password?: string;
  searchUsername?: string;
  role?: string;
  status?: string;
  newUsername?: string;
  expectedResult?: string;
}

