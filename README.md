# Invigilo - Online Examination and Proctoring Platform

Invigilo is a full-stack examination platform for creating question banks, publishing timed exams, taking assessments, automatically grading submissions, reviewing results, and monitoring active students with browser-based proctoring signals.

The application includes four role-specific experiences:

- **Admin:** platform-wide exam, analytics, and live-proctor access
- **Instructor:** question-bank management, exam publishing, and analytics
- **Student:** registration, timed exam attempts, autosaved answers, and results
- **Proctor:** active-session monitoring through WebRTC

## Live Deployment

- Frontend: [https://frontend-nine-self-83.vercel.app](https://frontend-nine-self-83.vercel.app)
- REST API health: [https://backend-three-dun-35.vercel.app/api/health](https://backend-three-dun-35.vercel.app/api/health)

The live Vercel deployment uses the ephemeral PGlite demo fallback. Configure hosted PostgreSQL for persistent production data.

## Features

### Examination workflow

- Create reusable question banks and add MCQ, true/false, and short-answer questions
- Create exams from a question bank with configurable duration, total marks, and passing marks
- Validate exam configuration and prevent publishing exams without questions
- Publish exams for students and resume in-progress attempts
- Autosave answers while the student moves through the exam
- Enforce server-side exam timing and prevent duplicate submissions
- Automatically grade answers and scale the raw question score to the exam's configured total marks
- Count unanswered questions as incorrect during grading

### Proctoring

- Capture the student's webcam with `getUserMedia`
- Stream video peer-to-peer with WebRTC
- Use Socket.io as the WebRTC signaling channel
- Log tab switches and fullscreen exits as proctoring events
- Show active exam sessions to authorized proctors

### Authentication and security

- Student self-registration
- BCrypt password hashing
- Short-lived JWT access tokens
- Rotating, server-stored refresh tokens
- Role-based API authorization
- Authentication endpoint rate limiting
- Profile and password management
- CORS allowlist configured through `CLIENT_URL`

### Reporting

- Student result history and aggregate performance
- Exam completion, average score, and pass/fail metrics
- Score-distribution charts
- Top-performer tables
- Proctoring-event summaries

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router |
| Styling | Tailwind CSS, Lucide React |
| Charts | Recharts |
| API client | Axios |
| Backend | Node.js, Express, TypeScript |
| Real-time signaling | Socket.io |
| Video | Browser WebRTC APIs |
| Database | PostgreSQL with `pg`; PGlite fallback for zero-config demos |
| Authentication | JSON Web Tokens, BCrypt, rotating refresh tokens |
| Deployment | Vercel projects for frontend and REST API |

## Architecture

```text
React SPA
  |
  |-- HTTPS/JSON --> Express REST API --> PostgreSQL or PGlite
  |
  |-- Socket.io --> Node signaling server --> WebRTC peer connection
```

The backend has two entry points:

- `backend/src/index.ts` starts the full Node HTTP and Socket.io server for local or long-running-host deployments.
- `backend/api/index.ts` exports the Express application as a Vercel serverless REST function.

The database adapter first tries `DATABASE_URL`. If PostgreSQL is unavailable, it initializes PGlite, creates the schema, and inserts demo data.

## Repository Structure

```text
.
|-- backend/
|   |-- api/index.ts              # Vercel serverless entry point
|   |-- src/app.ts                # Express REST application
|   |-- src/index.ts              # Node + Socket.io entry point
|   |-- src/db/                   # schema, setup, seed, database adapter
|   |-- src/middleware/           # authentication and rate limiting
|   |-- src/routes/               # REST resources
|   |-- src/services/             # grading logic
|   `-- src/socket/               # WebRTC signaling
|-- frontend/
|   |-- public/                   # brand assets
|   `-- src/
|       |-- api/                  # Axios client and token refresh
|       |-- components/           # layout and reusable UI
|       |-- context/              # auth and toast providers
|       |-- hooks/                # WebRTC hook
|       `-- pages/                # role-specific routes
`-- docker-compose.yml
```

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop, or an existing PostgreSQL database

### 1. Start PostgreSQL

```bash
docker compose up -d
```

PostgreSQL starts on `localhost:5432` with database `exam_proctoring`, user `postgres`, and password `password`.

### 2. Configure and start the backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run db:seed
npm run dev
```

The API and Socket.io server run at `http://localhost:5000`.

To run without PostgreSQL, set `USE_PGLITE=true` in `backend/.env`. The schema and demo data are initialized automatically.

### 3. Configure and start the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

### Windows path note

The Windows npm command shim can fail when the absolute project path contains `&`. Rename the parent folder or run the underlying Node binaries directly when that happens:

```powershell
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js
```

## Environment Variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Local only | HTTP server port; defaults to `5000` |
| `DATABASE_URL` | Recommended | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Strong secret used to sign access tokens |
| `CLIENT_URL` | Yes | Allowed frontend origin; accepts comma-separated origins |
| `USE_PGLITE` | No | Set to `true` to force the embedded PGlite database |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Production | Full REST base URL, including `/api` |
| `VITE_SOCKET_URL` | For live proctoring | URL of the long-running Socket.io backend |

## Demo Accounts

All seeded accounts use password `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@invigilo.app` |
| Instructor | `instructor@invigilo.app` |
| Student | `student@invigilo.app` |
| Proctor | `proctor@invigilo.app` |

## Main API Routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a student |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Rotate refresh and access tokens |
| `GET` | `/api/auth/me` | Read the current profile |
| `GET/POST` | `/api/question-banks` | List or create banks |
| `POST` | `/api/question-banks/:id/questions` | Add a question |
| `GET/POST` | `/api/exams` | List or create exams |
| `PATCH` | `/api/exams/:id/publish` | Publish an exam |
| `POST` | `/api/sessions/start/:examId` | Start or resume an attempt |
| `POST` | `/api/sessions/:id/answer` | Save an answer |
| `POST` | `/api/sessions/:id/submit` | Submit and grade an attempt |
| `GET` | `/api/analytics/exam/:examId` | Read exam analytics |
| `POST` | `/api/proctoring/events` | Record a proctoring signal |
| `GET` | `/api/health` | Check API and database health |

## Deployment

The repository is configured as two Vercel projects:

1. Deploy `backend/` as the API project.
2. Set backend `JWT_SECRET`, `DATABASE_URL`, and `CLIENT_URL`.
3. Deploy `frontend/` as the SPA project.
4. Set frontend `VITE_API_URL` to the backend deployment URL plus `/api`.

For a persistent production system, always configure a hosted PostgreSQL `DATABASE_URL`. The PGlite fallback uses ephemeral storage on Vercel and is intended only for demonstrations.

Vercel serverless functions do not provide a persistent Socket.io server. The REST API and browser-based violation logging deploy on Vercel, but live WebRTC proctor video requires running `backend/src/index.ts` on a long-running Node host and setting `VITE_SOCKET_URL` to that host.

## Verification

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

The frontend production build may report a large JavaScript chunk warning because charting, Socket.io, and all role-specific pages are currently bundled together. This warning does not prevent deployment.

## License

MIT
