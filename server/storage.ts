import {
  type User, type InsertUser, users,
  type Exercise, type InsertExercise, exercises,
  type Workout, type InsertWorkout, workouts,
  type WorkoutSet, type InsertWorkoutSet, workoutSets,
  type Meal, type InsertMeal, meals,
  type DailyMetrics, type InsertDailyMetrics, dailyMetrics,
  type Habit, type InsertHabit, habits,
  type HabitLog, type InsertHabitLog, habitLogs,
  type UserSettings, type InsertUserSettings, userSettings,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { format, subDays, addDays } from "date-fns";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Exercises
  getExercises(userId?: number): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  deleteExercise(id: number): Promise<void>;

  // Workouts
  getWorkouts(userId: number, date?: string, limit?: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  getWorkoutWithSets(id: number): Promise<{ workout: Workout; sets: (WorkoutSet & { exerciseName?: string })[] } | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<void>;
  repeatWorkout(workoutId: number, userId: number): Promise<Workout>;

  // Workout Sets
  createWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet>;
  updateWorkoutSet(id: number, set: Partial<InsertWorkoutSet>): Promise<WorkoutSet | undefined>;
  deleteWorkoutSet(id: number): Promise<void>;
  getWorkoutSets(workoutId: number): Promise<WorkoutSet[]>;

  // Meals
  getMeals(userId: number, date?: string): Promise<Meal[]>;
  getFavoriteMeals(userId: number): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, meal: Partial<InsertMeal>): Promise<Meal | undefined>;
  deleteMeal(id: number): Promise<void>;

  // Daily Metrics
  getDailyMetrics(userId: number, startDate?: string, endDate?: string): Promise<DailyMetrics[]>;
  getDailyMetricsByDate(userId: number, date: string): Promise<DailyMetrics | undefined>;
  upsertDailyMetrics(metrics: InsertDailyMetrics): Promise<DailyMetrics>;

  // Habits
  getHabits(userId: number): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  deleteHabit(id: number): Promise<void>;
  getHabitLogs(habitIds: number[], startDate?: string, endDate?: string): Promise<HabitLog[]>;
  toggleHabitLog(habitId: number, date: string): Promise<HabitLog>;

  // User Settings
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;

  // Analytics
  getAnalyticsOverview(userId: number): Promise<any>;
  getAnalyticsTrends(userId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  // Exercises
  async getExercises(userId?: number): Promise<Exercise[]> {
    if (userId) {
      return db.select().from(exercises).where(eq(exercises.userId, userId)).all();
    }
    return db.select().from(exercises).all();
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    return db.insert(exercises).values(exercise).returning().get();
  }

  async deleteExercise(id: number): Promise<void> {
    db.delete(exercises).where(eq(exercises.id, id)).run();
  }

  // Workouts
  async getWorkouts(userId: number, date?: string, limit?: number): Promise<Workout[]> {
    let query = db.select().from(workouts).where(
      date
        ? and(eq(workouts.userId, userId), eq(workouts.date, date))
        : eq(workouts.userId, userId)
    ).orderBy(desc(workouts.date));

    if (limit) {
      return query.limit(limit).all();
    }
    return query.all();
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return db.select().from(workouts).where(eq(workouts.id, id)).get();
  }

  async getWorkoutWithSets(id: number): Promise<{ workout: Workout; sets: (WorkoutSet & { exerciseName?: string })[] } | undefined> {
    const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
    if (!workout) return undefined;

    const sets = db
      .select({
        id: workoutSets.id,
        workoutId: workoutSets.workoutId,
        exerciseId: workoutSets.exerciseId,
        setNumber: workoutSets.setNumber,
        weight: workoutSets.weight,
        reps: workoutSets.reps,
        rpe: workoutSets.rpe,
        notes: workoutSets.notes,
        exerciseName: exercises.name,
      })
      .from(workoutSets)
      .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(eq(workoutSets.workoutId, id))
      .all();

    return { workout, sets };
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    return db.insert(workouts).values({
      ...workout,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined> {
    return db.update(workouts).set(workout).where(eq(workouts.id, id)).returning().get();
  }

  async deleteWorkout(id: number): Promise<void> {
    db.delete(workoutSets).where(eq(workoutSets.workoutId, id)).run();
    db.delete(workouts).where(eq(workouts.id, id)).run();
  }

  async repeatWorkout(workoutId: number, userId: number): Promise<Workout> {
    const original = await this.getWorkoutWithSets(workoutId);
    if (!original) throw new Error("Workout not found");

    const today = format(new Date(), "yyyy-MM-dd");
    const newWorkout = db.insert(workouts).values({
      userId,
      name: original.workout.name,
      date: today,
      notes: `Repeated from ${original.workout.date}`,
      duration: original.workout.duration,
      createdAt: new Date().toISOString(),
    }).returning().get();

    for (const set of original.sets) {
      db.insert(workoutSets).values({
        workoutId: newWorkout.id,
        exerciseId: set.exerciseId,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
      }).run();
    }

    return newWorkout;
  }

  // Workout Sets
  async createWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet> {
    return db.insert(workoutSets).values(set).returning().get();
  }

  async updateWorkoutSet(id: number, set: Partial<InsertWorkoutSet>): Promise<WorkoutSet | undefined> {
    return db.update(workoutSets).set(set).where(eq(workoutSets.id, id)).returning().get();
  }

  async deleteWorkoutSet(id: number): Promise<void> {
    db.delete(workoutSets).where(eq(workoutSets.id, id)).run();
  }

  async getWorkoutSets(workoutId: number): Promise<WorkoutSet[]> {
    return db.select().from(workoutSets).where(eq(workoutSets.workoutId, workoutId)).all();
  }

  // Meals
  async getMeals(userId: number, date?: string): Promise<Meal[]> {
    if (date) {
      return db.select().from(meals).where(
        and(eq(meals.userId, userId), eq(meals.date, date))
      ).all();
    }
    return db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.date)).all();
  }

  async getFavoriteMeals(userId: number): Promise<Meal[]> {
    return db.select().from(meals).where(
      and(eq(meals.userId, userId), eq(meals.isFavorite, 1))
    ).all();
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    return db.insert(meals).values(meal).returning().get();
  }

  async updateMeal(id: number, meal: Partial<InsertMeal>): Promise<Meal | undefined> {
    return db.update(meals).set(meal).where(eq(meals.id, id)).returning().get();
  }

  async deleteMeal(id: number): Promise<void> {
    db.delete(meals).where(eq(meals.id, id)).run();
  }

  // Daily Metrics
  async getDailyMetrics(userId: number, startDate?: string, endDate?: string): Promise<DailyMetrics[]> {
    if (startDate && endDate) {
      return db.select().from(dailyMetrics).where(
        and(
          eq(dailyMetrics.userId, userId),
          gte(dailyMetrics.date, startDate),
          lte(dailyMetrics.date, endDate)
        )
      ).orderBy(dailyMetrics.date).all();
    }
    return db.select().from(dailyMetrics).where(eq(dailyMetrics.userId, userId)).orderBy(dailyMetrics.date).all();
  }

  async getDailyMetricsByDate(userId: number, date: string): Promise<DailyMetrics | undefined> {
    return db.select().from(dailyMetrics).where(
      and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date))
    ).get();
  }

  async upsertDailyMetrics(metrics: InsertDailyMetrics): Promise<DailyMetrics> {
    const existing = await this.getDailyMetricsByDate(metrics.userId!, metrics.date!);
    if (existing) {
      return db.update(dailyMetrics).set(metrics).where(eq(dailyMetrics.id, existing.id)).returning().get();
    }
    return db.insert(dailyMetrics).values(metrics).returning().get();
  }

  // Habits
  async getHabits(userId: number): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.userId, userId)).all();
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    return db.insert(habits).values(habit).returning().get();
  }

  async deleteHabit(id: number): Promise<void> {
    db.delete(habitLogs).where(eq(habitLogs.habitId, id)).run();
    db.delete(habits).where(eq(habits.id, id)).run();
  }

  async getHabitLogs(habitIds: number[], startDate?: string, endDate?: string): Promise<HabitLog[]> {
    if (habitIds.length === 0) return [];
    const allLogs: HabitLog[] = [];
    for (const hid of habitIds) {
      let q;
      if (startDate && endDate) {
        q = db.select().from(habitLogs).where(
          and(eq(habitLogs.habitId, hid), gte(habitLogs.date, startDate), lte(habitLogs.date, endDate))
        ).all();
      } else {
        q = db.select().from(habitLogs).where(eq(habitLogs.habitId, hid)).all();
      }
      allLogs.push(...q);
    }
    return allLogs;
  }

  async toggleHabitLog(habitId: number, date: string): Promise<HabitLog> {
    const existing = db.select().from(habitLogs).where(
      and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date))
    ).get();

    if (existing) {
      return db.update(habitLogs).set({ completed: existing.completed === 1 ? 0 : 1 }).where(eq(habitLogs.id, existing.id)).returning().get();
    }
    return db.insert(habitLogs).values({ habitId, date, completed: 1 }).returning().get();
  }

  // User Settings
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return db.select().from(userSettings).where(eq(userSettings.userId, userId)).get();
  }

  async upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const existing = await this.getUserSettings(settings.userId!);
    if (existing) {
      return db.update(userSettings).set(settings).where(eq(userSettings.id, existing.id)).returning().get();
    }
    return db.insert(userSettings).values(settings).returning().get();
  }

  // Analytics
  async getAnalyticsOverview(userId: number): Promise<any> {
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    // Weekly workouts
    const weeklyWorkouts = db.select().from(workouts).where(
      and(eq(workouts.userId, userId), gte(workouts.date, weekAgo))
    ).all();

    // Monthly workouts
    const monthlyWorkouts = db.select().from(workouts).where(
      and(eq(workouts.userId, userId), gte(workouts.date, monthAgo))
    ).all();

    // Weekly volume (total sets * weight * reps)
    const weeklyWorkoutIds = weeklyWorkouts.map(w => w.id);
    let weeklyVolume = 0;
    for (const wid of weeklyWorkoutIds) {
      const sets = db.select().from(workoutSets).where(eq(workoutSets.workoutId, wid)).all();
      for (const s of sets) {
        weeklyVolume += (s.weight || 0) * (s.reps || 0);
      }
    }

    // Calorie/protein averages (last 7 days)
    const weekMeals = db.select().from(meals).where(
      and(eq(meals.userId, userId), gte(meals.date, weekAgo))
    ).all();

    const totalCalories = weekMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProtein = weekMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const daysWithMeals = new Set(weekMeals.map(m => m.date)).size || 1;

    // Settings for targets
    const settings = await this.getUserSettings(userId);
    const calorieTarget = settings?.dailyCalorieTarget || 2500;
    const proteinTarget = settings?.dailyProteinTarget || 150;
    const workoutTarget = settings?.weeklyWorkoutTarget || 5;

    // Training adherence
    const trainingAdherence7d = Math.min(weeklyWorkouts.length / workoutTarget, 1);
    const weeksInMonth = 4;
    const trainingAdherence30d = Math.min(monthlyWorkouts.length / (workoutTarget * weeksInMonth), 1);

    // Nutrition adherence
    const avgCalories = totalCalories / daysWithMeals;
    const nutritionAdherence = Math.min(avgCalories / calorieTarget, 1);

    return {
      weeklyWorkouts: weeklyWorkouts.length,
      monthlyWorkouts: monthlyWorkouts.length,
      weeklyVolume,
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(totalProtein / daysWithMeals),
      calorieTarget,
      proteinTarget,
      workoutTarget,
      trainingAdherence7d: Math.round(trainingAdherence7d * 100) / 100,
      trainingAdherence30d: Math.round(trainingAdherence30d * 100) / 100,
      nutritionAdherence7d: Math.round(nutritionAdherence * 100) / 100,
    };
  }

  async getAnalyticsTrends(userId: number): Promise<any> {
    const endDate = format(new Date(), "yyyy-MM-dd");
    const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");

    // Weight trend
    const metricsData = db.select().from(dailyMetrics).where(
      and(eq(dailyMetrics.userId, userId), gte(dailyMetrics.date, startDate), lte(dailyMetrics.date, endDate))
    ).orderBy(dailyMetrics.date).all();

    // Calorie and protein trend
    const mealsData = db.select().from(meals).where(
      and(eq(meals.userId, userId), gte(meals.date, startDate), lte(meals.date, endDate))
    ).orderBy(meals.date).all();

    // Group meals by date
    const mealsByDate: Record<string, { calories: number; protein: number }> = {};
    for (const m of mealsData) {
      if (!mealsByDate[m.date]) {
        mealsByDate[m.date] = { calories: 0, protein: 0 };
      }
      mealsByDate[m.date].calories += m.calories || 0;
      mealsByDate[m.date].protein += m.protein || 0;
    }

    // Volume by muscle group (weekly)
    const weekStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const weekWorkouts = db.select().from(workouts).where(
      and(eq(workouts.userId, userId), gte(workouts.date, weekStart))
    ).all();

    const volumeByMuscle: Record<string, number> = {};
    for (const w of weekWorkouts) {
      const sets = db.select({
        weight: workoutSets.weight,
        reps: workoutSets.reps,
        muscleGroup: exercises.muscleGroup,
      }).from(workoutSets)
        .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
        .where(eq(workoutSets.workoutId, w.id)).all();

      for (const s of sets) {
        const group = s.muscleGroup || "other";
        volumeByMuscle[group] = (volumeByMuscle[group] || 0) + (s.weight || 0) * (s.reps || 0);
      }
    }

    const settings = await this.getUserSettings(userId);
    const calorieTarget = settings?.dailyCalorieTarget || 2500;
    const proteinTarget = settings?.dailyProteinTarget || 150;

    return {
      weight: metricsData.filter(m => m.bodyweight).map(m => ({ date: m.date, value: m.bodyweight })),
      sleep: metricsData.filter(m => m.sleepHours).map(m => ({ date: m.date, value: m.sleepHours })),
      steps: metricsData.filter(m => m.steps).map(m => ({ date: m.date, value: m.steps })),
      calories: Object.entries(mealsByDate).map(([date, v]) => ({ date, value: v.calories, target: calorieTarget })),
      protein: Object.entries(mealsByDate).map(([date, v]) => ({ date, value: v.protein, target: proteinTarget })),
      volumeByMuscle: Object.entries(volumeByMuscle).map(([group, volume]) => ({ group, volume })),
    };
  }
}

