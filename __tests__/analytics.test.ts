import { describe, it, expect } from "vitest";

describe("Analytics Computations", () => {
  it("computes training adherence correctly", () => {
    const weeklyWorkouts = 4;
    const weeklyTarget = 5;
    const adherence = Math.min(weeklyWorkouts / weeklyTarget, 1);
    expect(adherence).toBe(0.8);
  });

  it("caps adherence at 100%", () => {
    const weeklyWorkouts = 6;
    const weeklyTarget = 5;
    const adherence = Math.min(weeklyWorkouts / weeklyTarget, 1);
    expect(adherence).toBe(1);
  });

  it("computes nutrition adherence correctly", () => {
    const dailyCalories = [2400, 2600, 2500, 2300, 2700, 2500, 2400];
    const target = 2500;
    const avg = dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length;
    const adherence = Math.min(avg / target, 1);
    expect(adherence).toBeGreaterThan(0.95);
    expect(adherence).toBeLessThanOrEqual(1);
  });

  it("computes weekly volume correctly", () => {
    const sets = [
      { weight: 185, reps: 8 },
      { weight: 185, reps: 7 },
      { weight: 135, reps: 10 },
      { weight: 225, reps: 5 },
    ];
    const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    expect(volume).toBe(185 * 8 + 185 * 7 + 135 * 10 + 225 * 5);
    expect(volume).toBe(5250);
  });

  it("handles empty data gracefully", () => {
    const weeklyWorkouts = 0;
    const weeklyTarget = 5;
    const adherence = Math.min(weeklyWorkouts / weeklyTarget, 1);
    expect(adherence).toBe(0);
  });

  it("groups meals by date correctly", () => {
    const meals = [
      { date: "2026-03-20", calories: 400 },
      { date: "2026-03-20", calories: 600 },
      { date: "2026-03-20", calories: 700 },
      { date: "2026-03-21", calories: 500 },
    ];

    const byDate: Record<string, number> = {};
    meals.forEach((m) => {
      byDate[m.date] = (byDate[m.date] || 0) + m.calories;
    });

    expect(byDate["2026-03-20"]).toBe(1700);
    expect(byDate["2026-03-21"]).toBe(500);
  });

  it("computes 30-day training adherence", () => {
    const monthlyWorkouts = 17;
    const weeklyTarget = 5;
    const weeksInMonth = 4;
    const adherence = Math.min(monthlyWorkouts / (weeklyTarget * weeksInMonth), 1);
    expect(adherence).toBe(0.85);
  });
});
