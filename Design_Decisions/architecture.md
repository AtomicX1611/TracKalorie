# Architecture

## System Shape

TracKalorie is a two-process MERN application:

- `client/` is a React 19 single-page application built with Vite. `client/src/App.jsx` owns routing and authentication guards.
- `server/` is a Node.js and Express API. `server/src/app.js` composes middleware and versioned routers; `server/src/server.js` connects MongoDB and starts the process.
- MongoDB is accessed through Mongoose models and repositories.
- OpenAI GPT-4o is an external dependency for image extraction and chat.

The browser does not access MongoDB or OpenAI directly. `client/src/api/client.js` normalizes `VITE_API_URL` to `/api/v1`, adds the bearer token and `X-Timezone`, and calls the server REST API.

## Request Flow

```text
React page/component
  -> client/src/api/*.js
  -> /api/v1 Express router
  -> controller
  -> service
  -> repository/model
  -> MongoDB or OpenAI
```

`server/src/common/middleware/` provides CORS, Helmet, JSON parsing, timezone handling, JWT verification, rate limiting, validation, and the final error handler. Controllers shape HTTP responses; services hold business rules; repositories hold Mongoose access.

## Modules

- `auth`: registration, login, access-token verification, refresh-token rotation, logout, and current-user lookup.
- `users`: authenticated profile read and timezone update.
- `goals`: current, as-of, historical, and effective-dated goals.
- `meals`: meal CRUD, embedded food items, totals calculation, filtering, and cursor pagination.
- `nutrition`: MongoDB aggregation reports over meals and goals.
- `ai`: image upload validation, GPT-4o vision extraction, Zod response validation, confidence and warning calculation.
- `chat`: stateless GPT-4o tool-calling orchestration over existing meal, goal, and nutrition services.

This is a modular monolith, not a collection of deployable services. The module boundaries make ownership and testing clearer while keeping one deployment, one database connection, and no inter-service infrastructure.

## Why This Fits Three Days

A flat CRUD server would be faster initially but would duplicate rules when manual forms, AI confirmation, and chat all write meals. Microservices would add deployment, network, service-authentication, retries, and observability work without a demonstrated scale need. The modular monolith gives separation at the code boundary while preserving assignment-sized delivery speed.

The trade-off is that modules share one process and database. A defect or resource problem in the process can affect multiple domains. The first justified extraction would be asynchronous AI processing if request latency, provider quotas, or volume become material; it is not needed for the current assignment.

## Data Isolation and Time

Protected routes receive the user identity from the verified JWT. Meal, goal, and report queries scope by that identity; a missing meal is returned as `404` rather than revealing whether another user's identifier exists. The client sends an IANA timezone in `X-Timezone`; the middleware validates its shape with `Intl.DateTimeFormat` and falls back to `UTC`. Meal calendar dates are stored as UTC dates representing the selected `YYYY-MM-DD`, while `loggedAt` records the actual timestamp.

## Failure Handling

- Startup validates production configuration and fails fast if required MongoDB, OpenAI, JWT, or CORS settings are unsafe.
- MongoDB connection selection times out after five seconds and process shutdown closes the HTTP server and database connection.
- OpenAI failures, malformed JSON, and schema-invalid model responses become `502 AI_PROVIDER_UNAVAILABLE`; missing configuration becomes `503 AI_NOT_CONFIGURED`.
- Invalid requests use Zod or explicit controller validation and return structured `400` errors.
- Unknown routes return a structured `404`; unexpected errors are logged server-side and returned as a generic `500`.
- The client retries a protected request once after refresh-token rotation and queues concurrent requests during that refresh.

## Security

`helmet` supplies security headers, CORS accepts only configured client origins, auth has a 20-attempt/15-minute per-IP limiter, and chat has a 30-request/minute per-IP limiter. Passwords use bcrypt cost 12. Access tokens are JWTs with a configured expiry; refresh tokens are opaque UUIDs stored in MongoDB with a seven-day TTL index and rotated on use. Uploads are memory-buffered, restricted to JPEG/PNG/WebP, and capped at 5 MB.

The current implementation does not include a queue, distributed rate limiter, audit log, password reset, email verification, or automated security scanner. Those are future hardening work, not current behavior.

## Deployment

The client includes `client/vercel.json` to rewrite routes to `index.html`, which supports Vercel SPA hosting. The server exposes `npm start` and is deployable as a normal Node process with environment variables from `server/.env.example`. A production deployment needs MongoDB, `OPENAI_API_KEY`, a strong `JWT_SECRET`, and a non-localhost `CLIENT_ORIGIN`. No deployment manifest for the server is committed.
