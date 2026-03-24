import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function TrendsPage() {
  const { data: trends, isLoading: loadingTrends } = useQuery<any>({
    queryKey: ["/api/analytics/trends"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: insights } = useQuery<any>({
    queryKey: ["/api/insights"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const formatDateLabel = (d: string) => {
    try {
      return format(new Date(d), "M/d");
    } catch {
      return d;
    }
  };

  if (loadingTrends) {
    return (
      <div className="space-y-4" data-testid="trends-page">
        <h1 className="text-xl font-bold">Trends</h1>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="trends-page">
      <h1 className="text-xl font-bold">Trends</h1>

      {/* Weight Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Weight Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.weight?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends.weight}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} className="text-xs" />
                <YAxis domain={["auto", "auto"]} className="text-xs" />
                <Tooltip
                  labelFormatter={formatDateLabel}
                  formatter={(v: any) => [`${Number(v).toFixed(1)} lbs`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No weight data yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Volume by Muscle Group */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Weekly Volume by Muscle Group</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.volumeByMuscle?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends.volumeByMuscle}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="group" className="text-xs capitalize" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} lbs`, "Volume"]} />
                <Bar dataKey="volume" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No volume data yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Calorie Adherence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Calorie Adherence vs Target (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.calories?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends.calories}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  labelFormatter={formatDateLabel}
                  formatter={(v: any, name: string) => [
                    `${Number(v).toLocaleString()} cal`,
                    name === "value" ? "Actual" : "Target",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.1}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No calorie data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Protein Adherence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Protein Adherence vs Target (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.protein?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends.protein}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  labelFormatter={formatDateLabel}
                  formatter={(v: any, name: string) => [
                    `${Number(v).toFixed(0)}g`,
                    name === "value" ? "Actual" : "Target",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--chart-4))"
                  fill="hsl(var(--chart-4))"
                  fillOpacity={0.1}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No protein data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Sleep Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sleep Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.sleep?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trends.sleep}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} className="text-xs" />
                <YAxis domain={[0, 10]} className="text-xs" />
                <Tooltip
                  labelFormatter={formatDateLabel}
                  formatter={(v: any) => [`${Number(v).toFixed(1)} hrs`, "Sleep"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No sleep data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Steps Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Steps Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.steps?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trends.steps}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  labelFormatter={formatDateLabel}
                  formatter={(v: any) => [`${Number(v).toLocaleString()}`, "Steps"]}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No steps data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {insights && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{insights.summary}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="text-center p-2 rounded bg-accent/30">
                <p className="text-xs text-muted-foreground">Training 7d</p>
                <p className="text-lg font-bold" data-testid="adherence-train-7d">
                  {Math.round(insights.adherenceScores.training7d * 100)}%
                </p>
              </div>
              <div className="text-center p-2 rounded bg-accent/30">
                <p className="text-xs text-muted-foreground">Training 30d</p>
                <p className="text-lg font-bold" data-testid="adherence-train-30d">
                  {Math.round(insights.adherenceScores.training30d * 100)}%
                </p>
              </div>
              <div className="text-center p-2 rounded bg-accent/30">
                <p className="text-xs text-muted-foreground">Nutrition 7d</p>
                <p className="text-lg font-bold" data-testid="adherence-nutr-7d">
                  {Math.round(insights.adherenceScores.nutrition7d * 100)}%
                </p>
              </div>
              <div className="text-center p-2 rounded bg-accent/30">
                <p className="text-xs text-muted-foreground">Nutrition 30d</p>
                <p className="text-lg font-bold" data-testid="adherence-nutr-30d">
                  {Math.round(insights.adherenceScores.nutrition30d * 100)}%
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {insights.suggestions.map((s: any, i: number) => (
                <div key={i} className="flex gap-2 p-2 rounded bg-accent/20">
                  <Badge variant="outline" className="text-xs capitalize h-5 shrink-0">
                    {s.category}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
