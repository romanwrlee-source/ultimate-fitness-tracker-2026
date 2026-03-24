# Ultimate Fitness Companion

A responsive web app for tracking workouts, nutrition, body metrics, and daily habits — with AI-generated insights. Designed for a student who trains 3-6x/week and needs fast logging with clear trends.

## Features

- **Today Dashboard** — Quick stats (weight, calories, protein, weekly workouts), today's workout with Quick Log repeat, meal summary, habit checklist
- **Workout Logging** — Create workouts, add exercises and sets (weight/reps/RPE), expand/edit past workouts
- **Meal Tracking** — Log meals with macros, favorite meals for 1-click reuse, grouped by date
- **Body Metrics** — Daily entry for bodyweight, sleep, steps, energy, mood
- **Habit Tracking** — Custom habits with daily toggle checklist
- **Trends & Charts** — Weight, volume by muscle group, calorie/protein adherence, sleep, steps (30-day)
- **AI Insights** — Adherence scores, training/nutrition/recovery suggestions (stub, ready for LLM integration)
- **Settings** — Calorie/protein/workout targets, exercise library, habit management
- **Light/Dark Mode** — Toggle via sidebar

## Tech Stack

- React 18 + TypeScript + Tailwind CSS v3 + shadcn/ui
- Express 5 + Drizzle ORM + SQLite
- Recharts for charts
- TanStack Query v5 for data fetching
- Wouter for hash-based routing
- Vite for dev/build

## Getting Started

```bash
npm install
npm run dev
```

The app runs on port 5000.

## Running Tests

```bash
npx vitest run
```

## Deployment

### Vercel
Build with `npm run build`, deploy the `dist/` folder.

### Fly.io
Use the Dockerfile pattern — `npm run build` then `npm start`.

The app uses SQLite, so ensure persistent storage is mounted at the project root for `data.db`.

## Screenshots

_Screenshots placeholder — add after deployment._
