# API Design

## Conventions

The server mounts routes under `/api/v1` in `server/src/app.js`. Auth routes are public; routes registered after `verifyJwt` require `Authorization: Bearer <accessToken>`. Successful JSON responses use `{ "data": ... }`; list endpoints may also include `{ "pagination": { "nextCursor", "hasMore" } }`. Errors use `{ "error": { "code", "message", "details?" } }`.

The client adds `X-Timezone` to every request and refreshes an expired access token once through `/auth/refresh`. Date filters use `YYYY-MM-DD`; goal `effectiveFrom` uses an ISO datetime.

## Authentication

| Method | Path | Behavior |
|---|---|---|
| POST | `/auth/register` | Validates email/password, hashes with bcrypt, returns access and refresh tokens. |
| POST | `/auth/login` | Verifies credentials and returns tokens. Missing users still incur bcrypt comparison. |
| POST | `/auth/refresh` | Consumes a refresh token and returns a rotated pair. |
| POST | `/auth/logout` | Deletes the supplied refresh token; returns `204`. |
| GET | `/auth/me` | JWT-protected identity summary. |

Request schemas are in `server/src/common/schemas/request.schemas.js`; auth implementation is in `server/src/modules/auth/`.

## Users and Goals

| Method | Path | Behavior |
|---|---|---|
| GET | `/users/me` | Returns the authenticated profile without `passwordHash`. |
| PATCH | `/users/me` | Updates `timezone` when supplied; otherwise returns the current profile. |
| GET | `/goals/current` | Returns the most recent goal or `null`. |
| GET | `/goals?asOf=YYYY-MM-DD` | Returns the latest goal effective on or before the date. |
| GET | `/goals/history?cursor=&limit=` | Returns effective-dated goals with cursor pagination. |
| POST | `/goals` | Creates a goal version with calorie, macro, optional weight, and optional effective date. |

Goal input bounds are enforced by Zod and Mongoose.

## Meals

| Method | Path | Behavior |
|---|---|---|
| POST | `/meals` | Creates a meal. The server computes totals from embedded items. |
| GET | `/meals?from=&to=&mealType=&cursor=&limit=` | Lists owner meals, optionally filtered by inclusive date range/type. Default limit is 20, maximum 100. |
| GET | `/meals/:id` | Returns one owner meal; missing or foreign records appear as `404`. |
| PATCH | `/meals/:id` | Updates meal type, date, and/or items; recalculates totals when items change. |
| DELETE | `/meals/:id` | Deletes an owner meal and returns `204`. |

Meal items contain `name`, `quantity`, `calories`, `macros`, and optional fixed micronutrient fields. `source` supports `manual`, `ai_label`, `ai_plate`, and `import`; the current UI uses manual or confirmed AI values.

List responses contain `data` as the meal array and a pagination object. The cursor encodes the last meal's date and MongoDB id; clients should treat it as opaque.

## Nutrition Reports

All require `from` and `to` query dates and return an aggregation array in `data`:

- `GET /nutrition/trend/weekly`: daily calories and macros.
- `GET /nutrition/macros?granularity=day|week`: grouped calories and macros.
- `GET /nutrition/micros/summary`: daily sums for the fixed micronutrient fields.
- `GET /nutrition/goal-vs-actual`: daily actual totals with the goal active for that date, when one exists.

## AI and Chat

`POST /ai/extract?type=label|plate` accepts a multipart form field named `image`. JPEG, PNG, and WebP are accepted up to 5 MB. It returns a validated extraction draft with a confidence label, numeric score, and warnings. It does not write a meal.

`POST /chat` accepts:

```json
{
  "messages": [
    { "role": "user", "content": "What did I eat today?" }
  ]
}
```

The server validates non-empty `user`/`assistant` messages, trims the model thread to the last 20 messages, and returns `{ "reply": "...", "actionsPerformed": [] }`. Chat is stateless on the server; the client stores the visible conversation in local storage and sends history on each request.

## Error and Rate-Limit Behavior

Zod failures return `400 VALIDATION_ERROR`; auth failures return `401`; unknown resources return `404`; provider failures return `502 AI_PROVIDER_UNAVAILABLE`; missing AI configuration returns `503 AI_NOT_CONFIGURED`; unexpected failures return `500 INTERNAL_SERVER_ERROR`. Auth is limited to 20 requests per 15 minutes per IP and chat to 30 requests per minute per IP. Multer and controller checks reject oversized or disallowed images.

There is no committed OpenAPI document or generated client. The route files and request schemas are currently the contract.
