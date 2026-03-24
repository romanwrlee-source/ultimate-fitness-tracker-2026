import { describe, it, expect } from "vitest";
import {
  insertUserSchema,
  insertExerciseSchema,
  insertWorkoutSchema,
  insertWorkoutSetSchema,
  insertMealSchema,
  insertDailyMetricsSchema,
  insertHabitSchema,
  insertHabitLogSchema,
  insertUserSettingsSchema,
} from "../shared/schema";

describe("Schema Validation", () => {
  describe("insertUserSchema", () => {
    it("accepts valid user data", () => {
      const result = insertUserSchema.safeParse({ username: "test", password: "pass123" });
      expect(result.success).toBe(true);
    });

    it("rejects missing username", () => {
      const result = insertUserSchema.safeParse({ password: "pass123" });
      expect(result.success).toBe(false);
    });

    it("rejects missing password", () => {
      const result = insertUserSchema.safeParse({ username: "test" });
      expect(result.success).toBe(false);
    });
  });

  describe("insertExerciseSchema", () => {
    it("accepts valid exercise data", () => {
      const result = insertExerciseSchema.safeParse({
        name: "Bench Press",
        muscleGroup: "chest",
        userId: 1,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const result = insertExerciseSchema.safeParse({
        muscleGroup: "chest",
        userId: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("insertWorkoutSchema", () => {
    it("accepts valid workout data", () => {
      const result = insertWorkoutSchema.safeParse({
        userId: 1,
        name: "Push Day",
        date: "2026-03-20",
      });
      expect(result.success).toBe(true);
    });

    it("accepts workout with optional fields", () => {
      const result = insertWorkoutSchema.safeParse({
        userId: 1,
        name: "Pull Day",
        date: "2026-03-20",
        notes: "Felt strong",
        duration: 60,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("insertWorkoutSetSchema", () => {
    it("accepts valid set data", () => {
      const result = insertWorkoutSetSchema.safeParse({
        workoutId: 1,
        exerciseId: 1,
        setNumber: 1,
        weight: 135,
        reps: 10,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing setNumber", () => {
      const result = insertWorkoutSetSchema.safeParse({
        workoutId: 1,
        exerciseId: 1,
        weight: 135,
        reps: 10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("insertMealSchema", () => {
    it("accepts valid meal data", () => {
      const result = insertMealSchema.safeParse({
        userId: 1,
        name: "Chicken & Rice",
        date: "2026-03-20",
        mealType: "lunch",
        calories: 650,
        protein: 45,
        carbs: 70,
        fats: 15,
      });
      expect(result.success).toBe(true);
    });

    it("accepts minimal meal data", () => {
      const result = insertMealSchema.safeParse({
        userId: 1,
        name: "Quick Snack",
        date: "2026-03-20",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("insertDailyMetricsSchema", () => {
    it("accepts valid metrics data", () => {
      const result = insertDailyMetricsSchema.safeParse({
        userId: 1,
        date: "2026-03-20",
        bodyweight: 175.5,
        sleepHours: 7.5,
        steps: 10000,
        energyLevel: 4,
        moodLevel: 4,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("insertHabitSchema", () => {
    it("accepts valid habit data", () => {
      const result = insertHabitSchema.safeParse({
        userId: 1,
        name: "Drink Water",
        icon: "droplets",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("insertHabitLogSchema", () => {
    it("accepts valid habit log data", () => {
      const result = insertHabitLogSchema.safeParse({
        habitId: 1,
        date: "2026-03-20",
        completed: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("insertUserSettingsSchema", () => {
    it("accepts valid settings data", () => {
      const result = insertUserSettingsSchema.safeParse({
        userId: 1,
        dailyCalorieTarget: 2500,
        dailyProteinTarget: 150,
        weeklyWorkoutTarget: 5,
      });
      expect(result.success).toBe(true);
    });
  });
});
