---
name: draft-to-requirement
description: >-
  Turns a rough feature draft into a structured English requirements document
  under `.cursor/requirements/`. Use when the user invokes `draft-to-requirement`
  and pastes a draft (any language), or asks to formalize a feature idea into
  requirements. After user approval, may optionally create a matching GitHub
  issue.
---

Transform a user's preliminary requirement draft into a structured requirements markdown file for this Angular + TypeScript quiz app.

## Inputs

- Skill name plus draft in the same message, e.g.:

```text
draft-to-requirement

<rough feature draft here — any language>
```

- The draft may be written in **any language**. Interpret it in that language; write the final requirements file **in English**.

If the user invokes the skill without a draft, ask them to paste one before continuing. Do not invent a feature from scratch.

## Prerequisites

- Access to the current repository
- For optional GitHub issue creation: GitHub MCP (`user-github`) preferred; GitHub CLI (`gh`) as fallback

## Steps

### 1. Read project context

Before asking questions or writing the file, read:

- `.cursor/AGENTS.md` — repo conventions, folder layout, commands
- `.cursor/docs/frontend/angular-module-architecture.md` — View module layering, tiers, dependency direction
- `.cursor/rules/frontend/angular-architecture.mdc` — enforced architecture rules for Angular files
- `.cursor/docs/integrations/` — relevant integration docs when the draft mentions external APIs or services (e.g. `open-trivia-db.md`)

Use this context to interpret the draft in terms of Views (`src/app/views/<name>/`), routing (`src/app/app.routes.ts`), root providers (`src/app/app.config.ts`), shared code, and architecture tiers — not as generic web-app requirements.

### 2. Read and understand the draft

- Start from the rough draft provided in the chat (after the skill name).
- Identify the feature goal, actors, flows, constraints, and implicit assumptions.
- Note gaps and ambiguities that block a complete requirements document.

### 3. Clarify missing information (optional, one question at a time)

- **Do not** dump a numbered list of questions upfront.
- Ask **one focused question at a time**.
- Clarification questions may be asked in the **same language as the user's draft** for a smoother conversation.
- After each user answer: analyze the response, update your understanding, then ask the next question only if still needed.
- Stop asking when you have enough information to write a complete requirements document.
- When clarification is complete, **explicitly tell the user** that you have enough information and will proceed to write the requirements file.

If the draft is already complete enough, skip clarification and proceed directly (still announce that you have enough information).

### 4. Write the requirements document

Save to `.cursor/requirements/<slug>.md` using a short kebab-case slug derived from the feature name (e.g. `dark-mode-settings`, `user-profile-v1`).

**Write the entire document in English** — headings, body text, table content, and acceptance criteria. Translate and normalize terminology from the draft; do not leave mixed-language sections unless a proper noun or API identifier must stay as-is.

Include YAML frontmatter with `last-updated` (YYYY-MM-DD), consistent with existing docs.

Recommended sections (adapt as needed):

- **Overview** — goal and scope in plain language
- **Functional requirements** — flows, states, user actions (use tables where helpful)
- **UI / layout** — what appears where, per state
- **Data / integrations** — APIs, persistence, error handling
- **Rules & constraints** — scoring, timing, validation, architecture notes (View tier, affected modules)
- **Out of scope** — explicit non-goals
- **Acceptance criteria** — testable checklist items (`- [ ] ...`)

Ground requirements in this repo's stack (Angular 21, standalone components, signals, zoneless change detection, Tailwind CSS v4, Vitest) and **View module architecture**.

### 5. Final report

After saving the file, briefly summarize:

- Path to the new requirements file
- Key decisions made during clarification
- Any remaining open questions or follow-ups (if any)

### 6. Approval gate and optional GitHub issue

After the final report, **ask the user to review and approve** the requirements document.

- Present a short prompt asking whether the requirements look correct.
- If approved, **offer to create a GitHub issue** whose description is the same as the saved `.cursor/requirements/<slug>.md` file (use the file body as the issue body; derive a concise issue title from the feature name or Overview section).
- **Do not create the issue without explicit user confirmation.**

If the user accepts issue creation:

1. Resolve `owner` and `repo` from `git remote get-url origin` (currently `Novytska12321/lesson3`).
2. **Prefer GitHub MCP** (`user-github`):
   - Optionally use `search_issues` first to avoid creating a duplicate.
   - Use `issue_write` with `method: create`, passing `title` and `body` (contents of the requirements file).
3. **Fallback:** if GitHub MCP is unavailable or not authenticated, use the GitHub CLI:

   ```bash
   gh issue create --title "<title>" --body-file .cursor/requirements/<slug>.md
   ```

4. If both MCP and `gh` are unavailable, report the failure and provide the file path so the user can create the issue manually.
5. Report the created issue number and URL to the user.

If the user requests changes, update the requirements file and repeat the approval step before offering issue creation again.

## Output locations

| Item               | Path                                           |
| ------------------ | ---------------------------------------------- |
| This skill         | `.cursor/skills/draft-to-requirement/SKILL.md` |
| Requirements files | `.cursor/requirements/<slug>.md`               |

## Notes

- Downstream skills (e.g. `ticket-to-plan`) may consume the saved requirements file or the created GitHub issue.
- Do not implement the feature as part of this skill — only produce the requirements artifact (and optionally the issue).
