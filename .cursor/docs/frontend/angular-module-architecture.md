---
last-updated: 2026-08-24
---

# Frontend View Architecture (Angular + TypeScript)

Universal layer model, folder layout, and tier patterns for **View + Angular** projects. Each screen or functional area is a **View module** — a self-contained vertical slice with a clear separation of concerns (contract → logic → I/O → UI).

> **Principle:** use **Angular idioms** — standalone components, signals, `inject()`, `InjectionToken` ports, route-level providers, RxJS only where streams genuinely help. Do not port React patterns (Context providers, hook-shaped state) literally; express the same layering with Angular's DI and signals.

---

## 1. Layer model

Dependency direction (always inward):

```
UI ──> STORE/FACADE ──> INFRASTRUCTURE ──> DOMAIN ──> API/MODEL
```

| Layer                 | Responsibility                                                                                | Contains                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **API/MODEL**         | Public contract. **Innermost** layer. No Angular decorators, no HTTP, no other View layers.   | `interface`/`type` read models, port interfaces, `InjectionToken`s, constants  |
| **DOMAIN** (optional) | Business logic without Angular or I/O. Imports **only** `api/`.                               | Pure functions, validation, scoring rules (`*.rules.ts`)                       |
| **INFRASTRUCTURE**    | Concrete I/O and mapping. Imports `api/` and optionally `domain/`.                            | `dto/`, `mappers/`, `resources/` (`HttpClient` services), mocks                |
| **STORE/FACADE**      | State orchestration with signals; the single surface the UI talks to. Injectable, not global. | `FooStore` (`@Injectable`), signals, `computed`, `resource()`, command methods |
| **UI**                | Presentation only. Injects the store or receives `input()`s.                                  | `FooComponent` entry, presentational child components, templates               |

### Dependency rules

- **API/MODEL** has no internal dependencies on other View layers.
- **DOMAIN** imports only from **API/MODEL**.
- **INFRASTRUCTURE** imports from **API/MODEL** and **DOMAIN**.
- **STORE** imports from **API/MODEL**, **DOMAIN**, and **INFRASTRUCTURE** — never from **UI**.
- **UI** imports from **API/MODEL** and the store — never DTOs, never `HttpClient`.

The **composition root** is the route definition or the View's `providers` array — the only place that binds a port `InjectionToken` to a concrete implementation.

---

## 2. View module structure

One folder per View (vertical slice):

```text
src/app/views/foo/
├── index.ts                          # public barrel
├── api/
│   ├── foo.model.ts                  # read model types
│   └── foo.resource.ts               # port interface + InjectionToken
├── domain/                           # optional
│   └── foo.rules.ts
├── infrastructure/
│   ├── dto/foo-response.dto.ts
│   ├── mappers/map-foo-from-dto.ts
│   └── resources/
│       ├── http-foo.resource.ts
│       └── mock-foo.resource.ts
├── store/
│   └── foo.store.ts
└── ui/
    ├── foo.component.{ts,html,css}   # View entry
    └── components/                   # presentational children private to this View
        ├── foo-list.component.ts
        └── foo-row.component.ts
```

App-level shared code lives outside View folders:

```text
src/app/
├── app.ts / app.html / app.css       # shell
├── app.config.ts                     # root providers
├── app.routes.ts                     # router
├── shared/                           # cross-View components, services, utils, types
└── views/                            # View modules
```

**Rules:**

- A View imports from its own layers and from `shared/` — not from another View's internal folders.
- Cross-View consumption goes through the other View's `index.ts` barrel, or through `shared/`.
- Extract to `shared/` only when a **second** View genuinely needs the same code.

### Current state of this repo

`views/game/` already uses the `ui/` folder. `views/home/` is still flat (`home.component.ts` at the View root) — that is fine for a Tier 0/1 View. Move it into `ui/` when the View gains other layers.

---

## 3. Complexity tiers

Start with the simplest tier; promote only when a real business rule emerges.

