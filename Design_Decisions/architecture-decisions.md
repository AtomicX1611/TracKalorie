# Architecture Decisions

These decisions describe the implemented system and the scope judgment behind it. Every choice is sized for strong engineering quality within a three-day assignment.

## MERN with a Separated API

**Choice:** React/Vite client, Node/Express server, MongoDB/Mongoose persistence.

**Alternatives:** A server-rendered application, a relational database, or a single frontend/backend process.

**Why:** The assignment needs interactive dashboards, image upload, chat, nested meal items, and a clean client/server boundary. React supports the interactive pages in `client/src/pages/`; Express gives explicit REST middleware and module routing; MongoDB maps naturally to a meal containing variable food items; the API separation prevents browser code from owning persistence or provider credentials.

**Trade-offs:** MongoDB gives less relational constraint enforcement and reporting is aggregation code. Two processes require CORS and environment configuration. We accept that overhead because the boundary is a core requirement and remains small.

**Change when:** Choose PostgreSQL if the product grows into relational reporting, billing, or many cross-entity constraints; introduce a different service boundary only when independent scaling or team ownership is demonstrated.

## Modular Monolith

**Choice:** One Express deployment with `auth`, `users`, `goals`, `meals`, `nutrition`, `ai`, `chat`, and `imports` modules, each generally split into routes, controllers, services, and repositories where appropriate.

**Alternatives:** A flat monolith or microservices/event-driven infrastructure.

**Why:** A flat structure would encourage duplicate meal rules across forms, AI, and chat. Microservices would spend the three-day budget on deployment, network failure, service authentication, and operations rather than assignment behavior. A modular monolith provides clear boundaries and shared in-process services without unnecessary infrastructure.

**Trade-offs:** Modules share CPU, memory, release cadence, and the MongoDB deployment. Failure isolation is weaker than separate services.

**Change when:** Move AI extraction or large imports to a worker/queue when latency, provider quotas, or volume justify retries and independent scaling. Keep CRUD together until that pressure is real.

## MongoDB Document Model

**Choice:** Store each meal as one document with embedded food items and server-computed totals. Keep goals, users, and refresh tokens in separate collections; process CSV imports through the meal aggregate rather than introducing an import-job collection.

**Alternatives:** A normalized SQL schema or separate food-item documents.

**Why:** Food items are read and written with their meal and are not a shared catalog. Embedding avoids joins/N+1 reads and preserves the meal as the natural write unit. Separate user, goal, and token documents support independent lifecycle and indexes.

**Trade-offs:** Embedded items are not independently queryable and documents would need reconsideration if meals became unbounded. MongoDB also shifts some consistency and reporting discipline into service code.

**Change when:** Add a food catalog or separate item collection only when shared foods, independent item search, or document-size growth is an actual requirement.

## JWT Access Tokens plus Rotating Refresh Tokens

**Choice:** bcrypt-hashed passwords, short-lived signed access JWTs, and opaque UUID refresh tokens stored with a seven-day TTL and rotated on every use (`server/src/modules/auth/auth.service.js`).

**Alternatives:** Server sessions, a single long-lived JWT, or a third-party identity provider.

**Why:** JWT verification keeps protected API requests stateless, while stored refresh tokens allow revocation and rotation. This is enough multi-user security for the assignment without adding an identity platform.

**Trade-offs:** Token storage in the browser's local storage increases the impact of an XSS vulnerability. Refresh rotation requires client coordination. There is no email verification, password reset, or refresh-token family reuse detection.

**Change when:** Use an external identity provider for enterprise SSO or move refresh credentials to secure HttpOnly cookies after defining CSRF protections and deployment constraints.

## REST and Versioned API

**Choice:** Resource-oriented REST routes under `/api/v1`, JSON envelopes with `data` and structured `error` responses.

**Alternatives:** GraphQL or direct database access from the client.

**Why:** The domain has clear resources and operations: meals, goals, users, reports, extraction, and chat. REST is easy to inspect and test, and versioning gives a compatibility boundary without adding GraphQL schema and resolver complexity.

**Trade-offs:** Reports have purpose-built endpoints and clients may make several requests. There is no generated OpenAPI contract.

**Change when:** Consider GraphQL only if multiple clients need substantially different projections and REST request composition becomes measurable pain.

## Cursor Pagination

**Choice:** Meal listing and goal history use opaque base64url cursors, with meals ordered by `date` and `_id` and a `limit` capped at 100.

**Alternatives:** Page-number pagination with `skip/limit`.

**Why:** Cursor pagination remains stable as new meals arrive and avoids increasing skip cost on deeper pages. Fetching `limit + 1` provides `hasMore` without a second count query.

**Trade-offs:** Cursors are not human-readable and clients cannot jump directly to page 10. Invalid cursors currently fall back to the first page rather than returning an error.

**Change when:** Add a total count or page-number navigation only when a UI requirement needs it and the query volume supports the extra cost.

## Synchronous AI with Human Confirmation

**Choice:** Call GPT-4o synchronously for image extraction and chat. Validate image metadata and model output before returning; the scanner saves only after the user confirms.

**Alternatives:** A background queue, an external nutrition database, or automatic persistence of model output.

**Why:** Synchronous flow is understandable and fits a three-day feature. Human confirmation is essential because plate estimates are inherently uncertain. GPT-4o structured output plus Zod provides a concrete contract.

**Trade-offs:** The request waits on OpenAI, provider outages surface to the user, and nutrition estimates are not authoritative. There is no retry queue or provider cost budget.

**Change when:** Add a queue, job status, retry/backoff, and idempotency after AI work becomes high-volume or too slow for request/response UX.

## No Unneeded Infrastructure

**Choice:** No Redis, Kafka, Kubernetes, background worker, or separate AI service is implemented. CSV parsing and confirmed-row imports are currently synchronous.

**Why:** The repository targets assignment-scale traffic, and none of those systems is required for the implemented workflows. Adding them in three days would increase operational failure modes and reduce time for validation and user-facing behavior.

**Trade-off:** Long-running work is request-bound and rate limits are process-local. Horizontal scaling would require revisiting shared rate-limit state and job handling.

**Change when:** Introduce the smallest piece that answers a measured problem: a queue for AI latency, distributed rate limiting for multiple API instances, or read-optimized rollups for expensive reports.
