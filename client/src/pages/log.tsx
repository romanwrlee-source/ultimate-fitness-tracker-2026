import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Trash2, ChevronDown, ChevronUp, Star, Dumbbell } from "lucide-react";
import type { Workout, Exercise, Meal, DailyMetrics } from "@shared/schema";

function WorkoutsTab() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: "", date: format(new Date(), "yyyy-MM-dd"), duration: "" });
  const [newSet, setNewSet] = useState({ exerciseId: "", weight: "", reps: "", rpe: "" });

  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: expandedWorkout } = useQuery<any>({
    queryKey: ["/api/workouts", expandedId],
    queryFn: async () => {
      if (!expandedId) return null;
      const res = await apiRequest("GET", `/api/workouts/${expandedId}`);
      return res.json();
    },
    enabled: !!expandedId,
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/workouts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setShowNewWorkout(false);
      setNewWorkout({ name: "", date: format(new Date(), "yyyy-MM-dd"), duration: "" });
      toast({ title: "Workout created" });
    },
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setExpandedId(null);
      toast({ title: "Workout deleted" });
    },
  });

  const addSetMutation = useMutation({
    mutationFn: async ({ workoutId, data }: { workoutId: number; data: any }) => {
      const res = await apiRequest("POST", `/api/workouts/${workoutId}/sets`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts", expandedId] });
      setNewSet({ exerciseId: "", weight: "", reps: "", rpe: "" });
      toast({ title: "Set added" });
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts", expandedId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Workouts</h2>
        <Dialog open={showNewWorkout} onOpenChange={setShowNewWorkout}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="new-workout-btn">
              <Plus className="h-3 w-3 mr-1" /> New Workout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Workout</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                  placeholder="e.g., Push Day A"
                  data-testid="workout-name-input"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newWorkout.date}
                  onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                  data-testid="workout-date-input"
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={newWorkout.duration}
                  onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                  placeholder="60"
                  data-testid="workout-duration-input"
                />
              </div>
              <Button
                onClick={() =>
                  createWorkoutMutation.mutate({
                    name: newWorkout.name,
                    date: newWorkout.date,
                    duration: newWorkout.duration ? Number(newWorkout.duration) : null,
                  })
                }
                disabled={!newWorkout.name || createWorkoutMutation.isPending}
                data-testid="save-workout-btn"
              >
                Create Workout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {workouts?.map((w) => (
            <Card key={w.id} data-testid={`workout-card-${w.id}`}>
              <CardContent className="p-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  data-testid={`workout-expand-${w.id}`}
                >
                  <div>
                    <p className="font-medium text-sm">{w.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(w.date), "MMM d, yyyy")}
                      {w.duration ? ` · ${w.duration} min` : ""}
                    </p>
                  </div>
                  {expandedId === w.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {expandedId === w.id && expandedWorkout && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    {expandedWorkout.sets?.map((s: any) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs bg-accent/30 rounded p-2"
                      >
                        <span>
                          {s.exerciseName || "Unknown"} — Set {s.setNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>
                            {s.weight}lbs × {s.reps}
                            {s.rpe ? ` @RPE ${s.rpe.toFixed(1)}` : ""}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => deleteSetMutation.mutate(s.id)}
                            data-testid={`delete-set-${s.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add set form */}
                    <div className="flex gap-2 items-end flex-wrap">
                      <div className="flex-1 min-w-[120px]">
                        <Label className="text-xs">Exercise</Label>
                        <Select
                          value={newSet.exerciseId}
                          onValueChange={(v) => setNewSet({ ...newSet, exerciseId: v })}
                        >
                          <SelectTrigger data-testid="set-exercise-select">
                            <SelectValue placeholder="Pick" />
                          </SelectTrigger>
                          <SelectContent>
                            {exercises?.map((e) => (
                              <SelectItem key={e.id} value={String(e.id)}>
                                {e.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">Weight</Label>
                        <Input
                          type="number"
                          value={newSet.weight}
                          onChange={(e) => setNewSet({ ...newSet, weight: e.target.value })}
                          data-testid="set-weight-input"
                        />
                      </div>
                      <div className="w-16">
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          value={newSet.reps}
                          onChange={(e) => setNewSet({ ...newSet, reps: e.target.value })}
                          data-testid="set-reps-input"
                        />
                      </div>
                      <div className="w-16">
                        <Label className="text-xs">RPE</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={newSet.rpe}
                          onChange={(e) => setNewSet({ ...newSet, rpe: e.target.value })}
                          data-testid="set-rpe-input"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const setsCount = expandedWorkout.sets?.length || 0;
                          addSetMutation.mutate({
                            workoutId: w.id,
                            data: {
                              exerciseId: Number(newSet.exerciseId),
                              setNumber: setsCount + 1,
                              weight: newSet.weight ? Number(newSet.weight) : null,
                              reps: newSet.reps ? Number(newSet.reps) : null,
                              rpe: newSet.rpe ? Number(newSet.rpe) : null,
                            },
                          });
                        }}
                        disabled={!newSet.exerciseId || addSetMutation.isPending}
                        data-testid="add-set-btn"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteWorkoutMutation.mutate(w.id)}
                        data-testid={`delete-workout-${w.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete Workout
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {(!workouts || workouts.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No workouts yet. Create your first one!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MealsTab() {
  const { toast } = useToast();
  const [showNewMeal, setShowNewMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    mealType: "lunch",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const { data: meals, isLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: favorites } = useQuery<Meal[]>({
    queryKey: ["/api/meals/favorites"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const createMealMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/meals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      setShowNewMeal(false);
      setNewMeal({ name: "", date: format(new Date(), "yyyy-MM-dd"), mealType: "lunch", calories: "", protein: "", carbs: "", fats: "" });
      toast({ title: "Meal logged" });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: number; isFavorite: number }) => {
      const res = await apiRequest("PUT", `/api/meals/${id}`, { isFavorite });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal deleted" });
    },
  });

  const quickAddFavorite = (fav: Meal) => {
    createMealMutation.mutate({
      name: fav.name,
      date: format(new Date(), "yyyy-MM-dd"),
      mealType: fav.mealType,
      calories: fav.calories,
      protein: fav.protein,
      carbs: fav.carbs,
      fats: fav.fats,
      isFavorite: 0,
    });
  };

  // Group meals by date
  const mealsByDate: Record<string, Meal[]> = {};
  meals?.forEach((m) => {
    if (!mealsByDate[m.date]) mealsByDate[m.date] = [];
    mealsByDate[m.date].push(m);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Meals</h2>
        <Dialog open={showNewMeal} onOpenChange={setShowNewMeal}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="new-meal-btn">
              <Plus className="h-3 w-3 mr-1" /> Log Meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Meal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={newMeal.name}
                  onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                  placeholder="e.g., Chicken & Rice"
                  data-testid="meal-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newMeal.date}
                    onChange={(e) => setNewMeal({ ...newMeal, date: e.target.value })}
                    data-testid="meal-date-input"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newMeal.mealType}
                    onValueChange={(v) => setNewMeal({ ...newMeal, mealType: v })}
                  >
                    <SelectTrigger data-testid="meal-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                    data-testid="meal-calories-input"
                  />
                </div>
                <div>
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={newMeal.protein}
                    onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
                    data-testid="meal-protein-input"
                  />
                </div>
                <div>
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={newMeal.carbs}
                    onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
                    data-testid="meal-carbs-input"
                  />
                </div>
                <div>
                  <Label>Fats (g)</Label>
                  <Input
                    type="number"
                    value={newMeal.fats}
                    onChange={(e) => setNewMeal({ ...newMeal, fats: e.target.value })}
                    data-testid="meal-fats-input"
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  createMealMutation.mutate({
                    name: newMeal.name,
                    date: newMeal.date,
                    mealType: newMeal.mealType,
                    calories: newMeal.calories ? Number(newMeal.calories) : null,
                    protein: newMeal.protein ? Number(newMeal.protein) : null,
                    carbs: newMeal.carbs ? Number(newMeal.carbs) : null,
                    fats: newMeal.fats ? Number(newMeal.fats) : null,
                  })
                }
                disabled={!newMeal.name || createMealMutation.isPending}
                data-testid="save-meal-btn"
              >
                Log Meal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Favorites quick-add */}
      {favorites && favorites.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Quick add from favorites:</p>
          <div className="flex gap-2 flex-wrap">
            {[...new Map(favorites.map((f) => [f.name, f])).values()].slice(0, 6).map((fav) => (
              <Button
                key={fav.id}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => quickAddFavorite(fav)}
                data-testid={`fav-meal-${fav.id}`}
              >
                <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                {fav.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        Object.entries(mealsByDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 14)
          .map(([date, dayMeals]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {format(new Date(date), "MMM d, yyyy")}
              </p>
              <div className="space-y-1">
                {dayMeals.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm"
                    data-testid={`meal-row-${m.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          toggleFavoriteMutation.mutate({
                            id: m.id,
                            isFavorite: m.isFavorite === 1 ? 0 : 1,
                          })
                        }
                        data-testid={`toggle-fav-${m.id}`}
                      >
                        <Star
                          className={`h-3 w-3 ${m.isFavorite === 1 ? "fill-current text-yellow-500" : "text-muted-foreground"}`}
                        />
                      </Button>
                      <div>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground ml-2 capitalize text-xs">
                          {m.mealType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{m.calories} cal</span>
                      <span>{m.protein}g P</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => deleteMealMutation.mutate(m.id)}
                        data-testid={`delete-meal-${m.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}

function MetricsTab() {
  const { toast } = useToast();
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState({
    bodyweight: "",
    sleepHours: "",
    steps: "",
    energyLevel: "",
    moodLevel: "",
    notes: "",
  });

  const { data: metrics, isLoading } = useQuery<DailyMetrics[]>({
    queryKey: ["/api/metrics"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/metrics", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Metrics saved" });
    },
  });

  // Load existing data for selected date
  const { data: existingMetric } = useQuery<DailyMetrics | null>({
    queryKey: ["/api/metrics", formDate],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/metrics/${formDate}`);
        return res.json();
      } catch {
        return null;
      }
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Daily Metrics</h2>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Log Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              data-testid="metrics-date-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bodyweight (lbs)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.bodyweight}
                onChange={(e) => setForm({ ...form, bodyweight: e.target.value })}
                placeholder={existingMetric?.bodyweight?.toString() || ""}
                data-testid="metrics-weight-input"
              />
            </div>
            <div>
              <Label>Sleep (hours)</Label>
              <Input
                type="number"
                step="0.5"
                value={form.sleepHours}
                onChange={(e) => setForm({ ...form, sleepHours: e.target.value })}
                placeholder={existingMetric?.sleepHours?.toString() || ""}
                data-testid="metrics-sleep-input"
              />
            </div>
            <div>
              <Label>Steps</Label>
              <Input
                type="number"
                value={form.steps}
                onChange={(e) => setForm({ ...form, steps: e.target.value })}
                placeholder={existingMetric?.steps?.toString() || ""}
                data-testid="metrics-steps-input"
              />
            </div>
            <div>
              <Label>Energy (1-5)</Label>
              <Select
                value={form.energyLevel}
                onValueChange={(v) => setForm({ ...form, energyLevel: v })}
              >
                <SelectTrigger data-testid="metrics-energy-select">
                  <SelectValue placeholder={existingMetric?.energyLevel?.toString() || "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mood (1-5)</Label>
              <Select
                value={form.moodLevel}
                onValueChange={(v) => setForm({ ...form, moodLevel: v })}
              >
                <SelectTrigger data-testid="metrics-mood-select">
                  <SelectValue placeholder={existingMetric?.moodLevel?.toString() || "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() =>
              saveMutation.mutate({
                date: formDate,
                bodyweight: form.bodyweight ? Number(form.bodyweight) : existingMetric?.bodyweight,
                sleepHours: form.sleepHours ? Number(form.sleepHours) : existingMetric?.sleepHours,
                steps: form.steps ? Number(form.steps) : existingMetric?.steps,
                energyLevel: form.energyLevel ? Number(form.energyLevel) : existingMetric?.energyLevel,
                moodLevel: form.moodLevel ? Number(form.moodLevel) : existingMetric?.moodLevel,
                notes: form.notes || existingMetric?.notes,
              })
            }
            disabled={saveMutation.isPending}
            data-testid="save-metrics-btn"
          >
            Save Metrics
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Recent Entries</p>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="space-y-1">
            {metrics
              ?.sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 14)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded bg-accent/30 text-xs"
                  data-testid={`metric-row-${m.id}`}
                >
                  <span className="font-medium">{format(new Date(m.date), "MMM d")}</span>
                  <div className="flex gap-3 text-muted-foreground">
                    {m.bodyweight && <span>{m.bodyweight.toFixed(1)} lbs</span>}
                    {m.sleepHours && <span>{m.sleepHours}h sleep</span>}
                    {m.steps && <span>{m.steps.toLocaleString()} steps</span>}
                    {m.energyLevel && <span>E:{m.energyLevel}</span>}
                    {m.moodLevel && <span>M:{m.moodLevel}</span>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <div data-testid="log-page">
      <h1 className="text-xl font-bold mb-4">Log</h1>
      <Tabs defaultValue="workouts">
        <TabsList className="mb-4" data-testid="log-tabs">
          <TabsTrigger value="workouts" data-testid="tab-workouts">
            Workouts
          </TabsTrigger>
          <TabsTrigger value="meals" data-testid="tab-meals">
            Meals
          </TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-metrics">
            Metrics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="workouts">
          <WorkoutsTab />
        </TabsContent>
        <TabsContent value="meals">
          <MealsTab />
        </TabsContent>
        <TabsContent value="metrics">
          <MetricsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
