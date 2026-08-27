# 🌿 Schedula — AI-Powered Student Planner

**Schedula** is a full-stack (MERN) web application that helps students manage
coursework, deadlines, habits, and study time with AI-powered scheduling. It
ships with four fully-themed visual identities — **Garden, Ocean, Space,
Minimal** — that reskin *everything*: the dashboard, the ambient background, the
streak/growth visual, decorative elements, marketing copy, the logged-out
landing page, and even outgoing password-reset and digest emails — not just the
color palette.

---

## 📑 Table of Contents

- [Feature Overview](#-feature-overview)
  - [Core Task Management](#-core-task-management)
  - [AI Features](#-ai-features)
  - [Academic Tools](#-academic-tools)
  - [Social & Accountability](#-social--accountability)
  - [Security & Account](#-security--account)
  - [Theming & Garden Experience](#-theming--garden-experience)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Notes & Known Quirks](#-notes--known-quirks)

---

## ✨ Feature Overview

### 🎯 Core Task Management

- **Task CRUD** — Create, edit, delete, and complete tasks with **priority**,
  **tags**, **notes**, estimated hours, and deadlines. Every field is editable
  after creation from an **Edit Task** dialog on the Current Tasks page
  (`PATCH /api/tasks/:id`).
- **Quick-fill templates** — One-tap presets (University Assignment, Exam Prep,
  etc.) on the Add Task page.
- **Smart Calendar** — Week and day views with hourly time slots,
  **drag-and-drop rescheduling**, a task detail dialog, and an overlay of your
  **classes**, **assignment deadlines**, and **goal milestones**.
- **Per-hour scheduling** — Move individual scheduled blocks around the grid
  (`schedule-hour` / `reschedule` endpoints).
- **Overdue Summary** — The Dashboard groups overdue tasks into their own
  section instead of just flagging them inline.
- **Time Redistribution** — Finish a task early and spread the leftover time
  across your other tasks via a guided dialog.
- **Recurring Tasks** — Bounded recurring series (grouped by `groupId`) with
  automatic scheduling.
- **Current Tasks / History** — Live task list plus a full completed/deleted
  task history page with a sidebar history panel.
- **Search, Filter & Export** — Find tasks by title / description / tag; export
  as **CSV, JSON, or TXT**.
- **Focus Timer** — Dedicated timer page (header shortcut) with
  Start / Pause / Reset, ambient focus sounds (Web Audio), and a **Lazy Mode**
  toggle that relaxes scheduling.

### 🤖 AI Features

Powered by the **Cohere API** (`command-r7b-12-2024`).

- **AI Task Scheduling** — Automatically splits a task across days up to its
  deadline, respecting estimated hours, daily capacity, your **recorded class
  hours** (no study time booked during lectures), and your **semester
  start/end dates**.
- **AI Chat Assistant** — Natural-language commands such as
  *"move everything to next week"*, *"I have an exam Thursday"*, or creating a
  task from a single sentence. (`/api/chat/command`)
- **Smart Suggestions** — Context-aware nudges about your workload
  (`/api/ai/suggestions`).
- **Workload Insights** — Aggregated analysis of upcoming load
  (`/api/ai/workload`).
- **Schedule photo import (OCR + AI)** — Upload a photo of your timetable;
  `tesseract.js` runs OCR in the browser, then the AI structures the text into
  class rows you review and confirm before saving (`/api/class-schedule/parse`).
- **Mood-aware capacity** — A same-day mood check-in actually softens the AI's
  daily scheduling capacity and the burnout threshold (not just dashboard copy).

### 📚 Academic Tools

- **GPA Tracker** — Courses with credit hours and grades; calculated cumulative
  GPA (`/api/courses`, `/api/courses/gpa`).
- **Assignments** — University assignments with submission links and deadlines,
  shown on the Calendar and factored into burnout detection.
- **Class Schedule** — Weekly recurring class times (manual entry, bulk add, or
  OCR photo import), shown on the Calendar and respected by AI scheduling to
  avoid overlap.
- **Goals & Milestones** — Long-term goals with checkable milestones, surfaced
  on the Calendar and in the Weekly Review.
- **Habits** — Daily habit tracking with streaks, toggled per day, reflected in
  a Dashboard stat.
- **Weekly Review** — One summary of completed / missed tasks, assignments past
  deadline or due in the next week, and upcoming goal milestones
  (`/api/tasks/weekly-review`).

### 🤝 Social & Accountability

- **Study Buddies** — Friend requests, accept/decline, friends list, and a
  **leaderboard** of shared progress.
- **Accountability Partner** — Automatic weekly progress email sent to a chosen
  friend or mentor.
- **Weekly Digest** — Scheduled email summary of upcoming tasks and progress,
  sent every **Sunday 08:00** (`node-cron`, timezone configurable). A test
  endpoint (`/api/digest/test`) sends one on demand.

### 🔐 Security & Account

- **JWT Authentication** with **session tracking** — each token carries a `jti`
  tied to a `Session` record; users can view active sessions and revoke them
  individually (legacy tokens are grandfathered).
- **"Remember me"** — session-only auth by default, persistent if checked.
- **Two-Factor Authentication** — OTP via email with `speakeasy` + QR code
  (`/api/2fa/setup|verify|disable`).
- **Password History** — Prevents reusing the last 5 passwords.
- **AES Encryption** — Task descriptions encrypted at rest (`crypto-js`).
- **Rate Limiting & Hardening** — `helmet`, `express-rate-limit` (300 req / 15
  min globally, 5 / 15 min on login), `express-mongo-sanitize`, `xss-clean`.
- **Audit Logs & Login History** — Tracks user actions and login attempts
  (`AuditLog`, `LoginHistory` models).
- **Anomaly Detection** — Flags suspicious logins.
- **Security Score** — At-a-glance account security rating
  (`/api/security/score`).
- **Login History view** — `/api/security/login-history`.
- **GDPR Tools** — Export all account data or delete the account on demand
  (`/api/account/export`, `DELETE /api/account`).
- **Profile** — Editable profile with photo upload (`multer`, served from
  `/uploads` with cross-origin CORP).

### 🎨 Theming & Garden Experience

- **4 Full Themes** — Garden, Ocean, Space, Minimal. A `themeContent.js`
  registry swaps every garden visual and copy string per theme: ambient
  background, streak growth visual, decorations, taglines — synced across the
  app, pre-login pages, and outgoing emails.
- **Dark / Light Mode** — Per-theme dark variants with smooth transitions.
- **Landing Page** — Themed marketing page for logged-out visitors, plus a
  custom **404 page** and an app-wide **error boundary**.
- **Streak Page** — Growing plant (or theme-equivalent) visual + a GitHub-style
  contribution grid.
- **Leaf Confetti & Sound Effects** — Celebratory animation and a soft rustle on
  task completion.
- **Mood Check-In & Daily Start Prompt** — Same-day mood + a morning briefing
  prompt.
- **Burnout Detection** — Weighs scheduled task hours, class hours, upcoming
  assignment deadlines, and goal milestones together — not just overdue tasks.
- **Dashboard Stats** — Completion rate, overdue count, habits-today, progress
  bar, deadline countdowns, clickable stat cards, and skeleton loaders while
  data is in flight.

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Material UI 9 (`@mui/material`, `@emotion`), React Router 6, Axios, `tesseract.js` (browser OCR) |
| **Backend** | Node.js ≥ 20, Express 5 |
| **Database** | MongoDB Atlas via Mongoose 9 |
| **AI** | Cohere API (`command-r7b-12-2024`) |
| **Auth** | JWT (`jsonwebtoken`), `bcryptjs`, `speakeasy` + `qrcode` (2FA) |
| **Email** | `nodemailer` (SMTP), `node-cron` (scheduled digests) |
| **Encryption** | `crypto-js` (AES) |
| **Security** | `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `xss-clean` |
| **Uploads** | `multer` |

---

## 🏗 Architecture

```
┌─────────────┐        HTTPS/JSON        ┌──────────────┐        ┌──────────────┐
│   React SPA │  ───────────────────▶   │  Express API  │ ─────▶ │ MongoDB Atlas│
│  (Vercel)   │  ◀───────────────────   │   (Render)    │        └──────────────┘
└─────────────┘                         │              │
      │ browser OCR (tesseract.js)      │   ├─▶ Cohere API (AI scheduling / chat)
      │                                 │   ├─▶ SMTP (OTP, digest, accountability)
      │                                 │   └─▶ node-cron (Sun 08:00 digest)
```

- The client talks to a single API base URL (`REACT_APP_API_URL`, default
  `http://localhost:5000/api`).
- `server.js` pins DNS to `8.8.8.8` / `1.1.1.1` so outbound calls (Cohere, SMTP,
  Atlas) resolve reliably on restricted networks.
- All data routes are protected by the `protect` JWT middleware.

---

## 🚀 Getting Started

### Prerequisites

- Node.js **v20+**
- MongoDB Atlas account (or a local MongoDB instance)
- Cohere API key
- An SMTP-capable email account (for OTP, digest, and accountability emails)

### Installation

```bash
git clone https://github.com/ziadmohsen06/Schedula.git
cd Schedula
```

**1. Backend**

```bash
cd server
npm install
# create server/.env  (see below)
npm run dev          # nodemon, http://localhost:5000
```

**2. Frontend** (new terminal)

```bash
cd client
npm install
# optionally create client/.env  (see client/.env.example)
npm start            # http://localhost:3000
```

The client defaults to an API at `http://localhost:5000/api`. To point it
elsewhere (e.g. a deployed Render URL), set `REACT_APP_API_URL` in `client/.env`.

### Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `server/` | `npm run dev` | Start API with nodemon |
| `server/` | `npm start` | Start API (production) |
| `client/` | `npm start` | Start React dev server |
| `client/` | `npm run build` | Production build |
| `client/` | `npm test` | Run tests |

---

## 🔑 Environment Variables

### `server/.env`

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRE` | Token lifetime, e.g. `7d` |
| `COHERE_API_KEY` | Cohere API key (AI scheduling & chat) |
| `EMAIL_HOST` / `EMAIL_PORT` | SMTP server |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials (use an app password) |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` / `production` |
| `DIGEST_TIMEZONE` | Timezone for the Sunday 08:00 digest cron (default `UTC`) |

### `client/.env`

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | API base URL. Leave unset for local dev; in production set to `https://<your-render-app>.onrender.com/api` |

---

## 📡 API Reference

All routes are prefixed with `/api`. Everything except register/login/forgot/reset
requires a `Authorization: Bearer <token>` header.

### Auth — `/api/auth`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/register` | Create account |
| POST | `/login` | Login (rate-limited 5/15min) |
| POST | `/forgot-password` · `/reset-password` | Password reset by email |
| POST | `/logout` | Revoke current session |
| POST | `/change-password` | Change password (blocks last-5 reuse) |
| PUT  | `/profile` | Update profile + photo upload |
| GET/PUT | `/daily-preference` | Daily start prompt preference |
| GET/PUT | `/mood` | Same-day mood check-in |
| GET/PUT | `/accountability-partner` | Accountability partner email |
| GET/PUT | `/theme` | Theme + dark-mode preference |
| GET/PUT | `/semester` | Semester start/end dates |

### Tasks — `/api/tasks`
`GET /` · `GET /history` · `GET /weekly-review` · `POST /` · `PATCH /:id` (edit
any field) · `DELETE /:id` · `PATCH /:id/complete` · `PATCH /:id/schedule-hour` ·
`PATCH /:id/reschedule` · `POST /:id/notes`

### AI — `/api/ai`
`POST /schedule/:id` (schedule a task) · `GET /workload` · `GET /suggestions`

### Chat — `/api/chat`
`POST /command` — natural-language planner commands

### Academics
- **Courses / GPA** — `/api/courses` (`GET`, `POST`, `PATCH /:id`, `DELETE /:id`, `GET /gpa`)
- **Assignments** — `/api/assignments` (`GET`, `POST`, `PATCH /:id`, `DELETE /:id`)
- **Class schedule** — `/api/class-schedule` (`GET`, `POST`, `POST /bulk`, `POST /parse` (OCR text → classes), `DELETE /:id`)
- **Goals** — `/api/goals` (`GET`, `POST`, `PATCH /:id/milestones/:milestoneId`, `DELETE /:id`)
- **Habits** — `/api/habits` (`GET`, `POST`, `POST /:id/toggle`, `DELETE /:id`)

### Social — `/api/social`
`POST /friends/request` · `GET /friends/requests` ·
`POST /friends/requests/:id/:action` · `GET /friends` · `DELETE /friends/:id` ·
`GET /leaderboard`

### Security — `/api/security`
`GET /score` · `GET /login-history` · `GET /sessions` · `DELETE /sessions/:id`

### Account (GDPR) — `/api/account`
`GET /export` · `DELETE /`

### 2FA — `/api/2fa`
`POST /setup` · `POST /verify` · `POST /disable`

### Digest — `/api/digest`
`POST /test` — send yourself a digest now

---

## 📁 Project Structure

```
Schedula/
├── client/                     # React frontend (Material UI)
│   ├── vercel.json             # buildCommand: CI=false npm run build
│   └── src/
│       ├── components/         # AppShell, ChatWidget, MoodCheckIn,
│       │                       #   DailyStartPrompt, AmbientLeaves,
│       │                       #   TimeRedistributionDialog, ErrorBoundary,
│       │                       #   RootThemeProvider, Sidebar panels …
│       ├── pages/              # Dashboard, Calendar, AddTask, CurrentTasks,
│       │                       #   History, GPA, Assignments, ClassSchedule,
│       │                       #   Goals, Habits, WeeklyReview, Streak, Social,
│       │                       #   Timer, Security, Profile, Settings,
│       │                       #   Landing, NotFound, auth pages …
│       ├── hooks/              # Theme + shared hooks
│       ├── context/            # Auth context
│       └── services/           # Axios API client
└── server/                     # Express backend
    ├── server.js               # App entry: DNS pin, helmet, rate limits,
    │                           #   route mounting, digest cron
    ├── config/db.js
    ├── controllers/            # auth, ai, chat, social, security, account, 2FA
    ├── models/                 # User, Task, Course, Assignment, ClassSlot,
    │                           #   Goal, Habit, Friendship, Session,
    │                           #   AuditLog, LoginHistory
    ├── routes/
    ├── middleware/             # protect (JWT), upload (multer)
    └── utils/                  # email, encryption, security, digest helpers
```

---

## 🌍 Deployment

| Piece | Host | Notes |
|-------|------|-------|
| Frontend | **Vercel** | Root = `client/`. Build: `CI=false npm run build` (set in `client/vercel.json`). Set `REACT_APP_API_URL` to the Render API URL. |
| Backend | **Render** | Root = `server/`. Start: `npm start`. `trust proxy` is enabled for `X-Forwarded-For`. Set all `server/.env` vars. |
| Database | **MongoDB Atlas** | Whitelist Render's egress / allow `0.0.0.0/0`. |

CORS is currently open (`app.use(cors())`).

---

## 📝 Notes & Known Quirks

- **DNS pinning:** every file making outbound network calls sets DNS servers to
  Google/Cloudflare — needed for reliable resolution on some restricted
  networks. Keep this when adding new external-request modules.
- **AI Chat / Calendar assistant** is wired end-to-end but was paused during
  development; `create_task` handling and a couple of dependency cleanups are
  tracked in the project roadmap.
- **Task description encryption** is AES via `crypto-js` — the key derives from
  `JWT_SECRET`, so rotating it makes existing encrypted descriptions
  unreadable.
- **Weekly digest cron** only runs while the server process is up; on Render's
  free tier the instance sleeps, so digests may not fire reliably without a
  keep-alive or a paid instance.
