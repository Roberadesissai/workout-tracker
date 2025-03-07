"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";
import { workouts } from "@/data/workouts";
import ExerciseItem from "@/components/ExerciseItem";
import { useState, useEffect } from "react";
import {
  supabase,
  getWorkoutLog,
  saveWorkoutLog,
} from "@/utils/supabase/client";
import { Toaster } from "@/components/ui/sonner";

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  time?: string;
  note?: string;
  type: "primary" | "optional" | "cardio" | "circuit" | "daily";
  category?: string;
}

interface WorkoutLogItem {
  completed: boolean;
  weights: string[];
}

export default function WorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<{
    name: string;
    exercises: Exercise[];
  } | null>(null);
  const [workoutLog, setWorkoutLog] = useState<Record<string, WorkoutLogItem>>(
    {}
  );
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get the current user
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        console.error("Error getting user:", error);
        router.push("/login");
        return;
      }
      setUserId(user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!params.date || !userId) return;

    try {
      // Get the day name from the URL and capitalize first letter
      const dayName =
        (params.date as string).charAt(0).toUpperCase() +
        (params.date as string).slice(1);

      // Get the workout for this day
      const dayWorkout = workouts[dayName as keyof typeof workouts];
      if (!dayWorkout) {
        throw new Error("No workout found for this day");
      }
      setWorkout(dayWorkout);

      // Get the saved log from Supabase
      getWorkoutLog(userId, dayName).then((data) => {
        if (data) {
          // Convert the database format to our local format
          const logData: Record<string, WorkoutLogItem> = {};
          data.exercise_logs.forEach((log: any) => {
            logData[log.exercise_id] = {
              completed: log.completed,
              weights: log.weight_used.map(String),
            };
          });
          setWorkoutLog(logData);
        }
      });
    } catch (error) {
      console.error("Error loading workout:", error);
      router.push("/");
    }
  }, [params.date, userId, router]);

  const handleExerciseComplete = async (
    exerciseName: string,
    data: WorkoutLogItem
  ) => {
    if (!params.date || !userId || !workout) return;

    const dayName =
      (params.date as string).charAt(0).toUpperCase() +
      (params.date as string).slice(1);

    // Update local state
    const newLog = {
      ...workoutLog,
      [exerciseName]: data,
    };
    setWorkoutLog(newLog);

    // Prepare data for database
    const exerciseData = workout.exercises.map((exercise) => ({
      exerciseId: exercise.name,
      completed: !!newLog[exercise.name]?.completed,
      weights: newLog[exercise.name]?.weights || [],
      sets_completed: exercise.sets,
      reps_completed: exercise.reps ? [exercise.reps] : [],
    }));

    // Save to database
    try {
      await saveWorkoutLog(userId, dayName, dayName, exerciseData);
      toast({
        title: "Progress saved",
        description: "Your workout progress has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving workout:", error);
      toast({
        title: "Error saving progress",
        description:
          "There was a problem saving your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!workout) {
    return (
      <div className="container max-w-4xl mx-auto px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No workout scheduled for this day.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal hover:bg-transparent"
                onClick={() => router.back()}
              >
                <span className="text-lg text-muted-foreground">←</span>
              </Button>
              <CardTitle className="text-xl font-semibold text-foreground">
                {workout.name}
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {(params.date as string).charAt(0).toUpperCase() +
                (params.date as string).slice(1)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {workout.exercises.map((exercise, index) => (
            <ExerciseItem
              key={index}
              exercise={exercise}
              onComplete={handleExerciseComplete}
              isCompleted={!!workoutLog[exercise.name]?.completed}
              workoutLog={workoutLog[exercise.name]}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
