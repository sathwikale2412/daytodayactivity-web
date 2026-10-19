# Day to Day Activity — Web App

A web conversion of the Android app [daytodayactivity](https://github.com/sathwikale2412/daytodayactivity): a daily task scheduler with routine timetable, consistency analytics, accounts and local persistence.

## Live demo

_Deployed via GitHub Pages — link will be added once Pages is enabled._

## Features

- **Scheduler** — live clock, per-day task list, daily-goal progress bar, NOW highlight for in-range tasks, past-due error styling, filters (All / Active Now / Pending / Completed), add/edit/delete tasks with category and start/end time.
- **Routine** — recurring daily timetable with ACTIVE block highlighting; one click populates the day's schedule from your routines.
- **Analytics** — 7-day completion ratio bar chart (hand-rolled SVG, no chart dependency).
- **Accounts** — sign up / log in with salted SHA-256 password hashing; sessions persist across reloads. Guest mode and a 1-click demo account included.
- **Local database** — everything (users, tasks, routines, profiles) is stored in IndexedDB in your browser; no server needed.
- **Extras** — browser notifications for task starts, completion sound chimes, glassmorphism Material-3-style UI, responsive layout.

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · lucide-react · IndexedDB (vanilla wrapper)

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Project structure

```
src/
  App.jsx                  # app shell, data loading, screen routing
  context/AuthContext.jsx  # auth state + session persistence
  db/database.js           # IndexedDB layer: users, tasks, routines, analytics
  components/              # Navbar, SchedulerScreen, RoutineScreen,
                           # AnalyticsScreen, AddTaskModal, ProfileModal, AuthModal
  services/                # notifications.js, sound.js
```

## Deployment

The build uses relative asset paths (`base: './'` in `vite.config.js`), so `dist/` works on GitHub Pages under any sub-path, and `vercel.json` is included if you prefer Vercel.
