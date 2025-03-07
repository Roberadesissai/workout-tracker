import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

interface NutritionProgress {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight: number;
}

interface WeightEntry {
  date: string;
  weight: number;
}

interface NutritionLog {
  date: string;
  servings: number;
  food: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

interface RawLogData {
  date: string;
  servings: string;
  food: Array<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
}

export default function NutritionCharts() {
  const [timeRange, setTimeRange] = useState("1m");
  const [nutritionData, setNutritionData] = useState<NutritionProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNutritionData();
  }, [timeRange]);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to view your progress");
        return;
      }

      // Get date range
      const endDate = new Date();
      const startDate = getStartDate(timeRange);

      // Fetch weight entries
      const { data: weightData, error: weightError } = await supabase
        .from("weight_progress")
        .select("date, weight")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true });

      if (weightError) throw weightError;

      // Fetch nutrition logs
      const { data: logsData, error: logsError } = await supabase
        .from("nutrition_logs")
        .select(
          `
          date,
          servings,
          food:food_database!inner (
            calories,
            protein,
            carbs,
            fats
          )
        `
        )
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());

      if (logsError) throw logsError;

      // Process and combine the data
      const processedLogs = (logsData || []).map((log: RawLogData) => ({
        date: log.date,
        food: log.food[0] || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        },
        servings: Number(log.servings),
      })) as NutritionLog[];

      const processedData = processNutritionData(
        weightData || [],
        processedLogs
      );
      setNutritionData(processedData);
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
      toast.error("Failed to load nutrition data");
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range: string) => {
    const today = new Date();
    switch (range) {
      case "1w":
        return subMonths(today, 0.25);
      case "1m":
        return subMonths(today, 1);
      case "3m":
        return subMonths(today, 3);
      case "6m":
        return subMonths(today, 6);
      case "1y":
        return subMonths(today, 12);
      default:
        return subMonths(today, 1);
    }
  };

  const processNutritionData = (
    weightEntries: WeightEntry[],
    nutritionLogs: NutritionLog[]
  ) => {
    const dateMap = new Map<string, NutritionProgress>();

    // Process weight entries
    weightEntries.forEach((entry) => {
      const date = format(new Date(entry.date), "yyyy-MM-dd");
      dateMap.set(date, {
        date,
        weight: entry.weight,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      });
    });

    // Process nutrition logs
    nutritionLogs.forEach((log) => {
      const date = format(new Date(log.date), "yyyy-MM-dd");
      const existing = dateMap.get(date) || {
        date,
        weight: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      };

      const multiplier = log.servings;
      existing.calories += log.food.calories * multiplier;
      existing.protein += log.food.protein * multiplier;
      existing.carbs += log.food.carbs * multiplier;
      existing.fats += log.food.fats * multiplier;

      dateMap.set(date, existing);
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const calculateMacroDistribution = () => {
    if (nutritionData.length === 0) return [];

    const latest = nutritionData[nutritionData.length - 1];
    return [
      {
        name: "Protein",
        value: latest.protein * 4,
        color: "hsl(var(--primary))",
      },
      {
        name: "Carbs",
        value: latest.carbs * 4,
        color: "hsl(var(--success))",
      },
      {
        name: "Fats",
        value: latest.fats * 9,
        color: "hsl(var(--warning))",
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Progress Tracking</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1w">1 Week</SelectItem>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weight Progress Chart */}
        <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle>Weight Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={nutritionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="weightGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `${value} lbs`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(date) =>
                      format(new Date(date), "MMM d, yyyy")
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                    fillOpacity={1}
                    fill="url(#weightGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Calorie Intake Chart */}
        <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle>Calorie Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={nutritionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="calorieGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `${value} kcal`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(date) =>
                      format(new Date(date), "MMM d, yyyy")
                    }
                  />
                  <Bar
                    dataKey="calories"
                    fill="url(#calorieGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Macronutrient Distribution */}
        <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle>Macronutrient Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {calculateMacroDistribution().map((entry, index) => (
                      <linearGradient
                        key={`gradient-${index}`}
                        id={`gradient-${entry.name}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.color}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="100%"
                          stopColor={entry.color}
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={calculateMacroDistribution()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {calculateMacroDistribution().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#gradient-${entry.name})`}
                        stroke={entry.color}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} kcal`, "Calories"]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--foreground))" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Macronutrient Trends */}
        <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle>Macronutrient Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={nutritionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="proteinGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                    <linearGradient
                      id="carbsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--success))"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--success))"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fatsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--warning))"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--warning))"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `${value}g`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(date) =>
                      format(new Date(date), "MMM d, yyyy")
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="protein"
                    name="Protein"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="carbs"
                    name="Carbs"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--success))" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fats"
                    name="Fats"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--warning))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
