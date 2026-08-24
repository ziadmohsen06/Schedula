# 🌿 Schedula — AI-Powered Student Planner

**Schedula** is a full-stack web application that helps students manage coursework, deadlines, habits, and study time with AI-powered scheduling. It ships with four fully-themed visual identities (Garden, Ocean, Space, Minimal) that reskin everything from the dashboard to password-reset emails, not just the color palette.

## ✨ Features

### 🎯 Core Task Management
- **AI Task Scheduling** — Powered by Cohere API, automatically splits tasks across days, and now avoids placing study time during your recorded class hours
- **Smart Calendar** — Week/day views with hourly time slots, drag-and-drop rescheduling, a task detail dialog, and an overlay of your classes, assignment deadlines, and goal milestones
- **AI Chat Assistant** — Natural-language commands like "move everything to next week" or "I have an exam Thursday", including creating tasks from a single sentence
- **Focus Timer** — Dedicated timer page (header shortcut) with Start/Pause/Reset, ambient focus sounds, and the Lazy Mode toggle
- **Task Management** — Create, edit, delete, and complete tasks with priorities, tags, notes, and quick-fill templates (University Assignment, Exam Prep, etc.)
- **Overdue Summary** — Dashboard groups overdue tasks into their own section instead of just flagging them inline
- **Time Redistribution** — Spread leftover time to other tasks after finishing early
- **Recurring Tasks** — Bounded recurring series with automatic scheduling
- **Search, Filter & Export** — Find tasks by title/description/tag; export as CSV, JSON, or TXT

### 📚 Academic Tools
- **GPA Tracker** — Courses, grades, and calculated GPA
- **Assignments** — University assignments with submission links and deadlines, visible on the Calendar and factored into burnout detection
- **Class Schedule** — Weekly recurring class times, shown on the Calendar and respected by AI scheduling to avoid overlap
- **Goals & Milestones** — Track long-term goals with checkable milestones, surfaced on the Calendar and in the Weekly Review
- **Habits** — Daily habit tracking with streaks, reflected in a Dashboard stat
- **Weekly Review** — Completed/missed tasks, assignments past deadline or due next week, and upcoming goal milestones in one summary

### 🤝 Social & Accountability
- **Study Buddies** — Friend requests, leaderboard, shared progress
- **Accountability Partner** — Automatic weekly progress email to a friend or mentor
- **Weekly Digest** — Scheduled email summary of upcoming tasks and progress

### 🔐 Security
- **JWT Authentication** with session tracking (active sessions list + revoke) and a "Remember me" login option (session-only by default, persistent if checked)
- **Two-Factor Authentication** — OTP via email (speakeasy + QR code)
- **Password History** — Prevents reusing the last 5 passwords
- **AES Encryption** — Task descriptions encrypted at rest
- **Rate Limiting & Security Headers** — Helmet, express-rate-limit, mongo-sanitize
- **Audit Logs & Login History** — Tracks user actions and login attempts
- **Anomaly Detection** — Flags suspicious logins
- **Security Score** — At-a-glance account security rating
- **GDPR Tools** — Export or delete all account data on demand

### 🎨 Theming & Garden Experience
- **4 Full Themes** — Garden, Ocean, Space, and Minimal, each with its own ambient background, growth visual, decorations, and copy — synced across the app, pre-login pages, and even outgoing emails
- **Landing Page** — Themed marketing page for logged-out visitors, with a custom 404 page and error boundary for the rest of the app
- **Dark/Light Mode** — Per-theme dark variants with smooth transitions
- **Streak Page** — Growing plant (or theme-equivalent) visual + GitHub-style contribution grid
- **Leaf Confetti & Sound Effects** — Celebratory animation and soft rustle on task completion
- **Mood Check-In & Daily Start Prompt** — Same-day mood actually softens AI scheduling capacity and the burnout threshold, not just the Dashboard's briefing text
- **Burnout Detection** — Weighs scheduled task hours, class hours, upcoming assignment deadlines, and goal milestones together, not just overdue tasks
- **Dashboard Stats** — Completion rate, overdue count, habits-today, progress bar, deadline countdowns, with skeleton loaders while data is in flight

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, Material UI, React Router |
| **Backend** | Node.js, Express |
| **Database** | MongoDB Atlas (Mongoose) |
| **AI** | Cohere API (command-r7b-12-2024) |
| **Auth** | JWT, bcryptjs, speakeasy (2FA) |
| **Email** | Nodemailer (SMTP), node-cron (scheduled digests) |
| **Encryption** | crypto-js (AES) |

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- MongoDB Atlas account (or a local MongoDB instance)
- Cohere API key
- An SMTP-capable email account (for OTP, digest, and accountability emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ziadmohsen06/Schedula.git
cd Schedula
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Configure server environment variables**

Create a `server/.env` file:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
COHERE_API_KEY=your_cohere_api_key
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password
PORT=5000
NODE_ENV=development
```

4. **Start the backend**
```bash
npm run dev
```

5. **Install client dependencies** (in a new terminal)
```bash
cd client
npm install
```

6. **Start the frontend**
```bash
npm start
```

The client runs on `http://localhost:3000` and defaults to an API at `http://localhost:5000/api`. To point it at a different backend (e.g. a deployed Render URL), set `REACT_APP_API_URL` in `client/.env` — see `client/.env.example`.

## 📁 Project Structure

```
Schedula/
├── client/          # React frontend (Material UI)
│   └── src/
│       ├── components/   # Shared UI (AppShell, dialogs, chat widget, theming)
│       ├── pages/        # Route-level pages
│       ├── hooks/        # Theme + shared hooks
│       ├── context/      # Auth context
│       └── services/     # API client
└── server/          # Express backend
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    └── utils/            # Email, encryption, security, digest helpers
```
