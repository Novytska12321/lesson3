---
name: ticket-to-plan
description: >-
  Fetches a GitHub issue via MCP and drafts an implementation plan in this
  Angular + TypeScript repo. Use when the user invokes ticket-to-plan,
  provides a GitHub issue number or URL, or asks to plan work from a GitHub
  issue. Does not implement code — execution is a separate step.
---

Given an issue reference (e.g. `#123` or a GitHub URL), retrieve it with GitHub MCP and produce an approved implementation plan. **Stop after plan approval — do not write or change application code.**

## Inputs

- Issue number or URL, e.g. `ticket-to-plan #123`

## Prerequisites

- GitHub MCP (`user-github`) configured and authenticated
- Access to the current repository

## Steps

### 1. Read project context

Before scoping work, read:

- `.cursor/AGENTS.md` — repo conventions, folder layout, commands
- `.cursor/docs/frontend/angular-module-architecture.md` — View module layering and naming
- `.cursor/rules/frontend/angular-architecture.mdc` — enforced architecture rules
- `.cursor/docs/integrations/` — integration docs relevant to the issue (e.g. `open-trivia-db.md`)

### 2. Fetch issue context

Resolve `owner` and `repo` from `git remote get-url origin` (currently `Novytska12321/lesson3`).

Use GitHub MCP (`user-github`):

| Tool         | Method         | Purpose                                 |
| ------------ | -------------- | --------------------------------------- |
| `issue_read` | `get`          | title, body, labels, assignees, state   |
| `issue_read` | `get_comments` | discussion context (paginate if needed) |
| `issue_read` | `get_labels`   | label details when needed               |

If MCP is unavailable, stop and ask the user to paste issue content.

### 3. Clarify acceptance criteria

Extract explicit and implicit AC from the issue text.
If ambiguous, ask 1–3 concrete questions before writing the plan.

### 4. Scope analysis

Identify impacted areas:

- View modules (`src/app/views/<name>/`) — follow `.cursor/docs/frontend/angular-module-architecture.md`
- routing (`src/app/app.routes.ts`) — including route-level `providers` for port bindings
- root providers (`src/app/app.config.ts`) — e.g. `provideHttpClient()` when a feature adds HTTP
- app shell and global navigation (`src/app/app.ts`, `src/app/app.html`)
- shared code (`src/app/shared/`)
- global styles (`src/styles.css`, `.postcssrc.json`)
- build config, assets, and budgets (`angular.json`)
- typings and strictness (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`)

This repo uses **Vitest** through `@angular/build:unit-test` (`npm test`). There is **no ESLint setup** — do not assume `npm run lint` exists.

### 5. Find local patterns

Locate 1–2 similar existing implementations and reuse their conventions (e.g. how `views/game/ui/` is structured, how routes are declared).

### 6. Produce implementation plan

Save the plan to `.cursor/plans/<issue-number>-<slug>.plan.md` (per `.cursor/rules/plans.mdc`).

Include:

- Type: feature / bugfix / refactor
- Risk: low / medium / high
- Source: GitHub issue number and title
- Target architecture tier for each affected View
- Files to change
- Ordered implementation steps
- Verification steps (`npm test`, `npm run build`, plus manual checks)
- Edge cases

### 7. Approval gate

Ask the user to approve the plan.

- **Do not implement** any code in this skill — even after approval.
- When the user approves, confirm the plan is ready and stop.
- Optionally note that the user can execute the approved plan in a follow-up request.

### 8. Final report

Provide:

- path to the saved plan file
- summary of scope and key implementation steps
- how the plan maps to issue acceptance criteria
- open questions or risks identified during planning