| Tier | Pattern                                       | When                                                          |
| ---- | --------------------------------------------- | ------------------------------------------------------------- |
| 0    | Single presentational component               | Stateless UI, `input()` only                                  |
| 1    | `ui + store`                                   | Simple View, local signal state, no HTTP                      |
| 2    | `ui + store + infrastructure + api`            | Load / CRUD Views, DTO mapping, no logic beyond conversion    |
| 3    | `ui + store + infrastructure + domain + api`   | Validation, scoring, multi-step flows, non-trivial state      |

**Tier 2 rule:** mappers convert DTO → API model directly. If logic beyond mapping is needed, promote to Tier 3.

**Tier 3 call chain:**

```
FooComponent renders
  → fooStore.items()                    ← signal
    → resource({ loader })              ← store
      → fooResource.getList()           ← port (api/)
            ↑ bound in route providers →
        HttpFooResource                 ← infrastructure
          → mapFooListFromDto(dto)      ← mapper
            → validateFooList(items)    ← domain (pure)
```

---

## 4. Ports and dependency injection

Declare the port in `api/`, implement it in `infrastructure/`, bind it at the composition root.

```typescript
// api/foo.resource.ts
import { InjectionToken } from '@angular/core';
import type { Foo } from './foo.model';

export interface FooResource {
  getList(): Promise<Foo[]>;
}

export const FOO_RESOURCE = new InjectionToken<FooResource>('FOO_RESOURCE');
```

```typescript
// infrastructure/resources/http-foo.resource.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpFooResource implements FooResource {
  private readonly http = inject(HttpClient);

  async getList(): Promise<Foo[]> {
    const dto = await firstValueFrom(this.http.get<FooResponseDto>('/api/foo'));
    return mapFooListFromDto(dto);
  }
}
```

Bind at the route so the dependency is scoped to the View, not the whole app:

```typescript
// app.routes.ts
{
  path: 'foo',
  loadComponent: () => import('./views/foo').then((m) => m.FooComponent),
  providers: [{ provide: FOO_RESOURCE, useClass: HttpFooResource }],
}
```

Swap `useClass: MockFooResource` for local development or tests without touching UI code.

---

## 5. State placement

| State kind         | Mechanism                                       | Where             |
| ------------------ | ----------------------------------------------- | ----------------- |
| Server state       | `resource()` / `httpResource()` in the store    | `store/`          |
| Derived state      | `computed()`                                     | `store/`          |
| Local UI state     | `signal()` in the component                      | `ui/`             |
| Form state         | Reactive forms or signal-based form model        | `ui/` + `store/`  |
| URL state          | `withComponentInputBinding()` route params       | `ui/` via `input()` |

### Store shape

```typescript
@Injectable()
export class FooStore {
  private readonly resource = inject(FOO_RESOURCE);

  private readonly query = signal('');
  readonly items = resource({
    params: () => ({ query: this.query() }),
    loader: ({ params }) => this.resource.getList(params.query),
  });

  readonly isEmpty = computed(() => this.items.value()?.length === 0);

  setQuery(value: string): void {
    this.query.set(value);
  }
}
```

- Provide the store on the View component (`providers: [FooStore]`) so its lifetime matches the screen.
- Use `providedIn: 'root'` only for genuinely app-wide services.
- Expose **readonly** signals to the UI; mutate state through explicit command methods.
- Prefer signals over `BehaviorSubject`. Use RxJS for event streams, debouncing, and cancellation, then bridge with `toSignal()`.

---

## 6. Components

| Type           | Convention                                  | Role                                                   |
| -------------- | ------------------------------------------- | ------------------------------------------------------ |
| View entry     | `foo.component.ts` in `ui/`                 | Screen layout, injects the store, loading/error/empty  |
| Presentational | `foo-list.component.ts` in `ui/components/` | `input()` in, template out — no HTTP, no store         |

### Component rules

- Standalone; list dependencies in `imports`.
- `changeDetection: ChangeDetectionStrategy.OnPush` on every new component.
- `input()` / `output()` signal APIs, not `@Input()` / `@Output()` decorators.
- Built-in control flow (`@if`, `@for` with `track`, `@switch`) — not the legacy structural directives.
- Keep logic in the store, not in 200-line component classes.
- No side effects in getters or template expressions. Use event handlers, `effect()`, or the store.
- Export only the public API from `index.ts` (`FooComponent`, port tokens, model types).