export const storage = new DatabaseStorage();

// Seed function
export async function seedDatabase() {
  // Check if already seeded
  const existingUser = db.select().from(users).where(eq(users.username, "user")).get();
  if (existingUser) return;

  // Create default user
  const user = db.insert(users).values({ username: "user", password: "password" }).returning().get();

  // Create default settings
  db.insert(userSettings).values({
    userId: user.id,
    dailyCalorieTarget: 2500,
    dailyProteinTarget: 150,
    weeklyWorkoutTarget: 5,
  }).run();

  // Create exercises
  const exerciseData: { name: string; muscleGroup: string }[] = [
    { name: "Bench Press", muscleGroup: "chest" },
    { name: "Incline Dumbbell Press", muscleGroup: "chest" },
    { name: "Cable Flyes", muscleGroup: "chest" },
    { name: "Barbell Row", muscleGroup: "back" },
    { name: "Pull-ups", muscleGroup: "back" },
    { name: "Lat Pulldown", muscleGroup: "back" },
    { name: "Barbell Squat", muscleGroup: "legs" },
    { name: "Romanian Deadlift", muscleGroup: "legs" },
    { name: "Leg Press", muscleGroup: "legs" },
    { name: "Overhead Press", muscleGroup: "shoulders" },
    { name: "Lateral Raises", muscleGroup: "shoulders" },
    { name: "Barbell Curl", muscleGroup: "arms" },
    { name: "Tricep Pushdown", muscleGroup: "arms" },
    { name: "Plank", muscleGroup: "core" },
    { name: "Treadmill Run", muscleGroup: "cardio" },
  ];

  const createdExercises: Exercise[] = [];
  for (const ex of exerciseData) {
    const created = db.insert(exercises).values({ ...ex, userId: user.id }).returning().get();
    createdExercises.push(created);
  }

  // Helper to get exercise id by name
  const exId = (name: string) => createdExercises.find(e => e.name === name)!.id;

  // Create 3 weeks of workouts (about 4 per week)
  const today = new Date();
  const workoutTemplates = [
    { name: "Push Day A", exercises: [
      { eid: exId("Bench Press"), sets: [[185, 8], [185, 7], [175, 8], [175, 7]] },
      { eid: exId("Incline Dumbbell Press"), sets: [[65, 10], [65, 9], [60, 10]] },
      { eid: exId("Cable Flyes"), sets: [[30, 12], [30, 12]] },
      { eid: exId("Overhead Press"), sets: [[95, 8], [95, 7], [85, 8]] },
      { eid: exId("Lateral Raises"), sets: [[20, 15], [20, 12]] },
      { eid: exId("Tricep Pushdown"), sets: [[50, 12], [50, 10]] },
    ]},
    { name: "Pull Day A", exercises: [
      { eid: exId("Barbell Row"), sets: [[155, 8], [155, 7], [145, 8]] },
      { eid: exId("Pull-ups"), sets: [[0, 10], [0, 8], [0, 7]] },
      { eid: exId("Lat Pulldown"), sets: [[120, 10], [120, 9]] },
      { eid: exId("Barbell Curl"), sets: [[65, 10], [65, 9], [60, 10]] },
    ]},
    { name: "Leg Day", exercises: [
      { eid: exId("Barbell Squat"), sets: [[225, 6], [225, 5], [205, 6], [205, 6]] },
      { eid: exId("Romanian Deadlift"), sets: [[185, 8], [185, 8], [175, 8]] },
      { eid: exId("Leg Press"), sets: [[360, 10], [360, 10], [340, 12]] },
    ]},
    { name: "Upper Body B", exercises: [
      { eid: exId("Bench Press"), sets: [[175, 10], [175, 9], [165, 10]] },
      { eid: exId("Barbell Row"), sets: [[145, 10], [145, 9], [135, 10]] },
      { eid: exId("Overhead Press"), sets: [[85, 10], [85, 9]] },
      { eid: exId("Lateral Raises"), sets: [[20, 15], [20, 12]] },
      { eid: exId("Barbell Curl"), sets: [[55, 12], [55, 10]] },
      { eid: exId("Tricep Pushdown"), sets: [[45, 12], [45, 12]] },
    ]},
  ];

  // Generate workout schedule: 4 workouts per week for 3 weeks
  let workoutIndex = 0;
  for (let dayOffset = 21; dayOffset >= 0; dayOffset--) {
    const date = subDays(today, dayOffset);
    const dayOfWeek = date.getDay();
    // Skip rest days (Wednesday and Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 3) continue;

    const template = workoutTemplates[workoutIndex % workoutTemplates.length];
    const dateStr = format(date, "yyyy-MM-dd");

    const workout = db.insert(workouts).values({
      userId: user.id,
      name: template.name,
      date: dateStr,
      duration: 55 + Math.floor(Math.random() * 20),
      notes: null,
      createdAt: date.toISOString(),
    }).returning().get();

    for (const ex of template.exercises) {
      for (let i = 0; i < ex.sets.length; i++) {
        const [weight, reps] = ex.sets[i];
        db.insert(workoutSets).values({
          workoutId: workout.id,
          exerciseId: ex.eid,
          setNumber: i + 1,
          weight: weight + Math.floor(Math.random() * 5) - 2,
          reps: reps + Math.floor(Math.random() * 2),
          rpe: 7 + Math.random() * 2,
        }).run();
      }
    }
    workoutIndex++;
  }

  // Create 3 weeks of meals
  const mealTemplates = [
    { name: "Oatmeal with Protein", type: "breakfast", cal: 450, protein: 35, carbs: 55, fats: 12, fav: 1 },
    { name: "Greek Yogurt Bowl", type: "breakfast", cal: 380, protein: 30, carbs: 45, fats: 8, fav: 1 },
    { name: "Eggs & Toast", type: "breakfast", cal: 420, protein: 28, carbs: 35, fats: 18, fav: 0 },
    { name: "Chicken & Rice", type: "lunch", cal: 650, protein: 45, carbs: 70, fats: 15, fav: 1 },
    { name: "Turkey Wrap", type: "lunch", cal: 520, protein: 38, carbs: 50, fats: 14, fav: 0 },
    { name: "Salmon Bowl", type: "lunch", cal: 580, protein: 40, carbs: 55, fats: 20, fav: 1 },
    { name: "Steak & Sweet Potato", type: "dinner", cal: 720, protein: 50, carbs: 60, fats: 25, fav: 1 },
    { name: "Pasta with Meat Sauce", type: "dinner", cal: 680, protein: 35, carbs: 80, fats: 20, fav: 0 },
    { name: "Grilled Chicken Salad", type: "dinner", cal: 480, protein: 42, carbs: 25, fats: 18, fav: 1 },
    { name: "Protein Shake", type: "snack", cal: 250, protein: 30, carbs: 15, fats: 5, fav: 1 },
    { name: "Mixed Nuts", type: "snack", cal: 200, protein: 6, carbs: 8, fats: 18, fav: 0 },
  ];

  for (let dayOffset = 21; dayOffset >= 0; dayOffset--) {
    const date = subDays(today, dayOffset);
    const dateStr = format(date, "yyyy-MM-dd");

    // Breakfast
    const breakfast = mealTemplates.filter(m => m.type === "breakfast");
    const b = breakfast[dayOffset % breakfast.length];
    db.insert(meals).values({
      userId: user.id, name: b.name, date: dateStr, mealType: b.type,
      calories: b.cal + Math.floor(Math.random() * 40) - 20,
      protein: b.protein + Math.floor(Math.random() * 5),
      carbs: b.carbs + Math.floor(Math.random() * 5),
      fats: b.fats + Math.floor(Math.random() * 3),
      isFavorite: b.fav,
    }).run();

    // Lunch
    const lunch = mealTemplates.filter(m => m.type === "lunch");
    const l = lunch[dayOffset % lunch.length];
    db.insert(meals).values({
      userId: user.id, name: l.name, date: dateStr, mealType: l.type,
      calories: l.cal + Math.floor(Math.random() * 40) - 20,
      protein: l.protein + Math.floor(Math.random() * 5),
      carbs: l.carbs + Math.floor(Math.random() * 5),
      fats: l.fats + Math.floor(Math.random() * 3),
      isFavorite: l.fav,
    }).run();

    // Dinner
    const dinner = mealTemplates.filter(m => m.type === "dinner");
    const d = dinner[dayOffset % dinner.length];
    db.insert(meals).values({
      userId: user.id, name: d.name, date: dateStr, mealType: d.type,
      calories: d.cal + Math.floor(Math.random() * 40) - 20,
      protein: d.protein + Math.floor(Math.random() * 5),
      carbs: d.carbs + Math.floor(Math.random() * 5),
      fats: d.fats + Math.floor(Math.random() * 3),
      isFavorite: d.fav,
    }).run();

    // Snack (some days)
    if (dayOffset % 2 === 0) {
      const snack = mealTemplates.filter(m => m.type === "snack");
      const s = snack[dayOffset % snack.length];
      db.insert(meals).values({
        userId: user.id, name: s.name, date: dateStr, mealType: s.type,
        calories: s.cal, protein: s.protein, carbs: s.carbs, fats: s.fats,
        isFavorite: s.fav,
      }).run();
    }
  }

  // Create 3 weeks of daily metrics
  for (let dayOffset = 21; dayOffset >= 0; dayOffset--) {
    const date = subDays(today, dayOffset);
    const dateStr = format(date, "yyyy-MM-dd");
    db.insert(dailyMetrics).values({
      userId: user.id,
      date: dateStr,
      bodyweight: 175 + Math.random() * 3 - 1.5,
      sleepHours: 5.5 + Math.random() * 2.5,
      steps: 6000 + Math.floor(Math.random() * 6000),
      energyLevel: 2 + Math.floor(Math.random() * 4),
      moodLevel: 2 + Math.floor(Math.random() * 4),
    }).run();
  }

  // Create habits
  const habitData = [
    { name: "Gym", icon: "dumbbell" },
    { name: "Walk 8k steps", icon: "footprints" },
    { name: "8hrs Sleep", icon: "moon" },
    { name: "Drink 3L Water", icon: "droplets" },
  ];

  for (const h of habitData) {
    const habit = db.insert(habits).values({ userId: user.id, name: h.name, icon: h.icon }).returning().get();
    // Create logs for past 21 days
    for (let dayOffset = 21; dayOffset >= 0; dayOffset--) {
      const date = subDays(today, dayOffset);
      const dateStr = format(date, "yyyy-MM-dd");
      const completed = Math.random() > 0.3 ? 1 : 0;
      db.insert(habitLogs).values({ habitId: habit.id, date: dateStr, completed }).run();
    }
  }
}
