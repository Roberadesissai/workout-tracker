"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

interface WorkoutTrackerProps {
  exerciseId: string;
  sets: number;
  reps: string;
  onComplete?: () => void;
  isCompleted?: boolean;
}

interface SetLog {
  weight: string;
  actualReps: string;
  notes: string;
}

export function WorkoutTracker({
  exerciseId,
  sets,
  reps,
  onComplete,
  isCompleted = false,
}: WorkoutTrackerProps) {
  const [logs, setLogs] = useState<SetLog[]>(
    Array(sets).fill({ weight: "", actualReps: "", notes: "" })
  );
  const [completedSets, setCompletedSets] = useState<number[]>([]);

  const updateLog = (index: number, field: keyof SetLog, value: string) => {
    const newLogs = [...logs];
    newLogs[index] = { ...newLogs[index], [field]: value };
    setLogs(newLogs);
  };

  const saveSet = async (index: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in to save sets");
      return;
    }

    try {
      const { error } = await supabase.from("exercise_logs").insert({
        user_id: user.id,
        workout_exercise_id: exerciseId,
        set_number: index + 1,
        weight: parseFloat(logs[index].weight) || 0,
        reps: parseInt(logs[index].actualReps) || 0,
        notes: logs[index].notes || "",
      });

      if (error) {
        console.error("Error saving set:", error);
        toast.error("Failed to save set");
        return;
      }

      toast.success(`Set ${index + 1} saved`);
      handleSetComplete(index + 1);
    } catch (err) {
      console.error("Error saving set:", err);
      toast.error("Failed to save set");
    }
  };

  const handleSetComplete = (setNumber: number) => {
    if (completedSets.includes(setNumber)) {
      setCompletedSets(completedSets.filter((set) => set !== setNumber));
    } else {
      setCompletedSets([...completedSets, setNumber]);
      if (completedSets.length + 1 === sets && onComplete) {
        onComplete();
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-4 text-sm font-medium text-muted-foreground mb-2">
          <div>Weight (lbs)</div>
          <div>Reps ({reps})</div>
          <div>Notes</div>
          <div></div>
        </div>
        {Array.from({ length: sets }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_2fr_auto] gap-4 items-start"
          >
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="Weight"
              value={logs[index].weight}
              onChange={(e) => updateLog(index, "weight", e.target.value)}
              className="bg-background/50 backdrop-blur-sm border-muted"
            />
            <Input
              type="number"
              min="0"
              placeholder="Actual"
              value={logs[index].actualReps}
              onChange={(e) => updateLog(index, "actualReps", e.target.value)}
              className="bg-background/50 backdrop-blur-sm border-muted"
            />
            <Textarea
              placeholder="Notes"
              value={logs[index].notes}
              onChange={(e) => updateLog(index, "notes", e.target.value)}
              className="h-9 min-h-[2.25rem] bg-background/50 backdrop-blur-sm border-muted resize-none"
            />
            <Button
              variant={
                completedSets.includes(index + 1) ? "default" : "outline"
              }
              size="sm"
              onClick={() => saveSet(index)}
              className="bg-background/50 backdrop-blur-sm"
            >
              {completedSets.includes(index + 1) ? "Done" : "Save"}
            </Button>
          </div>
        ))}
        {isCompleted && (
          <div className="text-sm text-green-500 text-center mt-2">
            Exercise completed!
          </div>
        )}
      </div>
    </Card>
  );
}
