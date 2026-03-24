import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dumbbell,
  Flame,
  Target,
  Scale,
  Repeat,
  Plus,
  Utensils,
} from "lucide-react";
import type { Workout, Meal, DailyMetrics, Habit, HabitLog } from "@shared/schema";

export default function TodayPage() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: todayWorkouts, isLoading: loadingWorkouts } = useQuery<Workout[]>({
    queryKey: ["/api/workouts", `?date=${today}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/workouts?date=${today}`);
      return res.json();
    },
  });

  const { data: allWorkouts } = useQuery<Workout[]>({
    queryKey: ["/api/workouts", "?limit=5"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/workouts?limit=5");
      return res.json();
    },
  });

  const { data: todayMeals, isLoading: loadingMeals } = useQuery<Meal[]>({
    queryKey: ["/api/meals", `?date=${today}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/meals?date=${today}`);
      return res.json();
    },
  });

  const { data: todayMetrics } = useQuery<DailyMetrics | null>({
    queryKey: ["/api/metrics", today],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/metrics/${today}`);
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const { data: habits } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: habitLogs } = useQuery<HabitLog[]>({
    queryKey: ["/api/habits/logs", `?startDate=${today}&endDate=${today}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/habits/logs?startDate=${today}&endDate=${today}`);
      return res.json();
    },
  });

  const { data: overview } = useQuery<any>({
    queryKey: ["/api/analytics/overview"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const repeatMutation = useMutation({
    mutationFn: async (workoutId: number) => {
      const res = await apiRequest("POST", `/api/workouts/${workoutId}/repeat`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Workout repeated!" });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest("POST", `/api/habits/${habitId}/log`, { date: today });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits/logs"] });
    },
  });

  const todayCalories = todayMeals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0;
  const todayProtein = todayMeals?.reduce((sum, m) => sum + (m.protein || 0), 0) || 0;
  const calorieTarget = settings?.dailyCalorieTarget || 2500;
  const proteinTarget = settings?.dailyProteinTarget || 150;
  const workoutTarget = settings?.weeklyWorkoutTarget || 5;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const isHabitDone = (habitId: number) => {
    return habitLogs?.some((l) => l.habitId === habitId && l.completed === 1) ?? false;
  };

  const lastWorkout = allWorkouts?.find((w) => w.date !== today);

  return (
    <div className="space-y-6" data-testid="today-page">
      <div>
        <h1 className="text-xl font-bold" data-testid="greeting">
          {getGreeting()}
        </h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Weight</span>
            </div>
            <p className="text-lg font-semibold" data-testid="stat-weight">
              {todayMetrics?.bodyweight
                ? `${todayMetrics.bodyweight.toFixed(1)} lbs`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Calories</span>
            </div>
            <p className="text-lg font-semibold" data-testid="stat-calories">
              {todayCalories} / {calorieTarget}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Protein</span>
            </div>
            <p className="text-lg font-semibold" data-testid="stat-protein">
              {Math.round(todayProtein)}g / {proteinTarget}g
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Workouts</span>
            </div>
            <p className="text-lg font-semibold" data-testid="stat-workouts">
              {overview?.weeklyWorkouts ?? 0} / {workoutTarget}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Today's Workout
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWorkouts ? (
            <Skeleton className="h-16 w-full" />
          ) : todayWorkouts && todayWorkouts.length > 0 ? (
            <div className="space-y-2">
              {todayWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                  data-testid={`workout-${w.id}`}
                >
                  <div>
                    <p className="font-medium text-sm">{w.name}</p>
                    {w.duration && (
                      <p className="text-xs text-muted-foreground">{w.duration} min</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No workout logged today</p>
              {lastWorkout && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => repeatMutation.mutate(lastWorkout.id)}
                  disabled={repeatMutation.isPending}
                  data-testid="quick-log-btn"
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  Quick Log: {lastWorkout.name}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Meals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Today's Meals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMeals ? (
            <Skeleton className="h-16 w-full" />
          ) : todayMeals && todayMeals.length > 0 ? (
            <div className="space-y-2">
              {todayMeals.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded bg-accent/30"
                  data-testid={`meal-${m.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.mealType}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{m.calories} cal</p>
                    <p>{m.protein}g protein</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No meals logged today
            </p>
          )}
        </CardContent>
      </Card>

      {/* Habits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today's Habits</CardTitle>
        </CardHeader>
        <CardContent>
          {habits && habits.length > 0 ? (
            <div className="space-y-3">
              {habits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3"
                  data-testid={`habit-${h.id}`}
                >
                  <Checkbox
                    checked={isHabitDone(h.id)}
                    onCheckedChange={() => toggleHabitMutation.mutate(h.id)}
                    data-testid={`habit-check-${h.id}`}
                  />
                  <span
                    className={`text-sm ${
                      isHabitDone(h.id) ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {h.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No habits set up yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
