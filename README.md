# TracKalorie

TracKalorie is a personal nutrition tracker built for a three-day engineering assignment. It provides authenticated meal and goal tracking, nutrition reports, image-based food extraction, and a conversational nutrition assistant.

The implementation is deliberately a small **MERN modular monolith**: React and Vite in `client/`, an Express/Mongoose API in `server/`, and MongoDB for persistence. The client and server communicate only through the versioned REST API.

## Implemented

- JWT registration, login, refresh-token rotation, logout, and protected routes.
- Meal CRUD with embedded food items, server-computed totals, filtering, date ranges, and cursor pagination.
- Effective-dated calorie, macro, and weight goals.
- Weekly trends, macro breakdowns, micronutrient summaries, and goal-versus-actual reports.
- GPT-4o image extraction for nutrition labels and plate photos. Results are validated and require user confirmation before a meal is saved.
- GPT-4o chat with tool calls for meal logging, meal lookup, summaries, goal management, nutrition questions, and explicit meal deletion.
- Helmet, restricted CORS, auth rate limiting, chat rate limiting, Zod request validation, file type/size checks, and centralized error responses.

Features described in the older planning files but not implemented include PDF import, background queues, persistent chat collections, external food databases, and automated tests.

## Repository Layout

```text
client/                 React/Vite frontend
server/src/             Express API
server/src/common/      config and shared middleware
server/src/modules/     auth, users, goals, meals, nutrition, ai, chat
docs/                   engineering documentation
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

See [docs/api-design.md](docs/api-design.md) for request and response details.

## Engineering Documentation

- [Architecture](docs/architecture.md)
- [Architecture decisions](docs/architecture-decisions.md)
- [Data model](docs/data-model.md)
- [API design](docs/api-design.md)
- [AI architecture](docs/ai-architecture.md)
- [Testing](docs/testing.md)