---

## 7. Naming conventions

| Artifact        | Convention                          | Example                        | Layer                       |
| --------------- | ----------------------------------- | ------------------------------ | --------------------------- |
| Read model      | `Foo`, `FooItem`                    | `Question`, `Category`         | `api/`                      |
| Port interface  | `FooResource`                       | `interface TriviaResource`     | `api/`                      |
| Port token      | `FOO_RESOURCE`                      | `TRIVIA_RESOURCE`              | `api/`                      |
| HTTP impl       | `HttpFooResource`                   | `HttpTriviaResource`           | `infrastructure/resources/` |
| Mock impl       | `MockFooResource`                   | `MockTriviaResource`           | `infrastructure/resources/` |
| DTO             | `FooResponseDto`                    | `TriviaResponseDto`            | `infrastructure/dto/`       |
| Mapper          | `mapFooFromDto`                     | pure function                  | `infrastructure/mappers/`   |
| Store           | `FooStore`                          | `GameStore`                    | `store/`                    |
| View component  | `FooComponent`                      | `GameComponent`                | `ui/`                       |
| Domain rule     | `validateFoo` / `foo.rules.ts`      | `calculateScore`               | `domain/`                   |
| File names      | kebab-case with role suffix         | `map-foo-from-dto.ts`          | all                         |

---

## 8. Testing

Test runner is **Vitest** via `@angular/build:unit-test` (`npm test`), with jsdom.

- **Mappers / domain** — plain unit tests on pure functions (highest ROI).
- **Stores** — instantiate through `TestBed` with a mock resource bound to the port token.
- **Components** — `TestBed.configureTestingModule({ imports: [FooComponent] })`, override the port token or store provider with a test double.

Spec files sit next to the code they cover (`foo.component.spec.ts`).

---

## 9. Complexity decision guide

```
Does the View need data from an API?
  No  → Tier 0 (presentational) or Tier 1 (ui + store)
  Yes →
    Is there business logic beyond DTO mapping?
      No  → Tier 2 (ui + store + infrastructure + api)
      Yes → Tier 3 (add domain/)
```

Rule of thumb: **start with the simplest tier and promote only when a real business rule emerges.**

---

## 10. Anti-patterns

| Don't                                       | Do instead                                                   |
| ------------------------------------------- | ------------------------------------------------------------ |
| `HttpClient` injected in a component        | Store calls a resource port; component reads signals         |
| DTOs in `api/` or `ui/`                     | Convert at the infrastructure boundary via mappers           |
| Port interfaces declared in `infrastructure/` | Declare in `api/`; implement in `infrastructure/`          |
| `providedIn: 'root'` for View-local state   | Provide the store on the View component or route             |
| Mutating plain class fields for state       | `signal()` — the app is zoneless                             |
| `*ngIf` / `*ngFor`                          | `@if` / `@for` with `track`                                  |
| `@Input()` / `@Output()` decorators         | `input()` / `output()`                                       |
| God component (300+ lines)                  | View component + store + presentational children             |
| Deep imports into another View's folders    | Public `index.ts` or `shared/`                               |
| `window.location` for navigation            | `routerLink` / `Router.navigate`                             |
| Subscribing without cleanup                 | `toSignal()`, `takeUntilDestroyed()`, or the async pipe      |

---

## 11. Example View module (Tier 3)

```text
src/app/views/game/
├── index.ts
├── api/
│   ├── question.model.ts
│   └── trivia.resource.ts
├── domain/
│   └── scoring.rules.ts
├── infrastructure/
│   ├── dto/trivia-response.dto.ts
│   ├── mappers/map-question-from-dto.ts
│   └── resources/
│       ├── http-trivia.resource.ts
│       └── mock-trivia.resource.ts
├── store/
│   └── game.store.ts
└── ui/
    ├── game.component.{ts,html,css}
    └── components/
        ├── question-card.component.ts
        └── answer-button.component.ts
```

Full rule with editor globs: `.cursor/rules/frontend/angular-architecture.mdc` (`**/*.{ts,html}`).
