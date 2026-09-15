# Testing and Quality

## Current State

There is no automated test suite in the repository. `server/package.json` defines `npm test` as a placeholder command that prints `Tests: Phase 4+` and exits successfully. The client has ESLint and a production build script; the server has no lint or test tooling configured.

That is an important delivery limitation: a passing `npm test` is not evidence of behavioral coverage.

## Available Checks

From `client/`:

```bash
npm run lint
npm run build
```

From `server/`:

```bash
npm start
npm test
```

The API can also be checked manually with `GET /health`, registration/login, and the protected flows. AI checks require MongoDB, valid JWT configuration, and an OpenAI key.

## Recommended Test Shape

The existing module boundaries make focused tests straightforward without changing the architecture:

- Unit-test meal total calculation, date parsing, goal selection, pagination cursor encoding, AI confidence rules, and error mapping.
- Repository/integration-test user scoping, effective-dated goals, meal CRUD, cursor pagination, and nutrition aggregation against a disposable MongoDB database.
- API-test public/protected route behavior, Zod failures, refresh rotation, rate-limit responses, upload validation, and consistent error envelopes.
- Client-test auth guards, token refresh queue behavior, meal forms, scanner confirmation, and chat action refresh events.
- Test CSV header mapping, preview validation, meal-type normalization, optional fat values, partial import failures, and confirmed rows passing through shared meal validation.
- Use mocked OpenAI responses for deterministic label and plate validation; do not spend provider calls in ordinary CI.

## Highest-Value Cases

1. A meal update recomputes totals and cannot read or mutate another user's meal.
2. A refresh token is single-use and the replacement token works.
3. An expired access token triggers one refresh and retries concurrent requests without a refresh storm.
4. Invalid image type, image size, malformed provider JSON, and schema-invalid provider output fail safely.
5. Plate confidence never presents as high, and an AI draft is not persisted until confirmation.
6. Cursor pagination returns stable pages and `hasMore` correctly.
7. Reports use only the authenticated user's meals and apply the selected date range.
8. Provider, database, validation, and unexpected errors retain the documented status/code shape.
9. A meal with invalid calorie-to-macro consistency is rejected consistently through manual, AI, chat, and CSV write paths.
10. Selecting 7 days and 30 days requests the matching date range and renders the matching report labels and missing-day behavior.

## Quality Gaps and Next Step

The next engineering increment should add a test runner and a small API integration suite before adding infrastructure. A generated API contract, coverage threshold, CI workflow, and production smoke check would improve confidence after the assignment. These are future improvements; they are not currently present.
