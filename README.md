# Buddy

> A personal AI assistant designed to understand, remember, plan, and act — with the user in control.

Buddy is a mobile-first AI assistant project built around an agentic backend. Instead of being only a chatbot, Buddy is designed to use tools, access connected services, run scheduled workflows, maintain useful memory, and notify the user when something needs attention.

The complete technical architecture is documented in [`DESIGN.md`](./DESIGN.md).

---

## Current Status

**Stage:** Authentication

The project is being developed incrementally using a milestone-based approach. M0 (documentation), M1 (Node.js + TypeScript + Express backend), M2 (PostgreSQL persistence foundation), and M3 (authentication) are implemented.

The backend currently provides a health endpoint, a PostgreSQL/Drizzle persistence foundation, and email/password authentication with JWT access tokens and opaque refresh tokens. Buddy is not yet a functional assistant; features from later milestones are still to be built.

---

## What Buddy Is Intended To Do

### Personal Assistant
- Natural-language conversation
- Context-aware responses
- Long-term memory
- Scheduled tasks
- Notifications

### Email
- Connect to Gmail through OAuth
- Read and search emails
- Summarize important emails
- Identify emails that may need a response

### Calendar
- Read upcoming events
- Summarize the user's schedule
- Later create/update events with approval

### Daily Briefing
Buddy will eventually provide a scheduled briefing containing things such as:

```text
Important emails
Emails requiring attention
Today's calendar
Reminders
Relevant job opportunities
Other configured updates
```

### Jobs
- Search relevant jobs
- Monitor configured sources
- Deduplicate job listings
- Notify the user about relevant opportunities
- Assist with applications
- Require user approval before consequential submission

### Voice
Voice interaction is planned as a later milestone.

---

## Architecture

```text
                  ┌─────────────────────┐
                  │   React Native App  │
                  │    TypeScript       │
                  └──────────┬──────────┘
                             │
                         HTTPS / WS
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Node.js + Express   │
                  │       API           │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Agent Orchestrator │
                  └──────────┬──────────┘
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
            LLM            Tools           Memory
                             │               │
                ┌────────────┼───────┐       ▼
                ▼            ▼       ▼   PostgreSQL
              Gmail       Calendar   Jobs
                             │
                             ▼
                       Notifications

              Background Processing
                 BullMQ + Redis
```

The important architectural rule is:

> **The LLM reasons and plans. The backend controls permissions, tools, data, execution, and safety.**

---

## Technology Stack

| Area | Technology |
|---|---|
| Mobile | React Native + TypeScript |
| Backend | Node.js + TypeScript + Express |
| Database | PostgreSQL |
| Cache / Queue | Redis |
| Background Jobs | BullMQ |
| Notifications | Firebase Cloud Messaging |
| AI | Provider-independent LLM layer |
| APIs | REST + WebSocket where required |
| Containerization | Docker |
| Version Control | Git + GitHub |

---

## Agent Workflow

Buddy uses a tool-based agent workflow:

```text
User Request
     ↓
Understand
     ↓
Plan
     ↓
Select Tool
     ↓
Execute
     ↓
Observe Result
     ↓
Need More Work?
   ↙         ↘
 Yes          No
  ↓            ↓
Re-plan      Respond
```

This allows Buddy to perform multi-step tasks instead of generating a response without actually completing the required work.

---

## Safety Model

Buddy is designed around controlled autonomy.

### Low-risk actions
Can generally execute automatically:

- Read email
- Search jobs
- Read calendar
- Search memory
- Summarize information

### Higher-risk actions
Require approval when appropriate:

- Send email
- Delete information
- Create or modify important records
- Submit a job application
- Purchase something
- Send a message on the user's behalf

Buddy must never bypass:

- CAPTCHA
- MFA
- Anti-bot systems
- Authentication controls
- Website access restrictions

External content such as emails and webpages is treated as untrusted data and must not override the agent's system rules.

---

## Project Structure

The planned repository structure is:

```text
Buddy/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── agents/
│   │   ├── tools/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── workers/
│   │   ├── middleware/
│   │   └── utils/
│   └── tests/
│
├── mobile/
│   └── src/
│
├── docs/
├── docker/
├── DESIGN.md
├── README.md
└── .env.example
```

The exact structure can evolve as implementation progresses.

---

## Milestone Roadmap

Buddy will be developed one milestone at a time.

| Milestone | Goal |
|---|---|
| M0 | Documentation and repository foundation |
| M1 | Node.js + TypeScript + Express backend |
| M2 | PostgreSQL and persistence |
| M3 | Authentication |
| M4 | AI provider + agent core |
| M5 | Conversation system |
| M6 | React Native foundation |
| M7 | Google OAuth + Gmail read |
| M8 | Email intelligence |
| M9 | Push notifications |
| M10 | Redis + BullMQ + background jobs |
| M11 | Daily briefing |
| M12 | Long-term memory |
| M13 | Safety and approval system |
| M14 | Calendar |
| M15 | Voice |
| M16 | Job discovery |
| M17 | Job application assistant |
| M18 | Job monitoring |
| M19 | Observability |
| M20 | Security audit |
| M21 | Integration / E2E testing |
| M22 | Docker and deployment |
| M23 | Mobile UX |
| M24 | V1 freeze |

See [`DESIGN.md`](./DESIGN.md) for the detailed scope and acceptance criteria of each milestone.

---

## Backend Development

