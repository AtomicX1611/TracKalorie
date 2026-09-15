# Data Model

MongoDB models live in `server/src/modules/*/*.schema.js`. Every user-owned query receives the owner from `req.user.id`, which is populated by JWT middleware rather than accepted from request input.

## Collections

### `users`

Defined in `server/src/modules/users/users.schema.js` and `users.model.js`.

- `email`: required, lowercase, trimmed, unique.
- `passwordHash`: required and excluded from JSON serialization.
- `timezone`: optional in requests, defaults to `UTC`.
- `createdAt`, `updatedAt`: Mongoose timestamps.

The unique email index supports login lookup and duplicate registration handling.

### `refreshTokens`

Defined in `server/src/modules/auth/auth.schema.js`.

- `token`: unique opaque UUID.
- `userId`: required reference to `User`.
- `expiresAt`: required date.
- timestamps.

A TTL index deletes the document at `expiresAt`; an index also supports token and user lookup. Refresh uses delete-before-issue rotation.

### `goals`

Defined in `server/src/modules/goals/goals.schema.js`.

- `userId` reference.
- `dailyCalorieTarget`, `proteinTargetG`, `carbTargetG`, and optional `fatTargetG`.
- optional `weightGoalKg`.
- `effectiveFrom`.
- `createdAt`.

Goals are append-only in the service: creating a new goal preserves history. The compound `{ userId: 1, effectiveFrom: -1 }` index supports current and as-of lookup.

### `meals`

Defined in `server/src/modules/meals/meals.schema.js`.

- `userId` reference.
- `mealType`: `breakfast`, `lunch`, `dinner`, or `snack`.
- `date`: selected calendar date stored as a UTC date.
- `loggedAt`: actual creation timestamp.
- `items`: embedded food items, each with `name`, `quantity.amount`, `quantity.unit`, `calories`, `macros`, and optional fixed-field `micros`.
- `totals`: server-computed calories and macros for all items.
- `source`: `manual`, `ai_label`, `ai_plate`, or `import`.
- optional `aiMeta.confidence` and `aiMeta.rawModelResponseId`.
- timestamps.

Food items are embedded because they are consumed as part of one meal and are not independently owned resources. The indexes `{ userId: 1, date: -1 }` and `{ userId: 1, date: -1, mealType: 1 }` match list and filter queries.

CSV import rows use the `import` source and pass through the same meal service as manual and AI-confirmed writes.

## Write Invariants

`server/src/modules/meals/meals.service.js` validates item calories, quantities, and macro values, checks calorie-to-macro consistency, and recalculates `totals` from `items` on create and when items are updated; client totals are not trusted. Goal updates create new documents rather than mutating historical goals. Meal and goal repositories scope every operation with `userId`.

## Reports

`server/src/modules/nutrition/nutrition.repository.js` aggregates meal totals by date or week and unwinds `items` for micronutrients. Goal-versus-actual reads goals effective before the range end, then selects the applicable goal in application code for each actual day. Reports are bounded by required `from` and `to` dates and are not paginated. The client currently offers last-7-day and last-30-day selections.

The current pipeline groups the stored `date` field with UTC. The request timezone is passed through the service/repository interface, but the aggregation expressions currently use `UTC`; this is an implementation detail to revisit if dynamic timezone bucketing becomes a requirement.

## Deliberate Omissions

There is no shared food catalog, weight-log collection, chat-session collection, import-job collection, or precomputed daily rollup. Import processing is currently synchronous and does not create durable import-job records. A catalog, job collection, or rollup should be added only when search, cross-meal reuse, background processing, or report scale justifies the additional model and migration work.
