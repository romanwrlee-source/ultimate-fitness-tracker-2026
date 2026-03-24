import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";
import {
  users,
  exercises,
  workouts,
  workoutSets,
  meals,
  dailyMetrics,
  habits,
  habitLogs,
  userSettings,
} from "../shared/schema";

const testDb = new Database(":memory:");
testDb.pragma("journal_mode = WAL");
const db = drizzle(testDb);

// Create tables
beforeAll(() => {
  testDb.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
    CREATE TABLE exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id)
    );
    CREATE TABLE workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      duration INTEGER,
      created_at TEXT NOT NULL
    );
    CREATE TABLE workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER REFERENCES workouts(id),
      exercise_id INTEGER REFERENCES exercises(id),
      set_number INTEGER NOT NULL,
      weight REAL,
      reps INTEGER,
      rpe REAL,
      notes TEXT
    );
    CREATE TABLE meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT,
      calories INTEGER,
      protein REAL,
      carbs REAL,
      fats REAL,
      is_favorite INTEGER DEFAULT 0
    );
    CREATE TABLE daily_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      date TEXT NOT NULL,
      bodyweight REAL,
      sleep_hours REAL,
      steps INTEGER,
      energy_level INTEGER,
      mood_level INTEGER,
      notes TEXT
    );
    CREATE TABLE habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      icon TEXT
    );
    CREATE TABLE habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER REFERENCES habits(id),
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0
    );
    CREATE TABLE user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      daily_calorie_target INTEGER DEFAULT 2500,
      daily_protein_target INTEGER DEFAULT 150,
      weekly_workout_target INTEGER DEFAULT 5
    );
  `);
});

describe("Storage CRUD Operations", () => {
  let userId: number;

  it("creates a user", () => {
    const user = db.insert(users).values({ username: "testuser", password: "testpass" }).returning().get();
    expect(user.id).toBeDefined();
    expect(user.username).toBe("testuser");
    userId = user.id;
  });

  it("gets a user by id", () => {
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    expect(user).toBeDefined();
    expect(user!.username).toBe("testuser");
  });

  it("creates an exercise", () => {
    const ex = db.insert(exercises).values({ name: "Bench Press", muscleGroup: "chest", userId }).returning().get();
    expect(ex.id).toBeDefined();
    expect(ex.name).toBe("Bench Press");
  });

  it("lists exercises", () => {
    db.insert(exercises).values({ name: "Squat", muscleGroup: "legs", userId }).run();
    const all = db.select().from(exercises).where(eq(exercises.userId, userId)).all();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("creates a workout with sets", () => {
    const workout = db.insert(workouts).values({
      userId,
      name: "Push Day",
      date: "2026-03-20",
      duration: 60,
      createdAt: new Date().toISOString(),
    }).returning().get();
    expect(workout.id).toBeDefined();

    const exs = db.select().from(exercises).where(eq(exercises.userId, userId)).all();
    const set = db.insert(workoutSets).values({
      workoutId: workout.id,
      exerciseId: exs[0].id,
      setNumber: 1,
      weight: 185,
      reps: 8,
      rpe: 7.5,
    }).returning().get();
    expect(set.id).toBeDefined();
    expect(set.weight).toBe(185);
  });

  it("creates and retrieves meals", () => {
    const meal = db.insert(meals).values({
      userId,
      name: "Chicken & Rice",
      date: "2026-03-20",
      mealType: "lunch",
      calories: 650,
      protein: 45,
      carbs: 70,
      fats: 15,
      isFavorite: 1,
    }).returning().get();
    expect(meal.id).toBeDefined();

    const favs = db.select().from(meals).where(
      and(eq(meals.userId, userId), eq(meals.isFavorite, 1))
    ).all();
    expect(favs.length).toBe(1);
    expect(favs[0].name).toBe("Chicken & Rice");
  });

  it("creates and upserts daily metrics", () => {
    const m = db.insert(dailyMetrics).values({
      userId,
      date: "2026-03-20",
      bodyweight: 175.5,
      sleepHours: 7,
      steps: 8000,
      energyLevel: 4,
      moodLevel: 4,
    }).returning().get();
    expect(m.id).toBeDefined();

    // Upsert — update existing
    db.update(dailyMetrics).set({ bodyweight: 176 }).where(eq(dailyMetrics.id, m.id)).run();
    const updated = db.select().from(dailyMetrics).where(eq(dailyMetrics.id, m.id)).get();
    expect(updated!.bodyweight).toBe(176);
  });

  it("creates habits and toggle logs", () => {
    const habit = db.insert(habits).values({ userId, name: "Gym", icon: "dumbbell" }).returning().get();
    expect(habit.id).toBeDefined();

    // Toggle on
    const log = db.insert(habitLogs).values({ habitId: habit.id, date: "2026-03-20", completed: 1 }).returning().get();
    expect(log.completed).toBe(1);

    // Toggle off
    db.update(habitLogs).set({ completed: 0 }).where(eq(habitLogs.id, log.id)).run();
    const toggled = db.select().from(habitLogs).where(eq(habitLogs.id, log.id)).get();
    expect(toggled!.completed).toBe(0);
  });

  it("creates and updates user settings", () => {
    const s = db.insert(userSettings).values({
      userId,
      dailyCalorieTarget: 2500,
      dailyProteinTarget: 150,
      weeklyWorkoutTarget: 5,
    }).returning().get();
    expect(s.dailyCalorieTarget).toBe(2500);

    db.update(userSettings).set({ dailyCalorieTarget: 2200 }).where(eq(userSettings.id, s.id)).run();
    const updated = db.select().from(userSettings).where(eq(userSettings.id, s.id)).get();
    expect(updated!.dailyCalorieTarget).toBe(2200);
  });

  it("deletes a workout and its sets", () => {
    const workout = db.insert(workouts).values({
      userId,
      name: "Delete Me",
      date: "2026-03-21",
      createdAt: new Date().toISOString(),
    }).returning().get();

    const exs = db.select().from(exercises).where(eq(exercises.userId, userId)).all();
    db.insert(workoutSets).values({
      workoutId: workout.id,
      exerciseId: exs[0].id,
      setNumber: 1,
      weight: 100,
      reps: 10,
    }).run();

    // Delete
    db.delete(workoutSets).where(eq(workoutSets.workoutId, workout.id)).run();
    db.delete(workouts).where(eq(workouts.id, workout.id)).run();

    const deleted = db.select().from(workouts).where(eq(workouts.id, workout.id)).get();
    expect(deleted).toBeUndefined();

    const orphanSets = db.select().from(workoutSets).where(eq(workoutSets.workoutId, workout.id)).all();
    expect(orphanSets.length).toBe(0);
  });
});
