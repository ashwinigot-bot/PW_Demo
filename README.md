# Playwright Training Framework

TypeScript Playwright Page Object Model framework for OrangeHRM with Excel-driven execution, grouped browser runs, and unified HTML reporting.

## GitHub / CI Notes

- GitHub Actions workflow: `.github/workflows/playwright-tests.yml`
- CI runs the QA Playground test on Ubuntu using Chromium.
- Set repository variable `QA_PLAYGROUND_URL` to override the default QA Playground URL.
- Do not commit `.env`, `node_modules`, `reports`, `test-results`, or auth state files.

## Folder Structure

- `pages/`
- `components/`
- `interfaces/`
- `utils/`
- `tests/`
- `testData/`
- `test-data/`
- `reports/`

## Install

```powershell
Set-Location "C:\Users\L194086\OneDrive - Westpac Group\PW Session\PW\playwright-training"
npm install
npx playwright install msedge
```

## Git Commands

```powershell
git status
git add .
git commit -m "your message"
git push
git pull
git branch
git switch -c feature/branch-name
git log --oneline
git diff
git diff --staged
git stash
git stash pop
```

## Run Only OrangeHRM Flow on Edge

```powershell
Set-Location "C:\Users\L194086\OneDrive - Westpac Group\PW Session\PW\playwright-training"
npm run test:flow
```

## Run by Execution Config (Excel + Browser Grouping)

```powershell
Set-Location "C:\Users\L194086\OneDrive - Westpac Group\PW Session\PW\playwright-training"
npm run exec:config
```

## Other Scripts

```powershell
npm run test:headed
npm run test:headless
npm run test:edge
npm run report:open
```

## Deliverables

- Terminal execution output can be captured from your run in PowerShell.
- Unified HTML report is generated at `reports/html`.
- Report artifacts include screenshot, video, and trace.

## What still needs your GitHub account

I can prepare the repository contents locally, but I cannot create the remote GitHub repository, branch protection rules, or pull request screenshots without access to your GitHub/WNS account in a browser session.

Use these steps after you create the repo on GitHub:

```powershell
Set-Location "C:\Users\L194086\OneDrive - Westpac Group\PW Session\PW\playwright-training"
git init
git branch -M main
git remote add origin <your-repo-url>
git add .
git commit -m "Initial Playwright training setup"
git push -u origin main
```

