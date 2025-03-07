"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, subDays } from "date-fns";
import { Scale, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WeightLog {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">
          {format(new Date(label), "MMM d, yyyy")}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(1)} lbs
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function NutritionProgress() {
  const [weightData, setWeightData] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchWeightData();
  }, []);

  async function fetchWeightData() {
    try {
      const { data, error } = await supabase
        .from("weight_progress")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;

      setWeightData(
        data?.map((log) => ({
          ...log,
          date: format(new Date(log.date), "yyyy-MM-dd"),
        })) || []
      );
    } catch (error) {
      console.error("Error fetching weight data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addWeightEntry() {
    if (!newWeight) return;

    try {
      const { error } = await supabase.from("weight_progress").insert([
        {
          date: new Date().toISOString(),
          weight: parseFloat(newWeight),
          notes: newNotes || null,
        },
      ]);

      if (error) throw error;

      setNewWeight("");
      setNewNotes("");
      setIsDialogOpen(false);
      fetchWeightData();
    } catch (error) {
      console.error("Error adding weight entry:", error);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Weight Progress</CardTitle>
          <CardDescription>
            Please wait while we fetch your data...
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-4 w-36 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentWeightData = weightData.slice(-30); // Show last 30 days
  const hasData = recentWeightData.length > 0;
  const latestWeight = hasData
    ? recentWeightData[recentWeightData.length - 1].weight
    : 0;
  const startWeight = hasData ? recentWeightData[0].weight : 0;
  const weightChange = hasData ? latestWeight - startWeight : 0;
  const weightChangeColor =
    weightChange > 0
      ? "text-red-500"
      : weightChange < 0
      ? "text-green-500"
      : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weight Progress</h2>
          <p className="text-muted-foreground">
            Track and monitor your weight changes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Weight
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Weight Entry</DialogTitle>
              <DialogDescription>
                Record your weight for today
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight (lbs)</label>
                <Input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Enter weight"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add any notes"
                />
              </div>
              <Button onClick={addWeightEntry} className="w-full">
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {hasData ? (
        <div className="grid gap-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Latest Weight</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{latestWeight.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">lbs</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Starting Weight</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{startWeight.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">lbs</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Total Change</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className={cn("text-2xl font-bold", weightChangeColor)}>
                  {weightChange > 0 ? "+" : ""}
                  {weightChange.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">lbs</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Entries</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{recentWeightData.length}</p>
                <p className="text-sm text-muted-foreground">records</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <CardDescription>Last 30 days of weight tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentWeightData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {recentWeightData
              .slice()
              .reverse()
              .map((entry) => (
                <Card key={entry.id} className="bg-muted/5">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {format(new Date(entry.date), "MMMM d, yyyy")}
                        </CardTitle>
                        {entry.notes && (
                          <CardDescription>{entry.notes}</CardDescription>
                        )}
                      </div>
                      <p className="text-xl font-bold">
                        {entry.weight.toFixed(1)} lbs
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </div>
      ) : (
        <Card className="bg-muted/5">
          <CardHeader>
            <CardTitle>No Weight Data</CardTitle>
            <CardDescription>
              Start tracking your weight progress by adding your first entry
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Scale className="h-16 w-16 text-muted-foreground" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
