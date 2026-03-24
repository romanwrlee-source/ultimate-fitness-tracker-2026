import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  duration: integer("duration"),
  createdAt: text("created_at").notNull(),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutId: integer("workout_id").references(() => workouts.id),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  rpe: real("rpe"),
  notes: text("notes"),
});

export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  date: text("date").notNull(),
  mealType: text("meal_type"),
  calories: integer("calories"),
  protein: real("protein"),
  carbs: real("carbs"),
  fats: real("fats"),
  isFavorite: integer("is_favorite").default(0),
});

export const dailyMetrics = sqliteTable("daily_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  date: text("date").notNull(),
  bodyweight: real("bodyweight"),
  sleepHours: real("sleep_hours"),
  steps: integer("steps"),
  energyLevel: integer("energy_level"),
  moodLevel: integer("mood_level"),
  notes: text("notes"),
});

export const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  icon: text("icon"),
});

export const habitLogs = sqliteTable("habit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitId: integer("habit_id").references(() => habits.id),
  date: text("date").notNull(),
  completed: integer("completed").default(0),
});

export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  dailyCalorieTarget: integer("daily_calorie_target").default(2500),
  dailyProteinTarget: integer("daily_protein_target").default(150),
  weeklyWorkoutTarget: integer("weekly_workout_target").default(5),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  name: true,
  muscleGroup: true,
  userId: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).pick({
  userId: true,
  name: true,
  date: true,
  notes: true,
  duration: true,
});

export const insertWorkoutSetSchema = createInsertSchema(workoutSets).pick({
  workoutId: true,
  exerciseId: true,
  setNumber: true,
  weight: true,
  reps: true,
  rpe: true,
  notes: true,
});

export const insertMealSchema = createInsertSchema(meals).pick({
  userId: true,
  name: true,
  date: true,
  mealType: true,
  calories: true,
  protein: true,
  carbs: true,
  fats: true,
  isFavorite: true,
});

export const insertDailyMetricsSchema = createInsertSchema(dailyMetrics).pick({
  userId: true,
  date: true,
  bodyweight: true,
  sleepHours: true,
  steps: true,
  energyLevel: true,
  moodLevel: true,
  notes: true,
});

export const insertHabitSchema = createInsertSchema(habits).pick({
  userId: true,
  name: true,
  icon: true,
});

export const insertHabitLogSchema = createInsertSchema(habitLogs).pick({
  habitId: true,
  date: true,
  completed: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  dailyCalorieTarget: true,
  dailyProteinTarget: true,
  weeklyWorkoutTarget: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertDailyMetrics = z.infer<typeof insertDailyMetricsSchema>;
export type DailyMetrics = typeof dailyMetrics.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;
export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
