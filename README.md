# Day to Day Activity — Web App

A web conversion of the Android app `daytodayactivity`: a daily task scheduler with routine timetable, consistency analytics, and accounts. Sign in on any device and your tasks, routines and history follow you.

## Live demo

https://daytodayactivity-web.vercel.app

## Features

- **Scheduler** — live clock, per-day task list, daily-goal progress bar, NOW highlight for in-range tasks, past-due error styling, filters (All / Active Now / Pending / Completed), add/delete tasks with category and start/end time.
- **Routine** — recurring daily timetable with ACTIVE block highlighting; one click populates the day's schedule from your routines.
- **Analytics** — 7-day completion ratio bar chart (hand-rolled SVG, no chart dependency).
- **Accounts & cloud sync** — email/password sign up and log in via Supabase Auth. Tasks, routines and preferences are stored in Supabase Postgres and protected by per-user Row Level Security, so data syncs across every device you sign in on.
- **Guest mode** — try the app without an account; guest data is kept locally in the browser (IndexedDB) and is not synced.
- **Extras** — browser notifications for task starts, completion sound chimes, glassmorphism Material-3-style UI, responsive layout.

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · lucide-react · Supabase (Postgres + Auth) · IndexedDB for guest mode

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Cloud setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the `profiles`, `tasks` and `routines` tables, their Row Level Security policies, and a trigger that provisions a profile on signup.
3. (Recommended for instant sign-in) In **Authentication → Providers → Email**, turn **off** "Confirm email". Otherwise new users must confirm via email before their first login.
4. Copy **Project Settings → API → Project URL** and the **anon public key** into `.env` (see `.env.example`):

```bash
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

If these are unset the app runs in local-only guest mode, so it always boots.

## Project structure

```
src/
  App.jsx                  # app shell, data loading, screen routing
  context/AuthContext.jsx  # Supabase auth state + local fallback
  lib/supabase.js          # Supabase client + configured flag
  db/database.js           # Cloud (Supabase) + Local (IndexedDB) stores behind one facade
  components/              # Navbar, SchedulerScreen, RoutineScreen,
                           # AnalyticsScreen, AddTaskModal, ProfileModal, AuthModal
  services/                # notifications.js, sound.js
supabase/schema.sql        # tables + RLS + signup trigger
```

## Deployment (Vercel)

1. Push this repo to GitHub and **Import** it in Vercel (framework preset: Vite).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Project → Settings → Environment Variables**.
3. Deploy. `vercel.json` is included; the build uses relative asset paths (`base: './'`) so it works under any path.
