import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings2 } from "lucide-react";
import type { UserSettings, Exercise, Habit } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading: loadingSettings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: exercises, isLoading: loadingExercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: habits, isLoading: loadingHabits } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [workoutTarget, setWorkoutTarget] = useState("");

  const [newExercise, setNewExercise] = useState({ name: "", muscleGroup: "chest" });
  const [newHabit, setNewHabit] = useState({ name: "", icon: "check" });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/exercises", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setNewExercise({ name: "", muscleGroup: "chest" });
      toast({ title: "Exercise added" });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Exercise deleted" });
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/habits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setNewHabit({ name: "", icon: "check" });
      toast({ title: "Habit added" });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({ title: "Habit deleted" });
    },
  });

  const muscleGroups = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"];

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Settings2 className="h-5 w-5" />
        Settings
      </h1>

      {/* Targets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Daily & Weekly Targets</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSettings ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Daily Calories</Label>
                  <Input
                    type="number"
                    value={calorieTarget}
                    onChange={(e) => setCalorieTarget(e.target.value)}
                    placeholder={settings?.dailyCalorieTarget?.toString() || "2500"}
                    data-testid="settings-calories-input"
                  />
                </div>
                <div>
                  <Label className="text-xs">Daily Protein (g)</Label>
                  <Input
                    type="number"
                    value={proteinTarget}
                    onChange={(e) => setProteinTarget(e.target.value)}
                    placeholder={settings?.dailyProteinTarget?.toString() || "150"}
                    data-testid="settings-protein-input"
                  />
                </div>
                <div>
                  <Label className="text-xs">Weekly Workouts</Label>
                  <Input
                    type="number"
                    value={workoutTarget}
                    onChange={(e) => setWorkoutTarget(e.target.value)}
                    placeholder={settings?.weeklyWorkoutTarget?.toString() || "5"}
                    data-testid="settings-workouts-input"
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  updateSettingsMutation.mutate({
                    dailyCalorieTarget: calorieTarget ? Number(calorieTarget) : settings?.dailyCalorieTarget,
                    dailyProteinTarget: proteinTarget ? Number(proteinTarget) : settings?.dailyProteinTarget,
                    weeklyWorkoutTarget: workoutTarget ? Number(workoutTarget) : settings?.weeklyWorkoutTarget,
                  })
                }
                disabled={updateSettingsMutation.isPending}
                data-testid="save-settings-btn"
              >
                Save Targets
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise Library */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Exercise Library</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExercises ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    placeholder="Exercise name"
                    data-testid="new-exercise-name"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">Muscle Group</Label>
                  <Select
                    value={newExercise.muscleGroup}
                    onValueChange={(v) => setNewExercise({ ...newExercise, muscleGroup: v })}
                  >
                    <SelectTrigger data-testid="new-exercise-group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={() => createExerciseMutation.mutate(newExercise)}
                  disabled={!newExercise.name || createExerciseMutation.isPending}
                  data-testid="add-exercise-btn"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {exercises?.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm"
                    data-testid={`exercise-${e.id}`}
                  >
                    <div>
                      <span className="font-medium">{e.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">
                        {e.muscleGroup}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteExerciseMutation.mutate(e.id)}
                      data-testid={`delete-exercise-${e.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Habits</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHabits ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="e.g., Drink 3L Water"
                    data-testid="new-habit-name"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => createHabitMutation.mutate(newHabit)}
                  disabled={!newHabit.name || createHabitMutation.isPending}
                  data-testid="add-habit-btn"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-1">
                {habits?.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm"
                    data-testid={`habit-setting-${h.id}`}
                  >
                    <span className="font-medium">{h.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteHabitMutation.mutate(h.id)}
                      data-testid={`delete-habit-${h.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
