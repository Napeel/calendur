# Commit and Push Mobile PWA

## TL;DR
> **Summary**: Validate the completed Calendur PWA implementation, create atomic commits on `main`, push to `origin/main`, and verify the remote SHA matches local `HEAD`.
> **Deliverables**:
> - Clean validated working tree
> - Atomic commit series on `main`
> - Successful push to `origin/main`
> - Committed evidence file with pre-push validation output and commit SHAs; final push/SHA verification reported by the executor
> **Effort**: Short
> **Parallel**: NO — git staging/commit/push must be sequential
> **Critical Path**: Preflight → validation/scan → atomic commits → push → remote verification

## Context
### Original Request
- Earlier user instruction: “make incremental commits for perfecrt version control, ensure validation and verification of everything, then push to main”.
- Current continuation: continue next steps from checkpointed session.

### Interview Summary
- Direct push to `main` is allowed because the user explicitly requested pushing to main.
- If branch protection rejects the push, stop and report. Do not bypass, force-push, or change branch protection.
- Include the completed PWA implementation and auditable `.omo` plan/evidence/notepad artifacts.
- Exclude generated/session internals: `dist/`, `.omo/run-continuation/`, `.omo/drafts/`, `.omo/boulder.json`, caches, logs, env files.

### Metis Review (gaps addressed)
- Added preflight fetch/divergence check before staging.
- Added secret/artifact scan before commit.
- Added explicit staging; no `git add .`.
- Added abort conditions for divergence, protected branch rejection, secret detection, and non-trivial validation failure.
- Added final remote SHA verification and evidence capture.

## Work Objectives
### Core Objective
Create a clean, validated, incremental commit series for the completed mobile PWA implementation and push it to `origin/main` without rewriting history.

### Deliverables
- `.omo/evidence/commit-push-mobile-pwa.md` containing:
  - preflight status
  - validation commands and outputs
  - secret/artifact scan results
  - commit plan actually executed
  - created commit SHAs/messages through the evidence commit's parent
- Executor final response containing:
  - push output summary
  - final local/remote SHA comparison
- Atomic commits on `main`, then pushed to `origin/main`.

### Definition of Done (verifiable conditions with commands)
- `npm run build` exits 0 before commits, after the commit series before push, and after push.
- `GIT_MASTER=1 rtk git status --short --branch` shows `## main...origin/main` and no dirty/untracked files after final fetch.
- `GIT_MASTER=1 rtk git rev-parse HEAD` equals `GIT_MASTER=1 rtk git rev-parse origin/main` after `GIT_MASTER=1 rtk git fetch origin`.
- `dist/`, `.omo/run-continuation/`, `.omo/drafts/`, and `.omo/boulder.json` are not committed.
- No obvious secrets are present in staged diffs.

### Must Have
- Prefix every git command with `GIT_MASTER=1`; in this repo prefer `GIT_MASTER=1 rtk git ...` to follow existing RTK usage.
- Inspect `status`, `diff`, staged diff, and recent log before committing.
- Stage exact files only; never use `git add .`.
- Use multiple commits. Minimum changed tracked/untracked file count is more than 10, so create at least 8 commits.
- Use plain English commit messages consistent with existing history.
- Run validation before commit series and after push.

