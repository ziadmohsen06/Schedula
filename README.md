# 🌿 Schedula — AI-Powered Student Planner

**Schedula** is a full-stack web application that helps students manage their tasks with AI-powered scheduling. Built with a beautiful garden theme, it turns productivity into a growing experience.

## ✨ Features

### 🎯 Core Features
- **AI Task Scheduling** — Powered by Cohere API, automatically splits tasks across days
- **Smart Calendar** — Weekly view with time slots, task details, and day/night modes
- **Pomodoro Timer** — Focus timer integrated with specific tasks
- **Task Management** — Create, edit, delete, and complete tasks with ease
- **Tags & Categories** — Organize tasks by University, Work, Personal, Gym, Errands
- **Task Notes** — Add expandable notes to any task
- **Search & Filter** — Find tasks by title, description, or tag
- **Export** — Download tasks as CSV, JSON, or TXT

### 🔐 Security
- **JWT Authentication** — Secure token-based auth
- **Two-Factor Authentication** — OTP via email (speakeasy + QR code)
- **Password History** — Prevents reusing last 5 passwords
- **AES Encryption** — Task descriptions encrypted
- **Rate Limiting** — Prevents brute force attacks
- **Audit Logs** — Tracks user actions
- **Anomaly Detection** — Detects suspicious logins

### 🌱 Garden Theme
- **Dark/Light Mode** — Smooth transitions
- **Leaf Animations** — Floating leaves on task completion
- **Sound Effects** — Soft leaf rustle on completion
- **Streak Page** — Growing plant + GitHub-style contribution grid
- **Lazy Mode** — Shortened focus timer for easy days
- **Leaf Confetti** — Celebratory animation when all tasks done

### 📊 Smart Features
- **Burnout Detection** — Warning when too many overdue tasks
- **Daily Start Prompt** — AI schedules based on when you want to start
- **Time Redistribution** — Spread extra time to other tasks
- **Dashboard Stats** — Completion rate, overdue count, progress bar
- **Deadline Countdown** — "3 days left" with color coding

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, Material UI, React Router |
| **Backend** | Node.js, Express |
| **Database** | MongoDB Atlas (Mongoose) |
| **AI** | Cohere API (command-r7b-12-2024) |
| **Auth** | JWT, bcryptjs, speakeasy (2FA) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Encryption** | crypto-js (AES) |

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- MongoDB Atlas account
- Cohere API key
- Gmail account (for OTP emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/Schedula.git
cd Schedula