The backend lives in `backend/` and uses Node.js, TypeScript, Express, and Drizzle ORM.

### Prerequisites

- Node.js (LTS) and npm
- Docker with the Compose plugin (for local PostgreSQL)

### Install dependencies

```bash
cd backend
npm install
```

### Run the backend

```bash
cd backend
npm run dev
```

The health endpoint is available at `GET http://localhost:3000/api/health`.

---

## Local PostgreSQL

Local PostgreSQL runs in a dedicated Docker container. Redis/BullMQ and other infrastructure are intentionally not part of this setup yet.

### Start PostgreSQL

```bash
docker compose -f docker/docker-compose.yml up -d
```

The container uses the database `buddy` and the user `buddy`, and exposes port `5432`.

### Configure DATABASE_URL

Copy `.env.example` to `.env` and set `DATABASE_URL`:

```env
DATABASE_URL=postgresql://buddy:change_me@localhost:5432/buddy
```

Change `change_me` to the password used for your local container (`POSTGRES_PASSWORD`). Never commit the resulting `.env`.

### Run migrations

```bash
cd backend
npm run db:generate
npm run db:migrate
```

`npm run db:check` validates the migration state. The M3 migration creates the `users` and `refresh_tokens` tables.

### Stop PostgreSQL

```bash
docker compose -f docker/docker-compose.yml down
```

PostgreSQL data is stored in the `buddy-postgres-data` Docker volume and persists across restarts.

### Where the database code lives

```text
backend/src/db/
├── client.ts        # Drizzle + pg connection pool (reusable singleton)
├── health.ts        # connectivity check
└── schema/
    ├── index.ts     # schema barrel
    ├── users.ts     # users table
    └── refresh-tokens.ts  # refresh_tokens table

backend/drizzle.config.ts   # Drizzle Kit configuration
backend/drizzle/            # generated SQL migrations
docker/docker-compose.yml   # local PostgreSQL service
```

Database access is kept inside this infrastructure layer; routes, controllers, and middleware must not connect to PostgreSQL directly.

---

## Authentication

M3 adds email/password authentication with short-lived JWT access tokens and opaque, rotating refresh tokens.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account and return a session |
| POST | `/api/auth/login` | Exchange email + password for tokens |
| POST | `/api/auth/refresh` | Rotate a refresh token and issue new tokens |
| POST | `/api/auth/logout` | Revoke a refresh token |
| GET | `/api/auth/me` | Return the current user (requires an access token) |

Protected endpoints expect an `Authorization: Bearer <accessToken>` header.

### Access token vs refresh token

| | Access token | Refresh token |
|---|---|---|
| Format | Signed JWT (HS256) | Opaque random string |
| Lifetime | ~15 minutes | ~30 days |
| Storage | Held by the client only | Only a SHA-256 hash is stored in PostgreSQL |
| Purpose | Authorize API requests | Obtain new access tokens |

Refresh tokens are rotated on every use: the presented token is revoked and a new one is issued. Reusing a revoked or expired refresh token is rejected.

### Configure JWT_SECRET

`JWT_SECRET` is read from the environment and is never hard-coded. Copy `.env.example` to `.env` and set a strong local value:

```env
JWT_SECRET=replace-with-a-long-random-local-secret
```

In production the application refuses to start unless `JWT_SECRET` is explicitly configured and at least 32 characters long.

### Security properties

- Passwords are hashed with Argon2id; plaintext passwords are never stored or returned.
- Password hashes are never included in API responses.
- Refresh tokens are cryptographically random and only their hashes are persisted.
- Access tokens and refresh tokens are never logged.
- Login errors do not reveal whether an account exists.

---

## Testing

```bash
cd backend
npm test
npm run typecheck
npm run build
```

Unit tests run without PostgreSQL. Database integration tests run only when `DATABASE_URL` is set:

```bash
cd backend
DATABASE_URL=postgresql://buddy:change_me@localhost:5432/buddy npm run test:integration
```

---

## Development Approach

The project is intentionally being built incrementally.

For each milestone:

1. Read `DESIGN.md`.
2. Inspect the current repository.
3. Implement only the requested milestone.
4. Do not silently implement future milestones.
5. Add relevant tests.
6. Run tests and build checks.
7. Keep the implementation modular.
8. Update documentation when necessary.
9. Report what changed.

AI coding agents such as MonkeyCode should treat `DESIGN.md` as the architectural source of truth.

---

## Development Philosophy

Buddy should remain:

- **Modular** — integrations are isolated behind tools/services.
- **Replaceable** — AI providers can be changed.
- **Observable** — agent runs and tool calls can be inspected.
- **Secure** — secrets and permissions are handled by the backend.
- **Controlled** — consequential actions require user approval.
- **Incremental** — features are added milestone by milestone.

---

## V1 Goal

The first stable version of Buddy should be able to:

- Authenticate a user.
- Provide AI chat.
- Execute controlled tools.
- Maintain conversations.
- Read Gmail.
- Analyze emails.
- Send notifications.
- Run scheduled workflows.
- Generate a daily briefing.
- Maintain controlled long-term memory.
- Read calendar information.
- Discover relevant jobs.
- Assist with job applications safely.
- Request approval for consequential actions.
- Provide useful execution logs and error handling.

---

## Documentation

- **[DESIGN.md](./DESIGN.md)** — complete architecture, security model, agent design, integrations, and milestone plan.
- **README.md** — project overview and development status.

---

## License

License: **TBD**

