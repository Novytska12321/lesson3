---
last-updated: 2026-08-24
---

# Open Trivia DB Integration

Concise, implementation-oriented guidance for integrating [Open Trivia DB](https://opentdb.com/) into this Angular quiz app. Prefer this document over the official API pages when generating project code.

## Purpose

Open Trivia DB supplies free trivia questions (multiple choice and true/false) used by the Game view. All HTTP access goes through the Game View's resource port (`TRIVIA_RESOURCE` in `src/app/views/game/api/`) — not directly from UI components.

## Base URL

```text
https://opentdb.com
```

## Authentication

No API key or authentication is required. Requests are public. Respect the rate limit (see Response Codes and Known API Limitations).

## Main Endpoints

### Get Questions

```http
GET /api.php
```

| Query param  | Required | Description                                                  |
| ------------ | -------- | ------------------------------------------------------------ |
| `amount`     | yes      | Number of questions (`1`–`50`)                               |
| `category`   | no       | Category id from Get Categories                              |
| `difficulty` | no       | `easy`, `medium`, or `hard`                                  |
| `type`       | no       | `multiple` or `boolean`                                      |
| `encode`     | no       | `urlLegacy`, `url3986`, or `base64` (default: HTML entities) |
| `token`      | no       | Session token to avoid duplicate questions                   |

Example:

```text
https://opentdb.com/api.php?amount=10&category=9&difficulty=easy&type=multiple&token=SESSION_TOKEN
```

### Get Categories

```http
GET /api_category.php
```

Returns all category names and stable numeric ids. No query parameters.

### Get Category Statistics

```http
GET /api_count.php?category={id}
```

Returns total / easy / medium / hard question counts for one category.

Global counts (all categories):

```http
GET /api_count_global.php
```

### Session Tokens

| Action        | Request                                          |
| ------------- | ------------------------------------------------ |
| Request token | `GET /api_token.php?command=request`             |
| Reset token   | `GET /api_token.php?command=reset&token={token}` |

- Append `token` to Get Questions calls so the API never repeats a question for that session.
- Tokens expire after **6 hours** of inactivity.
- When `response_code` is `4` (token empty), reset the token or request a new one before continuing.

## Response Codes

Every questions response includes `response_code`. Always validate it before using `results`.

| Code | Name              | Meaning                                                     |
| ---- | ----------------- | ----------------------------------------------------------- |
| `0`  | Success           | Results returned successfully                               |
| `1`  | No Results        | Not enough questions for the query                          |
| `2`  | Invalid Parameter | Invalid query arguments                                     |
| `3`  | Token Not Found   | Session token does not exist                                |
| `4`  | Token Empty       | Token exhausted for this query; reset required              |
| `5`  | Rate Limit        | Too many requests; max **1 request per IP every 5 seconds** |

## Important Notes

- Default encoding wraps special characters as HTML entities (e.g. `&quot;`, `&amp;`). Decode before display.
- Incorrect answers arrive in `incorrect_answers`; the correct answer is separate in `correct_answer`. Combine and shuffle client-side.
- Only one `category` per questions request. Omit `category` for mixed categories.
- Prefer Session Tokens for multi-round or long sessions to reduce duplicates.

## Project Guidelines

When implementing or changing Open Trivia DB usage in this repo:

- Register `provideHttpClient()` in `src/app/app.config.ts` before the first HTTP call — it is not configured yet.
- Call the API only through the Game View's resource port; keep `HttpClient` out of `game.component.ts` and presentational components.
- Bind `TRIVIA_RESOURCE` to `HttpTriviaResource` in the `game` route's `providers`, and to `MockTriviaResource` in tests.
- Decode HTML entities (or use an explicit `encode` mode and decode accordingly) before showing questions and answers.
- Shuffle the answer list before presenting it; keep track of which option is correct after shuffling.
- Use Session Tokens to prevent duplicate questions across a play session.
- Support cancellation — `resource()` passes an `AbortSignal` to its loader; forward it, or use `takeUntilDestroyed()` when working with observables.
- Always check `response_code` and map non-zero codes to clear UI / error states. Handle rate limiting (`5`) with a retry delay of at least 5 seconds.
- Use strongly typed TypeScript models for requests, responses, and domain entities (`Question`, `Category`, `SessionToken`).
- Keep side effects (network, token storage) in the store or resource services — never in template expressions or getters.
- Style UI with Tailwind; do not introduce new styling systems for API-driven screens.

Suggested module layout inside the Game View (Tier 2+ per `.cursor/docs/frontend/angular-module-architecture.md`):

```text
src/app/views/game/
├── index.ts
├── api/
│   ├── question.model.ts            # read model types
│   ├── category.model.ts
│   └── trivia.resource.ts           # port interface + TRIVIA_RESOURCE token
├── infrastructure/
│   ├── dto/                         # Open Trivia DB JSON shapes
│   ├── mappers/                     # DTO → model (decode, shuffle)
│   └── resources/
│       ├── http-trivia.resource.ts
│       └── mock-trivia.resource.ts
├── store/
│   └── game.store.ts                # signals + resource() loader
└── ui/
    ├── game.component.{ts,html,css}
    └── components/                  # presentational quiz UI

src/app/shared/                      # only if a second View needs the same code
└── utils/
    ├── decode-html.ts
    └── shuffle.ts
```

## Example Requests

```http
GET https://opentdb.com/api.php?amount=2&type=multiple
GET https://opentdb.com/api_category.php
GET https://opentdb.com/api_count.php?category=9
GET https://opentdb.com/api_token.php?command=request
GET https://opentdb.com/api_token.php?command=reset&token=YOUR_TOKEN
```

## Example Responses

### Get Questions (`response_code: 0`)

```json
{
  "response_code": 0,
  "results": [
    {
      "type": "multiple",
      "difficulty": "easy",
      "category": "General Knowledge",
      "question": "What is the capital of France?",
      "correct_answer": "Paris",
      "incorrect_answers": ["London", "Berlin", "Madrid"]
    }
  ]
}
```

### Get Categories

```json
{
  "trivia_categories": [
    { "id": 9, "name": "General Knowledge" },
    { "id": 10, "name": "Entertainment: Books" }
  ]
}
```

### Get Category Statistics

```json
{
  "category_id": 9,
  "category_question_count": {
    "total_question_count": 300,
    "total_easy_question_count": 100,
    "total_medium_question_count": 120,
    "total_hard_question_count": 80
  }
}
```

### Session Token (request)

```json
{
  "response_code": 0,
  "response_message": "Token Generated Successfully!",
  "token": "EXAMPLE_TOKEN_STRING"
}
```

## Data Model

Application-facing models (normalize API payloads into these before UI use):

### Question

| Field                | Type                           | Notes                                      |
| -------------------- | ------------------------------ | ------------------------------------------ |
| `id`                 | `string`                       | Client-generated stable id if API has none |
| `type`               | `'multiple' \| 'boolean'`      | From API `type`                            |
| `difficulty`         | `'easy' \| 'medium' \| 'hard'` | From API                                   |
| `category`           | `string`                       | Category display name from API             |
| `categoryId`         | `number \| null`               | Optional; set when request used a category |
| `question`           | `string`                       | Decoded question text                      |
| `correctAnswer`      | `string`                       | Decoded correct answer                     |
| `incorrectAnswers`   | `string[]`                     | Decoded incorrect answers                  |
| `answers`            | `string[]`                     | Shuffled options for display               |
| `correctAnswerIndex` | `number`                       | Index of correct option in `answers`       |

### Category

| Field  | Type     | Notes                             |
| ------ | -------- | --------------------------------- |
| `id`   | `number` | Stable Open Trivia DB category id |
| `name` | `string` | Display name                      |

### Session Token

| Field       | Type     | Notes                                         |
| ----------- | -------- | --------------------------------------------- |
| `value`     | `string` | Token string from `api_token.php`             |
| `createdAt` | `number` | Client timestamp (ms) when obtained           |
| `expiresAt` | `number` | Optional; treat as stale after ~6h inactivity |

## Known API Limitations

- Maximum **50** questions per Get Questions request.
- Question and answer text are HTML-entity encoded by default.
- Answers are returned in a fixed API order; the client must shuffle for fair UI.
- No authentication; rate limit is **1 request per IP every 5 seconds** (`response_code` `5`).
- Always inspect `response_code`; never assume `results` is usable when the code is non-zero.
- Category ids are stable across calls; prefer ids over names for filtering.
- Only one category per questions request.
- Session tokens can empty (`response_code` `4`) when the filtered pool is exhausted.
- Official docs: [opentdb.com/api_config.php](https://opentdb.com/api_config.php).
