import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Scale, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  notes: string;
}

export default function WeightTracker() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    weight: "",
    notes: "",
  });

  const fetchWeightEntries = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("weight_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      setWeightEntries(data || []);
    } catch (error) {
      console.error("Error fetching weight entries:", error);
      toast.error("Failed to load weight entries");
    } finally {
      setLoading(false);
    }
  };

  const addWeightEntry = async () => {
    try {
      if (!newEntry.weight) {
        toast.error("Please enter a weight value");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to track weight");
        return;
      }

      const { error } = await supabase.from("weight_progress").insert({
        user_id: user.id,
        date: newEntry.date,
        weight: Number(newEntry.weight),
        notes: newEntry.notes,
      });

      if (error) throw error;

      toast.success("Weight entry added successfully");
      setNewEntry({
        date: format(new Date(), "yyyy-MM-dd"),
        weight: "",
        notes: "",
      });
      fetchWeightEntries();
    } catch (error) {
      console.error("Error adding weight entry:", error);
      toast.error("Failed to add weight entry");
    }
  };

  const calculateProgress = () => {
    if (weightEntries.length < 2) return null;

    const sortedEntries = [...weightEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const weightChange = lastEntry.weight - firstEntry.weight;
    const daysDiff = Math.round(
      (new Date(lastEntry.date).getTime() -
        new Date(firstEntry.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const weeklyChange = (weightChange / daysDiff) * 7;

    return {
      totalChange: weightChange.toFixed(1),
      weeklyChange: weeklyChange.toFixed(1),
      isGain: weightChange > 0,
    };
  };

  useEffect(() => {
    fetchWeightEntries();
  }, []);

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Tracker
          </CardTitle>
          <CardDescription>Track your weight changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.date}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter weight in pounds"
                  value={newEntry.weight}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add any notes..."
                  value={newEntry.notes}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="bg-muted/50"
                />
              </div>
            </div>

            <Button
              onClick={addWeightEntry}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              Add Weight Entry
            </Button>

            {progress && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Change</p>
                        <p className="text-2xl font-bold">
                          {progress.totalChange} lbs
                        </p>
                      </div>
                      {progress.isGain ? (
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Weekly Change</p>
                        <p className="text-2xl font-bold">
                          {progress.weeklyChange} lbs/week
                        </p>
                      </div>
                      <Scale className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {weightEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Weight Progress Chart</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weightEntries}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) =>
                          format(new Date(date), "MMM d")
                        }
                      />
                      <YAxis
                        domain={["dataMin - 5", "dataMax + 5"]}
                        tickFormatter={(value) => `${value} lbs`}
                      />
                      <Tooltip
                        labelFormatter={(date) =>
                          format(new Date(date), "MMM d, yyyy")
                        }
                        formatter={(value: number) => [
                          `${value} lbs`,
                          "Weight",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
