# Invigilo — Intelligent Exam Integrity

A production-grade online examination platform with WebRTC proctoring, automated evaluation, and real-time analytics.

**Built by [Priyanshu Gupta](https://github.com/priyanshugupta)**

> *Invigilo* (Latin: *to watch over*) — enterprise exam integrity, reimagined.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database | PostgreSQL |
| Real-time | WebRTC (peer-to-peer video) + Socket.io signaling |
| Auth | JWT with role-based access control |

## Auth & Security

- JWT access tokens (15 min) + refresh token rotation (7 days)
- Server-side password validation (uppercase, lowercase, number, 8+ chars)
- Rate limiting on auth endpoints (15 attempts / 15 min)
- Student-only self-registration (instructor/proctor roles assigned by admin)
- Profile management & password change with session revocation
- Automatic token refresh via Axios interceptors

## Features

- **Timed Exams & Question Banks** — Create question repositories with MCQ, True/False, and Short Answer types; build timed exams with configurable duration and passing marks
- **Webcam Proctoring** — WebRTC-based live video monitoring with tab-switch detection, fullscreen enforcement, and proctoring event logging
- **Automated Evaluation** — Instant grading on exam submission with support for multiple question types
- **Result Analytics** — Dashboard with score distribution charts, top performers, and proctoring event summaries
- **Role-Based Access** — Admin, Instructor, Student, and Proctor roles with tailored dashboards

## Project Structure

```
├── backend/          # Express API + Socket.io server
│   ├── src/
│   │   ├── routes/   # REST API endpoints
│   │   ├── services/ # Business logic (evaluation)
│   │   ├── socket/   # WebRTC signaling
│   │   └── db/       # Schema, seed data
│   └── package.json
├── frontend/         # React SPA
│   ├── src/
│   │   ├── pages/    # Route pages
│   │   ├── components/
│   │   ├── hooks/    # useWebRTC hook
│   │   └── context/  # Auth context
│   └── package.json
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run db:migrate
npm run db:seed
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

> **Windows note:** If your project folder name contains `&`, use `Set-Location -LiteralPath '...'` in PowerShell before running npm scripts, or rename the folder to avoid path issues.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@invigilo.app | Password123! |
| Instructor | instructor@invigilo.app | Password123! |
| Student | student@invigilo.app | Password123! |
| Proctor | proctor@invigilo.app | Password123! |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/exams` | List exams |
| POST | `/api/exams` | Create exam |
| POST | `/api/sessions/start/:examId` | Start exam session |
| POST | `/api/sessions/:id/submit` | Submit & auto-evaluate |
| GET | `/api/analytics/exam/:id` | Exam analytics |
| POST | `/api/proctoring/events` | Log proctoring event |

## Architecture

```
Student Browser                    Proctor Browser
     │                                  │
     ├── WebRTC (video stream) ─────────┤
     │                                  │
     └── Socket.io ──► Signaling Server ◄── Socket.io
                           │
                      PostgreSQL
```

## Resume Highlights

- Designed and built a full-stack exam platform from scratch with 4 user roles
- Implemented WebRTC peer-to-peer video streaming with Socket.io signaling for live proctoring
- Built automated evaluation engine supporting MCQ, True/False, and Short Answer questions
- Created analytics dashboard with score distribution and proctoring event visualization
- Secured API with JWT authentication and role-based authorization middleware

## License

MIT
