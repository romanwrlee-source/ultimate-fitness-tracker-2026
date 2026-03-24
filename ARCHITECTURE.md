# Architecture

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v3, shadcn/ui, Recharts, TanStack Query v5
- **Backend**: Express 5, TypeScript, Drizzle ORM
- **Database**: SQLite via better-sqlite3 (WAL mode)
- **Routing**: Wouter with hash-based routing
- **Build**: Vite 7, esbuild

### Why These Choices

- **SQLite** — zero-config, file-based DB perfect for a single-user fitness tracker. WAL mode enables concurrent reads.
- **Drizzle ORM** — type-safe, lightweight, works with synchronous better-sqlite3 driver.
- **TanStack Query** — handles server state caching, background refetching, and optimistic updates.
- **shadcn/ui** — accessible, composable UI components built on Radix primitives.
- **Recharts** — declarative charting library that integrates well with React.

## Data Model

### Tables

1. **users** — User accounts (single-user for MVP, extensible via userId FKs)
2. **exercises** — Exercise library (name + muscle group)
3. **workouts** — Workout sessions (name, date, duration)
4. **workoutSets** — Individual sets within a workout (exercise, weight, reps, RPE)
5. **meals** — Meal entries (name, macros, date, meal type, favorites)
6. **dailyMetrics** — Daily body metrics (weight, sleep, steps, energy, mood)
7. **habits** — Habit definitions (name, icon)
8. **habitLogs** — Daily habit completion logs
9. **userSettings** — Per-user targets (calories, protein, weekly workouts)

### Relationships

- exercises, workouts, meals, dailyMetrics, habits, userSettings → users (via userId)
- workoutSets → workouts (via workoutId) and exercises (via exerciseId)
- habitLogs → habits (via habitId)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/user | Get default user |
| GET/POST/DELETE | /api/exercises | CRUD exercises |
| GET/POST/PUT/DELETE | /api/workouts | CRUD workouts |
| POST | /api/workouts/:id/repeat | Quick-log repeat |
| POST/PUT/DELETE | /api/workouts/:id/sets | Manage sets |
| GET/POST/PUT/DELETE | /api/meals | CRUD meals |
| GET | /api/meals/favorites | List favorite meals |
| GET/POST | /api/metrics | CRUD daily metrics |
| GET/POST/DELETE | /api/habits | CRUD habits |
| POST | /api/habits/:id/log | Toggle habit log |
| GET/PUT | /api/settings | User settings |
| GET | /api/analytics/overview | Computed stats |
| GET | /api/analytics/trends | Time-series chart data |
| GET | /api/insights | AI insights (stub) |

## Frontend Routes

| Route | Page | Description |
|-------|------|-------------|
| / | Today | Dashboard with stats, workouts, meals, habits |
| /log | Log | Tabbed view for workouts, meals, metrics entry |
| /trends | Trends | Charts and AI insights |
| /settings | Settings | Targets, exercise library, habit management |

## AI Insights Stub

`server/ai-insights.ts` exports `getInsights(userId)` returning mock data with:
- Summary text
- Categorized suggestions (training, nutrition, recovery)
- Adherence scores (7d and 30d)

To integrate a real LLM, replace the mock return with an API call to your LLM provider, passing the user's recent data as context.
