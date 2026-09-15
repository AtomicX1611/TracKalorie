# AI Architecture

TracKalorie has two GPT-4o integrations, both behind the Express API and both isolated in `server/src/modules/ai/` or `server/src/modules/chat/`.

## Image Extraction

The client flow is implemented in `client/src/pages/AIScannerPage.jsx`:

1. The user chooses `label` or `plate` and selects an image.
2. The client posts multipart field `image` to `POST /api/v1/ai/extract?type=...`.
3. Multer stores the upload in memory with a 5 MB limit.
4. `ai.controller.js` checks the type, MIME allowlist, and size.
5. `ai.service.js` sends a base64 data URL to GPT-4o with the matching prompt and JSON schema from `ai.prompts.js`.
6. JSON parsing and a second Zod validation layer reject malformed or structurally invalid model output.
7. Label responses receive calorie/macro consistency and range warnings. Plate confidence is capped at `0.74` and displayed as medium because visual portion estimates are uncertain.
8. The client shows the draft, allows label serving/consumed-gram scaling, and only then calls `POST /api/v1/meals` with `source` and `aiMeta`.

No uploaded image is persisted by the server; memory storage is used only for the provider request. The extraction endpoint never auto-saves model output.

## Conversational Agent

`POST /api/v1/chat` is implemented in `server/src/modules/chat/chat.service.js` as a bounded tool-calling loop:

1. The service builds a prompt containing the authenticated user context, current goal, date, and timezone.
2. It sends the last 20 client-provided messages plus the tool definitions in `chat.tools.js` to GPT-4o.
3. Tool calls are executed through existing `mealsService`, `goalsService`, and `nutritionService` methods.
4. Tool results are appended to the in-memory model thread and the loop continues until text is returned or six iterations are reached.
5. Successful write actions are returned as `actionsPerformed` so the client can refresh mounted pages.

Implemented tools are `log_meal`, `list_meals`, `get_today_summary`, `get_weekly_summary`, `get_current_goal`, `set_goal`, `get_nutrition_info`, and `delete_meal`. Explicit deletion is required by the system prompt, and ownership still comes from the authenticated user passed into the service.

The `get_nutrition_info` tool does not call an external food database; it gives the model a structured instruction to answer from GPT-4o knowledge. That makes it convenient but approximate and not a clinical or authoritative nutrition source.

## Safety and Failure Boundaries

OpenAI configuration is checked lazily. Provider failures, malformed JSON, and schema mismatches become structured `502` errors; missing configuration is `503`. Chat tool execution uses `Promise.allSettled`, so individual tool failures are represented to the model rather than crashing the whole request. The six-iteration cap prevents an unbounded agent loop.

The API applies a 30-request/minute per-IP chat limiter. Image uploads are type- and size-limited. The browser displays an error instead of saving an incomplete AI response.

## Trade-offs and Evolution

Synchronous calls keep the three-day implementation understandable and avoid Redis or a worker that would be idle at assignment scale. The trade-off is user-visible latency and no durable retry or job status. At higher usage, extract and import-like work should move behind a queue with retries, provider backoff, cost quotas, and idempotency. Persistent conversation storage, moderation, prompt/version tracking, and evaluation fixtures would also be appropriate product evolution, but none is implemented today.