### Must NOT Have
- No force-push, no amend, no rebase, no history rewrite.
- No git config changes.
- No skipping hooks.
- No broad implementation work.
- No committing `dist/`, `.omo/run-continuation/`, `.omo/drafts/`, `.omo/boulder.json`, `.env*`, logs, caches, or token dumps.
- No direct OAuth/device QA claims beyond evidence already captured.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after/final validation only; package has `build` but no `test` script.
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.omo/evidence/commit-push-mobile-pwa.md`

## Execution Strategy
### Parallel Execution Waves
> Git operations are order-dependent, so implementation tasks run sequentially.

Wave 1: Task 1 preflight and validation
Wave 2: Tasks 2-9 atomic commits
Wave 3: Task 10 push and remote verification

### Dependency Matrix (full, all tasks)
- Task 1 blocks Tasks 2-10.
- Task 2 blocks Tasks 3-10.
- Task 3 blocks Tasks 4-10.
- Task 4 blocks Tasks 5-10.
- Task 5 blocks Tasks 6-10.
- Task 6 blocks Tasks 7-10.
- Task 7 blocks Tasks 8-10.
- Task 8 blocks Tasks 9-10.
- Task 9 blocks Task 10.
- Task 10 blocks final verification wave.

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 1 task → `unspecified-high`
- Wave 2 → 8 tasks → `unspecified-high`
- Wave 3 → 1 task → `unspecified-high`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Preflight, validation, and commit hygiene audit

  **What to do**:
  1. Initialize evidence and run these exact preflight commands. This block must fail closed if any command fails:
     ```bash
     bash -e -o pipefail <<'BASH'
     mkdir -p .omo/evidence
     {
       printf '# Commit and Push Mobile PWA Evidence\n\n'
       printf '## Preflight\n\n'
       printf '### git fetch origin\n'
       GIT_MASTER=1 rtk git fetch origin
       printf '\n### status --short --branch\n'
       GIT_MASTER=1 rtk git status --short --branch
       printf '\n### diff --stat\n'
       GIT_MASTER=1 rtk git diff --stat
       printf '\n### diff excluding package-lock.json\n'
       GIT_MASTER=1 rtk git diff -- . ':(exclude)package-lock.json'
       printf '\n### diff --staged --stat\n'
       GIT_MASTER=1 rtk git diff --staged --stat
       printf '\n### log -10 --oneline\n'
       GIT_MASTER=1 rtk git log -10 --oneline
       printf '\n### rev-list origin/main...HEAD\n'
       GIT_MASTER=1 rtk git rev-list --left-right --count origin/main...HEAD
     } > .omo/evidence/commit-push-mobile-pwa.md
     BASH
     ```
  2. Abort if `rev-list --left-right --count origin/main...HEAD` shows local behind/diverged. If output is not `0 0`, stop and report.
  3. Run `npm run build` and append output to evidence with this exact command:
     ```bash
     bash -o pipefail -c "{ printf '\n## Initial build validation\n'; npm run build; } 2>&1 | tee -a .omo/evidence/commit-push-mobile-pwa.md"
     ```
  4. Ensure `.gitignore` contains these local runtime/build exclusions before Task 2 stages it. Run this idempotent command exactly:
     ```bash
     python3 - <<'PY'
     from pathlib import Path
     path = Path('.gitignore')
     lines = path.read_text().splitlines()
     required = ['dist/', '.omo/run-continuation/', '.omo/drafts/', '.omo/boulder.json']
     for item in required:
       if item not in lines:
         lines.append(item)
     path.write_text('\n'.join(lines) + '\n')
     PY
     ```
     After this command, `.gitignore` must contain exactly these runtime/build exclusion entries somewhere in the file:
     ```
     dist/
     .omo/run-continuation/
     .omo/drafts/
     .omo/boulder.json
     ```
  5. Run this deterministic secret scan and append output. Abort rule: only `SECRET_SCAN_PASS` is allowed. If the command exits non-zero or prints any `SECRET_SCAN_FAIL` line, stop and report; do not commit. Environment variable names alone are allowed because this scan only matches secret-shaped values.
     ```bash
     printf '\n## Secret scan\n' >> .omo/evidence/commit-push-mobile-pwa.md
     set -o pipefail
     python3 - <<'PY' 2>&1 | tee -a .omo/evidence/commit-push-mobile-pwa.md
     from pathlib import Path
     import re, sys

     paths = [
       Path('.gitignore'), Path('README.md'), Path('package.json'), Path('package-lock.json'),
       Path('tsconfig.json'), Path('vite.config.ts'), Path('index.html'),
       Path('public/manifest.webmanifest'), Path('public/icon-192.svg'), Path('public/icon-512.svg'),
       *Path('src').rglob('*'), *Path('api/web').rglob('*'),
       Path('.omo/plans/mobile-app-pwa.md'), Path('.omo/plans/commit-push-mobile-pwa.md'),
       *Path('.omo/evidence').glob('*'), *Path('.omo/notepads/mobile-app-pwa').glob('*'),
     ]
     patterns = {
       'openai_or_anthropic_key': re.compile(r'\b(?:sk-ant|sk-proj|sk-live|sk-test|sk-)[' + r'A-Za-z0-9_\-]{20,}'),
       'google_api_key': re.compile(r'\bAIza[A-Za-z0-9_\-]{20,}'),
       'google_access_token': re.compile(r'\bya29\.[A-Za-z0-9_\-.]+'),
       'google_refresh_token': re.compile(r'\b1//[A-Za-z0-9_\-.]+'),
       'bearer_token': re.compile(r'Bearer\s+[A-Za-z0-9_\-.]{20,}'),
       'assigned_secret': re.compile(r'(?i)(client_secret|session_secret|anthropic_api_key|google_client_secret)\s*[:=]\s*["\'][^"\']{8,}["\']'),
     }
     failures = []
     for path in paths:
       if not path.is_file():
         continue
       if 'package-lock.json' in str(path):
         continue
       text = path.read_text(errors='ignore')
       for name, pattern in patterns.items():
         for match in pattern.finditer(text):
           failures.append((str(path), name, match.group(0)[:80]))
     if failures:
       for path, name, sample in failures:
         print(f'SECRET_SCAN_FAIL {path} {name}: {sample}')
       sys.exit(1)
     print('SECRET_SCAN_PASS')
     PY
     ```
  6. Run this exact ignored-artifact check:
     ```bash
     { printf '\n## Ignored artifact check\n'; GIT_MASTER=1 rtk git status --short --ignored; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
     Verify the only ignored local runtime/build artifacts are under `dist/`, `.omo/run-continuation/`, `.omo/drafts/`, or `.omo/boulder.json`. If any ignored artifact outside those paths appears, stop and report.
  7. Run this exact staged-file guard immediately before Task 2. Abort rule: output must be empty; if any path prints, stop and report because pre-existing staged files could leak into the first commit.
     ```bash
     STAGED_FILES=$(GIT_MASTER=1 rtk git diff --staged --name-only)
     printf '\n## Pre-commit staged-file guard\n' >> .omo/evidence/commit-push-mobile-pwa.md
     if [ -n "$STAGED_FILES" ]; then
       printf '%s\n' "$STAGED_FILES" | tee -a .omo/evidence/commit-push-mobile-pwa.md
       exit 1
     fi
     printf 'NO_STAGED_FILES\n' | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not stage anything in this task.
  - Do not fix implementation failures in this task. If `npm run build` fails for any reason, stop and report.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: requires careful git and validation sequencing.
  - Skills: [`git-master`] - mandatory for git safety.
  - Omitted: [`playwright`] - browser QA is not needed for commit hygiene.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: tasks 2-10 | Blocked By: none

  **References**:
  - Pattern: `package.json:6-10` - available validation script is `npm run build`.
  - Pattern: `.gitignore` - must exclude `dist/`, `.omo/run-continuation/`, `.omo/drafts/`, and `.omo/boulder.json` before committing.
  - Evidence: `.omo/evidence/final-wave-fixes.md` - previous implementation verification context.
  - Plan: `.omo/plans/mobile-app-pwa.md` - completed implementation plan.

  **Acceptance Criteria**:
  - [ ] `.omo/evidence/commit-push-mobile-pwa.md` exists and contains preflight command outputs.
  - [ ] `npm run build` exits 0.
  - [ ] remote divergence check is `0 0` before committing.
  - [ ] staged-file guard prints `NO_STAGED_FILES` before Task 2.
  - [ ] `.gitignore` contains `dist/`, `.omo/run-continuation/`, `.omo/drafts/`, and `.omo/boulder.json` before Task 2.
  - [ ] secret scan prints `SECRET_SCAN_PASS` and no generated/runtime artifact is identified for commit.

  **QA Scenarios**:
  ```
  Scenario: Clean preflight
    Tool: Bash
    Steps: Run fetch/status/diff/build/scan commands listed above.
    Expected: Build exits 0, branch is not behind/diverged, secret scan prints `SECRET_SCAN_PASS`.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Diverged or secret-detected failure
    Tool: Bash
    Steps: Inspect `rev-list --left-right --count` and scan output before staging.
    Expected: If divergence appears or secret scan prints `SECRET_SCAN_FAIL`, no commit is created and evidence records the abort reason.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: NO | Message: n/a | Files: none

- [ ] 2. Commit PWA scaffold and build metadata

  **What to do**:
  1. Stage exactly these files with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- .gitignore package.json package-lock.json tsconfig.json vite.config.ts index.html public/manifest.webmanifest public/icon-192.svg public/icon-512.svg
     ```
  2. Run this exact staged-stat command:
     ```bash
     { printf '\n## Commit 1 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  3. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Add Vite PWA project scaffold"
     ```
  4. Append resulting SHA with this exact command:
     ```bash
     { printf '\n## Commit 1 SHA\n'; GIT_MASTER=1 rtk git log -1 --oneline; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not stage `src/`, `api/`, README, or `.omo/` in this commit.
  - Do not stage `dist/`.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: atomic git staging.
  - Skills: [`git-master`] - mandatory for commit operations.
  - Omitted: [`playwright`] - no UI QA required here.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: tasks 3-10 | Blocked By: task 1

  **References**:
  - Pattern: `package.json:6-10` - Vite scripts.
  - Pattern: `public/manifest.webmanifest` - PWA manifest metadata.
  - Pattern: `index.html` - PWA/iOS shell metadata.

  **Acceptance Criteria**:
  - [ ] Commit exists with only the listed scaffold/metadata files.
  - [ ] Commit message is exactly `Add Vite PWA project scaffold`.
  - [ ] Committed `.gitignore` excludes `dist/`, `.omo/run-continuation/`, `.omo/drafts/`, and `.omo/boulder.json`.
  - [ ] Evidence file records the commit SHA.

  **QA Scenarios**:
  ```
  Scenario: Scaffold commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --stat --oneline HEAD` after commit.
    Expected: Output lists only the exact scaffold/metadata files for this task.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Generated artifact exclusion
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD` and inspect for `dist/`.
    Expected: No `dist/` path appears.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Add Vite PWA project scaffold` | Files: listed above

- [ ] 3. Commit frontend API contracts and settings helpers

  **What to do**:
  1. Stage exactly these files with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- src/lib/types.ts src/lib/api.ts src/lib/settings.ts
     ```
  2. Run this exact staged-stat command:
     ```bash
     { printf '\n## Commit 2 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  3. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Add PWA API contracts and settings helpers"
     ```
  4. Append resulting SHA with this exact command:
     ```bash
     { printf '\n## Commit 2 SHA\n'; GIT_MASTER=1 rtk git log -1 --oneline; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not stage React components in this commit.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: git staging with dependency ordering.
  - Skills: [`git-master`]
  - Omitted: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: tasks 4-10 | Blocked By: tasks 1-2

  **References**:
  - API/Type: `src/lib/types.ts` - shared frontend contracts.
  - Pattern: `src/lib/api.ts` - same-origin API client.
  - Pattern: `src/lib/settings.ts` - local non-secret settings persistence.

  **Acceptance Criteria**:
  - [ ] Commit contains exactly the three `src/lib/*` files.
  - [ ] Evidence file records SHA and staged stat.

  **QA Scenarios**:
  ```
  Scenario: Helper commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD`.
    Expected: Only `src/lib/types.ts`, `src/lib/api.ts`, and `src/lib/settings.ts` appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Secret-free frontend helpers
    Tool: Bash
    Steps: Inspect `GIT_MASTER=1 rtk git show HEAD -- src/lib` for token/secret strings.
    Expected: No hardcoded secrets or Google token values are present.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Add PWA API contracts and settings helpers` | Files: listed above

- [ ] 4. Commit mobile PWA shell and settings UI

  **What to do**:
  1. Stage exactly these files with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- src/main.tsx src/App.tsx src/components/Settings.tsx src/styles.css
     ```
  2. Run this exact staged-stat command:
     ```bash
     { printf '\n## Commit 3 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  3. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Add mobile PWA shell and settings UI"
     ```
  4. Append resulting SHA with this exact command:
     ```bash
     { printf '\n## Commit 3 SHA\n'; GIT_MASTER=1 rtk git log -1 --oneline; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not stage parse/preview components here.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: coherent UI shell commit.
  - Skills: [`git-master`]
  - Omitted: [`playwright`] - final validation covers browser bundle.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: tasks 5-10 | Blocked By: tasks 1-3

  **References**:
  - Pattern: `src/App.tsx` - main PWA state/UI.
  - Pattern: `src/components/Settings.tsx` - connect/calendar settings UI.
  - Pattern: `src/styles.css` - iPhone-first styling.

  **Acceptance Criteria**:
  - [ ] Commit contains exactly the four shell/settings files.
  - [ ] Evidence file records SHA and staged stat.

  **QA Scenarios**:
  ```
  Scenario: UI shell commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD`.
    Expected: Only `src/main.tsx`, `src/App.tsx`, `src/components/Settings.tsx`, `src/styles.css` appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Backend URL setting excluded from PWA
    Tool: Bash
    Steps: Inspect `GIT_MASTER=1 rtk git show HEAD -- src/App.tsx src/components/Settings.tsx` for `Backend URL` or `backendUrl`.
    Expected: No PWA Backend URL setting appears.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Add mobile PWA shell and settings UI` | Files: listed above

- [ ] 5. Commit parse input and editable preview flow

  **What to do**:
  1. Stage exactly these files with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- src/components/EventInput.tsx src/components/EventPreview.tsx
     ```
  2. Run this exact staged-stat command:
     ```bash
     { printf '\n## Commit 4 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  3. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Add mobile event input and preview flow"
     ```
  4. Append resulting SHA with this exact command:
     ```bash
     { printf '\n## Commit 4 SHA\n'; GIT_MASTER=1 rtk git log -1 --oneline; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not stage backend routes or settings UI here.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: paired UI workflow commit.
  - Skills: [`git-master`]
  - Omitted: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: tasks 6-10 | Blocked By: tasks 1-4

  **References**:
  - Pattern: `src/components/EventInput.tsx` - natural-language parse entry.
  - Pattern: `src/components/EventPreview.tsx` - editable event review/create success flow.

  **Acceptance Criteria**:
  - [ ] Commit contains exactly the two event workflow components.
  - [ ] Evidence file records SHA and staged stat.

  **QA Scenarios**:
  ```
  Scenario: Parse/preview commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD`.
    Expected: Only `EventInput.tsx` and `EventPreview.tsx` appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Editable fields preserved
    Tool: Bash
    Steps: Inspect `GIT_MASTER=1 rtk git show HEAD -- src/components/EventPreview.tsx` for title/location/notes/date/time editing controls.
    Expected: Editable preview controls are present in committed diff.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Add mobile event input and preview flow` | Files: listed above

- [ ] 6. Commit web OAuth session routes

  **What to do**:
  1. Stage exactly these files with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- api/web/_session.js api/web/auth/start.js api/web/auth/callback.js api/web/auth/session.js api/web/auth/logout.js
     ```
  2. Run this exact staged-stat command:
     ```bash
     { printf '\n## Commit 5 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  3. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Add web OAuth session routes"
     ```
  4. Append resulting SHA with this exact command:
     ```bash
     { printf '\n## Commit 5 SHA\n'; GIT_MASTER=1 rtk git log -1 --oneline; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not stage calendar proxy routes in this commit.
  - Do not expose refresh/access tokens to frontend code.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: sensitive auth commit requiring careful scan.
  - Skills: [`git-master`]
  - Omitted: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: tasks 7-10 | Blocked By: tasks 1-5

  **References**:
  - Pattern: `api/web/_session.js` - encrypted HttpOnly session helper.
  - Pattern: `api/web/auth/callback.js` - OAuth callback/cancel handling.
  - Pattern: `api/web/auth/session.js` - public session state route.

  **Acceptance Criteria**:
  - [ ] Commit contains exactly the five web auth/session route files.
  - [ ] Staged diff contains no literal client secret, session secret, access token, or refresh token.
  - [ ] Evidence file records SHA and staged stat.

  **QA Scenarios**:
  ```
  Scenario: Auth commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD`.
    Expected: Only the five listed auth/session route files appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Auth secret safety
    Tool: Bash
    Steps: Inspect `GIT_MASTER=1 rtk git show HEAD -- api/web/auth api/web/_session.js` for hardcoded secrets/tokens.
    Expected: Only environment variable names appear; no secret values or token literals appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Add web OAuth session routes` | Files: listed above

- [ ] 7. Commit web calendar proxy routes

  **What to do**:
  1. Stage exactly these files with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- api/web/calendar/list.js api/web/calendar/create.js
     ```
  2. Run this exact staged-stat command:
     ```bash
     { printf '\n## Commit 6 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  3. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Add web calendar proxy routes"
     ```
  4. Append resulting SHA with this exact command:
     ```bash
     { printf '\n## Commit 6 SHA\n'; GIT_MASTER=1 rtk git log -1 --oneline; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not stage auth/session files here.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: backend API commit and git safety.
  - Skills: [`git-master`]
  - Omitted: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: tasks 8-10 | Blocked By: tasks 1-6

  **References**:
  - Pattern: `api/web/calendar/list.js` - server-side Google Calendar list proxy.
  - Pattern: `api/web/calendar/create.js` - server-side Google Events insert proxy.

  **Acceptance Criteria**:
  - [ ] Commit contains exactly the two calendar proxy route files.
  - [ ] Evidence file records SHA and staged stat.

  **QA Scenarios**:
  ```
  Scenario: Calendar commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD`.
    Expected: Only `api/web/calendar/list.js` and `api/web/calendar/create.js` appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Calendar token boundary
    Tool: Bash
    Steps: Inspect `GIT_MASTER=1 rtk git show HEAD -- api/web/calendar`.
    Expected: Calendar routes use server-side session material and do not expose tokens in responses.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Add web calendar proxy routes` | Files: listed above

- [ ] 8. Commit PWA deployment documentation

  **What to do**:
  1. Stage exactly `README.md` with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- README.md
     ```
  2. Run this exact staged-stat command:
     ```bash
     { printf '\n## Commit 7 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  3. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Document PWA deployment and setup"
     ```
  4. Append resulting SHA with this exact command:
     ```bash
     { printf '\n## Commit 7 SHA\n'; GIT_MASTER=1 rtk git log -1 --oneline; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```

  **Must NOT do**:
  - Do not edit documentation beyond already completed README changes unless a validation-blocking factual error is discovered.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: git commit operation with docs review.
  - Skills: [`git-master`]
  - Omitted: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: tasks 9-10 | Blocked By: tasks 1-7

  **References**:
  - Pattern: `README.md` - PWA setup/deployment docs.

  **Acceptance Criteria**:
  - [ ] Commit contains only README.md.
  - [ ] README states PWA has no Backend URL setting and uses same-origin `/api/*` routes.
  - [ ] Evidence file records SHA and staged stat.

  **QA Scenarios**:
  ```
  Scenario: README commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD`.
    Expected: Only `README.md` appears.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: PWA docs scope accurate
    Tool: Bash
    Steps: Inspect `GIT_MASTER=1 rtk git show HEAD -- README.md` for PWA deployment, env vars, and no Backend URL setting.
    Expected: README documents same-origin PWA APIs and online-only first iteration.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Document PWA deployment and setup` | Files: [`README.md`]

- [ ] 9. Commit implementation audit evidence

  **What to do**:
  1. Stage exactly these files with this command:
     ```bash
     GIT_MASTER=1 rtk git add -- .omo/plans/mobile-app-pwa.md .omo/plans/commit-push-mobile-pwa.md .omo/evidence/final-wave-fixes.md .omo/evidence/task-8-iphone-homescreen-happy-path.md .omo/evidence/task-8-failure-matrix.md .omo/evidence/task-6-expired-session.md .omo/evidence/task-6-create-event.md .omo/evidence/task-5-parse-error.md .omo/evidence/task-5-parse-preview.md .omo/evidence/task-4-disconnected-blocked.md .omo/evidence/task-4-settings-persist.md .omo/evidence/task-2-api-client.txt .omo/evidence/task-2-network-error.txt .omo/evidence/task-7-offline-error.md .omo/evidence/task-7-pwa-metadata.txt .omo/evidence/task-3-session-no-token-leak.txt .omo/evidence/task-3-extension-auth-preserved.txt .omo/evidence/task-1-extension-preserved.txt .omo/evidence/task-1-foundation-build.txt .omo/evidence/commit-push-mobile-pwa.md .omo/notepads/mobile-app-pwa/learnings.md .omo/notepads/mobile-app-pwa/problems.md .omo/notepads/mobile-app-pwa/issues.md .omo/notepads/mobile-app-pwa/decisions.md
     ```
  2. Do not stage `.omo/drafts/` or `.omo/run-continuation/`.
  3. Do not stage `.omo/boulder.json`; it must already be ignored by the Task 2 `.gitignore` commit.
  4. Run this exact staged-stat command. It intentionally appends to `.omo/evidence/commit-push-mobile-pwa.md`, so the evidence file must be re-staged in the next step:
     ```bash
     { printf '\n## Commit 8 staged stat\n'; GIT_MASTER=1 rtk git diff --staged --stat; } | tee -a .omo/evidence/commit-push-mobile-pwa.md
     ```
  5. Re-stage the evidence file after the staged-stat append with this exact command:
     ```bash
     GIT_MASTER=1 rtk git add -- .omo/evidence/commit-push-mobile-pwa.md
     ```
  6. Commit with this command:
     ```bash
     GIT_MASTER=1 rtk git commit -m "Preserve PWA implementation evidence"
     ```
  7. Do not try to record this commit's own SHA inside the committed evidence file. Record the evidence commit SHA in the final response after Task 10.

  **Must NOT do**:
  - Do not stage `.omo/drafts/commit-push-mobile-pwa.md`.
  - Do not stage `.omo/run-continuation/`.
  - Do not stage `.omo/boulder.json`.
  - Do not stage secrets or logs.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: careful artifact selection and final commit before push.
  - Skills: [`git-master`]
  - Omitted: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: task 10 | Blocked By: tasks 1-8

  **References**:
  - Plan: `.omo/plans/mobile-app-pwa.md` - completed implementation plan.
  - Plan: `.omo/plans/commit-push-mobile-pwa.md` - this execution handoff.
  - Evidence: `.omo/evidence/` - validation and QA artifacts.
  - Notepad: `.omo/notepads/mobile-app-pwa/` - decisions/learnings/issues/problems.

  **Acceptance Criteria**:
  - [ ] Commit contains only intended `.omo` audit artifacts.
  - [ ] `.omo/drafts/`, `.omo/run-continuation/`, and `.omo/boulder.json` are absent from commit.
  - [ ] Evidence file records staged stat before this commit; the evidence commit SHA is recorded only in the final response.

  **QA Scenarios**:
  ```
  Scenario: Evidence commit staged correctly
    Tool: Bash
    Steps: Run `GIT_MASTER=1 rtk git show --name-only --oneline HEAD`.
    Expected: Only intended `.omo/plans`, `.omo/evidence`, `.omo/notepads/mobile-app-pwa` paths appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md

  Scenario: Session internals excluded
    Tool: Bash
    Steps: Inspect `GIT_MASTER=1 rtk git show --name-only --oneline HEAD` for `.omo/drafts`, `.omo/run-continuation`, and `.omo/boulder.json`.
    Expected: None of those paths appear.
    Evidence: .omo/evidence/commit-push-mobile-pwa.md
  ```

  **Commit**: YES | Message: `Preserve PWA implementation evidence` | Files: listed above

- [ ] 10. Final validation, push, and remote verification

  **What to do**:
  1. Run final build with this exact command. Do not append to committed evidence now because doing so after Task 9 would dirty the worktree:
     ```bash
     npm run build
     ```
  2. Run final cleanliness check with this exact command:
     ```bash
     GIT_MASTER=1 rtk git status --porcelain --untracked-files=normal
     ```
     Abort rule: if the command prints any output, stop and report the output; do not push.
  3. Run final branch status with this exact command:
     ```bash
     GIT_MASTER=1 rtk git status --short --branch
     ```
  4. Run immediate pre-push fetch and exact ahead/behind guard with this fail-closed command:
     ```bash
     bash -e -o pipefail <<'BASH'
     GIT_MASTER=1 rtk git fetch origin
     PRE_PUSH_COUNTS=$(GIT_MASTER=1 rtk git rev-list --left-right --count origin/main...HEAD)
     printf 'PRE_PUSH_COUNTS=%s\n' "$PRE_PUSH_COUNTS"
     test "$PRE_PUSH_COUNTS" = "0 8"
     BASH
     ```
     Abort rule: if the command exits non-zero or prints anything other than `PRE_PUSH_COUNTS=0 8`, stop and report; do not push.
  5. Run outgoing commit review with this exact command and include output in the final response:
     ```bash
     GIT_MASTER=1 rtk git log --oneline origin/main..HEAD
     ```
  6. Push with this exact command:
     ```bash
     GIT_MASTER=1 rtk git push origin main
     ```
  7. Fetch and compare local/remote SHAs with this fail-closed command:
     ```bash
     bash -e -o pipefail <<'BASH'
     GIT_MASTER=1 rtk git fetch origin
     LOCAL_SHA=$(GIT_MASTER=1 rtk git rev-parse HEAD)
     REMOTE_SHA=$(GIT_MASTER=1 rtk git rev-parse origin/main)
     printf 'LOCAL_SHA=%s\nREMOTE_SHA=%s\n' "$LOCAL_SHA" "$REMOTE_SHA"
     test "$LOCAL_SHA" = "$REMOTE_SHA"
     BASH
     ```
  8. Run post-push build validation with this exact command and include output in the final response:
     ```bash
     npm run build
     ```
  9. Run final status with this exact command and include output in the final response:
     ```bash
     GIT_MASTER=1 rtk git status --short --branch
     ```

  **Must NOT do**:
  - Do not use `--force` or `--force-with-lease`.
  - Do not push if build fails.
  - Do not push if branch is behind/diverged.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: final release-grade git operation.
  - Skills: [`git-master`]
  - Omitted: [`playwright`] - browser QA already completed in mobile PWA plan; build is the final automated gate.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: final verification | Blocked By: tasks 1-9

  **References**:
  - Pattern: `package.json:6-10` - build script.
  - Git upstream: `origin/main` - final remote target.

  **Acceptance Criteria**:
  - [ ] `npm run build` exits 0 after commit series before push and after push.
  - [ ] Immediate pre-push `rev-list --left-right --count origin/main...HEAD` output is exactly `0 8`.
  - [ ] Push to `origin/main` succeeds.
  - [ ] `HEAD` SHA equals `origin/main` SHA after fetch.
  - [ ] Final status is clean; ignored generated/runtime artifacts may exist but do not appear in normal status.

  **QA Scenarios**:
  ```
  Scenario: Successful push verification
    Tool: Bash
    Steps: Run final build, push, fetch, SHA comparison, and status commands.
    Expected: Build exits 0, push succeeds, local and remote SHAs match, status is clean.
    Evidence: Executor final response

  Scenario: Protected branch rejection
    Tool: Bash
    Steps: Attempt `GIT_MASTER=1 rtk git push origin main`.
    Expected: If rejected by branch protection, stop immediately, record rejection output, and do not force-push or bypass.
    Evidence: Executor final response
  ```

  **Commit**: NO | Message: n/a | Files: none

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Strategy: new commits only, no rewrite.
- Branch: `main`.
- Remote target: `origin/main`.
- Commit messages:
  1. `Add Vite PWA project scaffold`
  2. `Add PWA API contracts and settings helpers`
  3. `Add mobile PWA shell and settings UI`
  4. `Add mobile event input and preview flow`
  5. `Add web OAuth session routes`
  6. `Add web calendar proxy routes`
  7. `Document PWA deployment and setup`
  8. `Preserve PWA implementation evidence`
- No optional extra commits are planned. If unexpected non-ignored artifacts remain, stop and report instead of inventing a new commit.

## Success Criteria
- Completed commit series appears in `GIT_MASTER=1 rtk git log --oneline origin/main~10..origin/main` after push.
- `npm run build` passes after push.
- `GIT_MASTER=1 rtk git status --short --branch` reports clean `main...origin/main`.
- `.omo/evidence/commit-push-mobile-pwa.md` records pre-push validation and commit trail; executor final response records push/remote verification.
