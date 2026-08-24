---
last-updated: 2026-08-24
---

# Cursor Agent Guide

Source of truth for AI agents working in this repository.

This repo is an **Angular 21** quiz app built with the `@angular/build` application builder and TypeScript. It uses the Angular Router for navigation, Tailwind CSS v4 (via PostCSS) for styling, Vitest for unit tests, and npm as the package manager.

The app is **zoneless** — `zone.js` is not a dependency. Use signals for reactive state; do not rely on Zone.js change detection.

Frontend code follows the **View module architecture** documented in `.cursor/docs/frontend/angular-module-architecture.md` (enforced in `.cursor/rules/frontend/angular-architecture.mdc` for `**/*.{ts,html}`).

## Folder Structure

```text
.cursor/
├── AGENTS.md
├── docs/
│   ├── frontend/angular-module-architecture.md
│   └── integrations/open-trivia-db.md
├── plans/                       # implementation plans (*.plan.md)
├── requirements/                # feature requirements (<slug>.md)
├── rules/
│   ├── frontend/angular-architecture.mdc
│   └── plans.mdc
└── skills/
    ├── draft-to-requirement/SKILL.md
    └── ticket-to-plan/SKILL.md
public/
└── favicon.ico
src/
├── main.ts                      # bootstrapApplication entry
├── index.html
├── styles.css                   # Tailwind CSS entry
└── app/
    ├── app.ts                   # root App component (shell)
    ├── app.html                 # shell template with <router-outlet>
    ├── app.css
    ├── app.config.ts            # ApplicationConfig — root providers
    ├── app.routes.ts            # route definitions
    ├── shared/                  # cross-View components, services, utils (create when needed)
    └── views/                   # View modules (one folder per screen)
        ├── home/
        │   └── home.component.{ts,html,css,spec.ts}
        └── game/
            └── ui/
                └── game.component.{ts,html,css}
```

As Views grow, add layers inside each View folder per the architecture doc: `api/`, `domain/`, `infrastructure/`, `store/`, `ui/`, plus a public `index.ts` barrel.

## File Summaries

### `src/main.ts`

Bootstraps the app with `bootstrapApplication(App, appConfig)`.

### `src/app/app.config.ts`

Root `ApplicationConfig`. Currently provides `provideBrowserGlobalErrorListeners()` and `provideRouter(routes)`. Add app-wide providers here (`provideHttpClient()`, global port bindings, etc.).

### `src/app/app.routes.ts`

Route table: `home` → `HomeComponent`, `game` → `GameComponent`. Add new routes here and import components from the View's public `index.ts` barrel once one exists. Prefer `loadComponent` for lazy routes as the app grows.

### `src/app/app.ts` / `app.html`

Root shell component. Standalone, imports `RouterOutlet` and `RouterLink`. Global navigation lives in `app.html`.

### `src/app/views/`

One folder per View (vertical slice). Each View exposes its public API through `index.ts`. Do not import another View's internal files — use its barrel or `shared/`.

### `src/app/shared/`

Code reused across multiple Views: UI primitives, services, utils, shared types. Create it when a second View genuinely needs the same code.

### `src/styles.css`

Imports Tailwind via `@import 'tailwindcss'`. Add global styles here only when they cannot live in component classes.

### `angular.json`

Angular CLI workspace config for the `quiz-angular` project: builder options, global `styles`, production budgets, dev-server targets, and the `@angular/build:unit-test` test target.

### `.postcssrc.json`

Registers the `@tailwindcss/postcss` plugin so Tailwind processes `src/styles.css`.

## Quick Routing

| Agent needs to...                | Go to                                                  |
| -------------------------------- | ------------------------------------------------------ |
| Add or change a route            | `src/app/app.routes.ts`                                |
| Add root providers               | `src/app/app.config.ts`                                |
| Edit the app shell / global nav  | `src/app/app.ts`, `src/app/app.html`                   |
| Edit a page / View               | `src/app/views/<name>/`                                |
| Add cross-View shared code       | `src/app/shared/`                                      |
| Change global styles or Tailwind | `src/styles.css`, `.postcssrc.json`                    |
| Adjust build, budgets, or assets | `angular.json`                                         |
| Change TypeScript strictness     | `tsconfig.json`, `tsconfig.app.json`                   |
| Check architecture conventions   | `.cursor/docs/frontend/angular-module-architecture.md` |
| Open Trivia DB integration       | `.cursor/docs/integrations/open-trivia-db.md`          |

## Core Rules

- Follow the View module architecture: dependency direction inward (UI → store → infrastructure → domain → api).
- Import Views via their `index.ts` barrel or from `shared/` — never deep-import another View's internals.
- Components are **standalone** (no `NgModule`). Declare dependencies in the `imports` array.
- Use `inject()` instead of constructor parameter injection in new code.
- Use **signals** (`signal`, `computed`, `linkedSignal`, `resource`) for component state. The app is zoneless — mutating plain fields will not reliably trigger change detection.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on new components.
- Use the built-in control flow (`@if`, `@for`, `@switch`) in templates, not `*ngIf` / `*ngFor`.
- Use `input()` / `output()` signal APIs instead of the `@Input()` / `@Output()` decorators.
- HTTP goes through `HttpClient` inside a View's `infrastructure/` service — never from a component. Remember to add `provideHttpClient()` in `app.config.ts` before the first HTTP call.
- Use Tailwind utility classes for styling. Keep component `.css` files for cases utilities cannot cover; watch the 4 kB per-component style budget.
- Use the Angular Router (`routerLink`, `Router.navigate`) for navigation — do not manipulate `window.location` directly.
- Run the narrowest useful command before finishing (`npm test`, then `npm run build` when a change touches routing or config).

## Common Commands

Run commands from the repository root.

```bash
npm start          # ng serve — dev server
npm run build      # ng build — production build
npm run watch      # ng build --watch --configuration development
npm test           # ng test — Vitest unit tests
npx prettier --write .
```

There is no ESLint setup in this repo yet — do not assume `npm run lint` exists.

## Staleness

All guidance files carry `last-updated`. If a file is older than about 3 months, verify it against the actual codebase and current library docs before following it blindly.
