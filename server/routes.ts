import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getInsights } from "./ai-insights";
import {
  insertExerciseSchema,
  insertWorkoutSchema,
  insertWorkoutSetSchema,
  insertMealSchema,
  insertDailyMetricsSchema,
  insertHabitSchema,
  insertUserSettingsSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Auth (stub) ──
  app.get("/api/user", async (_req, res) => {
    const user = await storage.getUser(1);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // ── Exercises ──
  app.get("/api/exercises", async (_req, res) => {
    const exercises = await storage.getExercises(1);
    res.json(exercises);
  });

  app.post("/api/exercises", async (req, res) => {
    const parsed = insertExerciseSchema.safeParse({ ...req.body, userId: 1 });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const exercise = await storage.createExercise(parsed.data);
    res.status(201).json(exercise);
  });

  app.delete("/api/exercises/:id", async (req, res) => {
    await storage.deleteExercise(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Workouts ──
  app.get("/api/workouts", async (req, res) => {
    const date = req.query.date as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const workouts = await storage.getWorkouts(1, date, limit);
    res.json(workouts);
  });

  app.get("/api/workouts/:id", async (req, res) => {
    const result = await storage.getWorkoutWithSets(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Workout not found" });
    res.json(result);
  });

  app.post("/api/workouts", async (req, res) => {
    const parsed = insertWorkoutSchema.safeParse({ ...req.body, userId: 1 });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const workout = await storage.createWorkout(parsed.data);
    res.status(201).json(workout);
  });

  app.put("/api/workouts/:id", async (req, res) => {
    const workout = await storage.updateWorkout(Number(req.params.id), req.body);
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json(workout);
  });

  app.delete("/api/workouts/:id", async (req, res) => {
    await storage.deleteWorkout(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/workouts/:id/repeat", async (req, res) => {
    try {
      const workout = await storage.repeatWorkout(Number(req.params.id), 1);
      res.status(201).json(workout);
    } catch (e: any) {
      res.status(404).json({ message: e.message });
    }
  });

  // ── Workout Sets ──
  app.post("/api/workouts/:workoutId/sets", async (req, res) => {
    const parsed = insertWorkoutSetSchema.safeParse({
      ...req.body,
      workoutId: Number(req.params.workoutId),
    });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const set = await storage.createWorkoutSet(parsed.data);
    res.status(201).json(set);
  });

  app.put("/api/sets/:id", async (req, res) => {
    const set = await storage.updateWorkoutSet(Number(req.params.id), req.body);
    if (!set) return res.status(404).json({ message: "Set not found" });
    res.json(set);
  });

  app.delete("/api/sets/:id", async (req, res) => {
    await storage.deleteWorkoutSet(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Meals ──
  app.get("/api/meals", async (req, res) => {
    const date = req.query.date as string | undefined;
    const meals = await storage.getMeals(1, date);
    res.json(meals);
  });

  app.get("/api/meals/favorites", async (_req, res) => {
    const favorites = await storage.getFavoriteMeals(1);
    res.json(favorites);
  });

  app.post("/api/meals", async (req, res) => {
    const parsed = insertMealSchema.safeParse({ ...req.body, userId: 1 });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const meal = await storage.createMeal(parsed.data);
    res.status(201).json(meal);
  });

  app.put("/api/meals/:id", async (req, res) => {
    const meal = await storage.updateMeal(Number(req.params.id), req.body);
    if (!meal) return res.status(404).json({ message: "Meal not found" });
    res.json(meal);
  });

  app.delete("/api/meals/:id", async (req, res) => {
    await storage.deleteMeal(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Daily Metrics ──
  app.get("/api/metrics", async (req, res) => {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const metrics = await storage.getDailyMetrics(1, startDate, endDate);
    res.json(metrics);
  });

  app.get("/api/metrics/:date", async (req, res) => {
    const metrics = await storage.getDailyMetricsByDate(1, req.params.date);
    if (!metrics) return res.status(404).json({ message: "No metrics for this date" });
    res.json(metrics);
  });

  app.post("/api/metrics", async (req, res) => {
    const parsed = insertDailyMetricsSchema.safeParse({ ...req.body, userId: 1 });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const metrics = await storage.upsertDailyMetrics(parsed.data);
    res.json(metrics);
  });

  // ── Habits ──
  app.get("/api/habits", async (_req, res) => {
    const habits = await storage.getHabits(1);
    res.json(habits);
  });

  app.post("/api/habits", async (req, res) => {
    const parsed = insertHabitSchema.safeParse({ ...req.body, userId: 1 });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const habit = await storage.createHabit(parsed.data);
    res.status(201).json(habit);
  });

  app.delete("/api/habits/:id", async (req, res) => {
    await storage.deleteHabit(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/habits/logs", async (req, res) => {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const habits = await storage.getHabits(1);
    const habitIds = habits.map(h => h.id);
    const logs = await storage.getHabitLogs(habitIds, startDate, endDate);
    res.json(logs);
  });

  app.post("/api/habits/:id/log", async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: "date is required" });
    const log = await storage.toggleHabitLog(Number(req.params.id), date);
    res.json(log);
  });

  // ── User Settings ──
  app.get("/api/settings", async (_req, res) => {
    const settings = await storage.getUserSettings(1);
    if (!settings) return res.status(404).json({ message: "Settings not found" });
    res.json(settings);
  });

  app.put("/api/settings", async (req, res) => {
    const parsed = insertUserSettingsSchema.safeParse({ ...req.body, userId: 1 });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const settings = await storage.upsertUserSettings(parsed.data);
    res.json(settings);
  });

  // ── Analytics ──
  app.get("/api/analytics/overview", async (_req, res) => {
    const overview = await storage.getAnalyticsOverview(1);
    res.json(overview);
  });

  app.get("/api/analytics/trends", async (_req, res) => {
    const trends = await storage.getAnalyticsTrends(1);
    res.json(trends);
  });

  // ── AI Insights ──
  app.get("/api/insights", async (_req, res) => {
    const insights = await getInsights(1);
    res.json(insights);
  });

  return httpServer;
}
