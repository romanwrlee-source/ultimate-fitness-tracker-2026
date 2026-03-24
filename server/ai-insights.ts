export interface Insight {
  category: "training" | "nutrition" | "recovery";
  text: string;
}

export interface InsightsResponse {
  summary: string;
  suggestions: Insight[];
  adherenceScores: {
    training7d: number;
    training30d: number;
    nutrition7d: number;
    nutrition30d: number;
  };
}

export async function getInsights(userId: number): Promise<InsightsResponse> {
  // Stub implementation — replace with an LLM API call to personalize insights
  return {
    summary:
      "Over the past 4 weeks, you've maintained 85% training adherence with consistent progressive overload on compound lifts. Nutrition has been slightly below protein targets. Sleep could use improvement for better recovery.",
    suggestions: [
      {
        category: "training",
        text: "Consider adding a deload week — you've been pushing hard for 3 consecutive weeks. Drop volume by 40% to allow adaptation.",
      },
      {
        category: "nutrition",
        text: "Your protein intake has been 10% below your 150g target on average. Try adding a protein shake post-workout or Greek yogurt as a snack.",
      },
      {
        category: "recovery",
        text: "Sleep has averaged 6.2 hours over the last week. Aim for 7-8 hours to optimize muscle recovery and performance.",
      },
    ],
    adherenceScores: {
      training7d: 0.86,
      training30d: 0.85,
      nutrition7d: 0.78,
      nutrition30d: 0.82,
    },
  };
}
