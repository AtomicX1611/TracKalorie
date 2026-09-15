# TracKalorie

[TThis is the application video demonstration](https://drive.google.com/file/d/14LuD8GjzRlav_xpwzvqRP6-R7mf8yGcE/view?usp=sharing)

TracKalorie is a personal nutrition tracker built for a three-day engineering assignment. It provides authenticated meal and goal tracking, nutrition reports, image-based food extraction, and a conversational nutrition assistant.

The implementation is deliberately a small **MERN modular monolith**: React and Vite in `client/`, an Express/Mongoose API in `server/`, and MongoDB for persistence. The client and server communicate only through the versioned REST API.

## Implemented

- JWT registration, login, refresh-token rotation, logout, and protected routes.
- Meal CRUD with embedded food items, server-computed totals, filtering, date ranges, and cursor pagination.
- Effective-dated calorie, macro, and weight goals.
- Date-range nutrition reports with selectable 7-day and 30-day views, macro breakdowns, micronutrient summaries, and goal-versus-actual comparisons.
- GPT-4o image extraction for nutrition labels and plate photos. Results are validated and require user confirmation before a meal is saved.
- GPT-4o chat with tool calls for meal logging, meal lookup, summaries, goal management, nutrition questions, and explicit meal deletion.
- CSV food-diary import with preview, row validation, optional meal dates/types, partial-failure reporting, and shared meal-service validation.
- Helmet, restricted CORS, auth rate limiting, chat rate limiting, Zod request validation, file type/size checks, and centralized error responses.

Proposed scale-out components such as CDN/WAF, load balancing, background queues, object storage, distributed caching, read replicas, autoscaling, and tracing are documented as future architecture options; they are not part of the current deployment.

## Repository Layout

```text
client/                 React/Vite frontend
server/src/             Express API
server/src/common/      config and shared middleware
server/src/modules/     auth, users, goals, meals, nutrition, ai, chat, imports
Design_Decisions/       engineering documentation
workflow/               request-flow diagrams and scalable architecture proposal
```

## Local Setup

Prerequisites: Node.js, a reachable MongoDB deployment, and an OpenAI API key for AI features.

1. Install dependencies:

	```bash
	cd server && npm install
	cd ../client && npm install
	```

2. Create `server/.env` from `server/.env.example`. Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `OPENAI_API_KEY` as appropriate.

3. Configure the client API URL, for example in `client/.env`:

	```text
	VITE_API_URL=http://localhost:5000
	```

4. Run the API and frontend in separate terminals:

	```bash
	cd server && npm run dev
	cd client && npm run dev
	```

The API listens on port `5000` by default and the Vite client on its normal development port. `GET /health` is the public health check.

## Useful Commands

From the repository root, `cd client && npm run build` creates the Vite production build and `cd client && npm run lint` runs ESLint. `cd server && npm start` starts the API; `cd server && npm test` currently exits successfully with a placeholder message, and there is no automated test suite in the repository yet.

## API Summary

All API routes are under `/api/v1`. Auth routes are public; all other module routes require `Authorization: Bearer <accessToken>`.

| Area | Routes |
|---|---|
| Auth | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| Users | `/users/me` |
| Goals | `/goals`, `/goals/current`, `/goals/history` |
| Meals | `/meals`, `/meals/:id` |
| Nutrition | `/nutrition/trend/weekly`, `/nutrition/macros`, `/nutrition/micros/summary`, `/nutrition/goal-vs-actual` |
| AI | `POST /ai/extract?type=label\|plate` with an image multipart field |
| Chat | `POST /chat` |
| Imports | `POST /imports/csv/parse`, `POST /imports/csv/confirm` |

See [Design_Decisions/api-design.md](Design_Decisions/api-design.md) for request and response details.

## Engineering Documentation

- [Architecture](Design_Decisions/architecture.md)
- [Architecture decisions](Design_Decisions/architecture-decisions.md)
- [Data model](Design_Decisions/data-model.md)
- [API design](Design_Decisions/api-design.md)
- [AI architecture](Design_Decisions/ai-architecture.md)
- [Testing](Design_Decisions/testing.md)
- [Demo recording script](demo-recording-script.md)

