"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";
import { format } from "date-fns";

interface ProgressChartProps {
  exerciseId: string;
}

interface ExerciseLog {
  id: string;
  date: string;
  set_number: number;
  weight: number;
  reps: number;
  notes: string;
}

export function ProgressChart({ exerciseId }: ProgressChartProps) {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [exerciseId]);

  const fetchLogs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("workout_exercise_id", exerciseId)
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (!error && data) {
        setLogs(data);
      }
    }

    setLoading(false);
  };

  const getMaxWeight = () => {
    return Math.max(...logs.map((log) => log.weight));
  };

  const getAverageWeight = () => {
    const weights = logs.map((log) => log.weight);
    return weights.reduce((a, b) => a + b, 0) / weights.length;
  };

  const getTotalVolume = () => {
    return logs.reduce((total, log) => total + log.weight * log.reps, 0);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Loading Progress...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>No Progress Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start logging your sets to track progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader>
        <CardTitle>Progress Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-primary/5">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Max Weight
            </div>
            <div className="text-2xl font-bold">{getMaxWeight()} lbs</div>
          </div>
          <div className="p-4 rounded-lg bg-primary/5">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Average Weight
            </div>
            <div className="text-2xl font-bold">
              {getAverageWeight().toFixed(1)} lbs
            </div>
          </div>
          <div className="p-4 rounded-lg bg-primary/5">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Total Volume
            </div>
            <div className="text-2xl font-bold">{getTotalVolume()} lbs</div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium mb-2">Recent Sets</h4>
          <div className="space-y-2">
            {logs.slice(-5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm"
              >
                <div>
                  <div className="font-medium">
                    {log.weight} lbs × {log.reps} reps
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Set {log.set_number} •{" "}
                    {format(new Date(log.date), "MMM d, yyyy")}
                  </div>
                </div>
                {log.notes && (
                  <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {log.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
